"""
DAG ETL para la Red Nacional de Monitoreo Hidrológico (SAT).

Cada 10 minutos:
  1. Extrae lecturas nuevas desde data/nivel_rio_sample.csv (o de la tabla
     de staging alimentada por el simulador de estaciones).
  2. Valida cada lectura: rango de nivel_m, batería baja, pérdida de señal.
  3. Carga las lecturas válidas a Postgres (fact_hydrology) y a InfluxDB
     (bucket de series temporales) para el dashboard de Grafana.
  4. Registra anomalías detectadas en la tabla `anomalias`.
"""
from __future__ import annotations

import csv
import logging
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator

logger = logging.getLogger(__name__)

# --- Configuración ---------------------------------------------------------

NIVEL_MIN_VALIDO = 0.0
NIVEL_MAX_VALIDO = 8.0
NIVEL_ALERTA = 2.5
BATERIA_MINIMA_PCT = 20
RSSI_MINIMO = -100

DATA_PATH = os.environ.get(
    "HYDRO_CSV_PATH", "/opt/airflow/data/nivel_rio_sample.csv"
)

HYDRO_PG_CONN = {
    "host": os.environ.get("HYDRO_PG_HOST", "hydro-postgres"),
    "port": os.environ.get("HYDRO_PG_PORT", "5432"),
    "dbname": os.environ.get("HYDRO_PG_DB", "hydro"),
    "user": os.environ.get("HYDRO_PG_USER", "hydro"),
    "password": os.environ.get("HYDRO_PG_PASSWORD", "hydro"),
}

INFLUXDB_URL = os.environ.get("INFLUXDB_URL", "http://influxdb:8086")
INFLUXDB_TOKEN = os.environ.get("INFLUXDB_TOKEN", "hydro-super-secret-token")
INFLUXDB_ORG = os.environ.get("INFLUXDB_ORG", "sat-hidrologico")
INFLUXDB_BUCKET = os.environ.get("INFLUXDB_BUCKET", "hidrologia")

XCOM_KEY = "lecturas_validadas"


# --- Tareas ------------------------------------------------------------


def _extraer_desde_staging() -> list[dict]:
    """Lee lecturas pendientes enviadas por el simulador vía POST /ingest."""
    import psycopg2
    import psycopg2.extras

    conn = psycopg2.connect(**HYDRO_PG_CONN)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, estacion_id, fecha_utc, nivel_m, precip_mm_1h,
                       precip_mm_24h, caudal_estimado, rssi, bateria_pct,
                       fuente_comunicacion
                FROM staging_lecturas
                WHERE NOT procesado
                ORDER BY recibido_at
                LIMIT 5000
                """
            )
            filas = [dict(r) for r in cur.fetchall()]
            if filas:
                ids = [f["id"] for f in filas]
                cur.execute(
                    "UPDATE staging_lecturas SET procesado = TRUE WHERE id = ANY(%s)",
                    (ids,),
                )
                conn.commit()
    finally:
        conn.close()

    for f in filas:
        f["fecha_utc"] = f["fecha_utc"].strftime("%Y-%m-%dT%H:%M:%SZ")
    return filas


def _extraer_desde_csv() -> list[dict]:
    if not os.path.exists(DATA_PATH):
        logger.warning("No existe %s, no hay lecturas que procesar", DATA_PATH)
        return []
    with open(DATA_PATH, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def extraer_lecturas(**context):
    """Extrae lecturas pendientes de staging (simulador) y, si no hay
    ninguna (ej. primera ejecución de demo), del CSV sintético."""
    filas = _extraer_desde_staging()
    origen = "staging_lecturas"

    if not filas:
        filas = _extraer_desde_csv()
        origen = DATA_PATH

    logger.info("Extraídas %d filas desde %s", len(filas), origen)
    context["ti"].xcom_push(key="lecturas_crudas", value=filas)
    return len(filas)


def _validar_fila(fila: dict) -> tuple[bool, list[str]]:
    """Aplica las 3 validaciones de anomalía. Devuelve (es_valida, anomalias)."""
    anomalias = []

    try:
        nivel_m = float(fila["nivel_m"])
    except (KeyError, ValueError, TypeError):
        anomalias.append("nivel_invalido")
        nivel_m = None

    if nivel_m is not None and not (NIVEL_MIN_VALIDO <= nivel_m <= NIVEL_MAX_VALIDO):
        anomalias.append("nivel_fuera_de_rango")

    try:
        bateria_pct = float(fila["bateria_pct"])
        if bateria_pct < BATERIA_MINIMA_PCT:
            anomalias.append("bateria_baja")
    except (KeyError, ValueError, TypeError):
        anomalias.append("bateria_invalida")

    try:
        rssi = int(float(fila["rssi"]))
        if rssi < RSSI_MINIMO:
            anomalias.append("perdida_de_senal")
    except (KeyError, ValueError, TypeError):
        anomalias.append("rssi_invalido")

    # Una fila se considera "válida" (cargable) si el nivel es numérico y
    # está en rango; batería baja y pérdida de señal se registran como
    # anomalías pero no descartan la lectura (son señales de alerta, no
    # datos corruptos).
    es_valida = nivel_m is not None and "nivel_fuera_de_rango" not in anomalias
    return es_valida, anomalias


def validar_lecturas(**context):
    ti = context["ti"]
    filas = ti.xcom_pull(key="lecturas_crudas", task_ids="extraer_lecturas") or []

    validas = []
    anomalas = []

    for fila in filas:
        es_valida, tipos_anomalia = _validar_fila(fila)
        if tipos_anomalia:
            for tipo in tipos_anomalia:
                anomalas.append(
                    {
                        "estacion_id": fila.get("estacion_id"),
                        "fecha_utc": fila.get("fecha_utc"),
                        "tipo_anomalia": tipo,
                        "detalle": f"nivel_m={fila.get('nivel_m')} "
                        f"bateria_pct={fila.get('bateria_pct')} "
                        f"rssi={fila.get('rssi')}",
                        "severidad": "alta"
                        if tipo in ("nivel_fuera_de_rango", "perdida_de_senal")
                        else "media",
                    }
                )
        if es_valida:
            validas.append(fila)

    logger.info(
        "Validación: %d válidas, %d anomalías detectadas (de %d filas)",
        len(validas),
        len(anomalas),
        len(filas),
    )

    ti.xcom_push(key=XCOM_KEY, value=validas)
    ti.xcom_push(key="anomalias_detectadas", value=anomalas)
    return {"validas": len(validas), "anomalas": len(anomalas)}


def cargar_postgres(**context):
    import psycopg2
    from psycopg2.extras import execute_values

    ti = context["ti"]
    validas = ti.xcom_pull(key=XCOM_KEY, task_ids="validar_lecturas") or []
    anomalas = (
        ti.xcom_pull(key="anomalias_detectadas", task_ids="validar_lecturas") or []
    )

    if not validas and not anomalas:
        logger.info("Nada que cargar a Postgres")
        return 0

    conn = psycopg2.connect(**HYDRO_PG_CONN)
    try:
        with conn.cursor() as cur:
            if validas:
                registros = [
                    (
                        f["estacion_id"],
                        f["fecha_utc"],
                        f["nivel_m"],
                        f.get("precip_mm_1h"),
                        f.get("precip_mm_24h"),
                        f.get("caudal_estimado"),
                        f.get("rssi"),
                        f.get("bateria_pct"),
                        f.get("fuente_comunicacion"),
                        f.get("target_riesgo"),
                    )
                    for f in validas
                ]
                execute_values(
                    cur,
                    """
                    INSERT INTO fact_hydrology (
                        estacion_id, fecha_utc, nivel_m, precip_mm_1h,
                        precip_mm_24h, caudal_estimado, rssi, bateria_pct,
                        fuente_comunicacion, target_riesgo
                    ) VALUES %s
                    ON CONFLICT (estacion_id, fecha_utc) DO UPDATE SET
                        nivel_m = EXCLUDED.nivel_m,
                        precip_mm_1h = EXCLUDED.precip_mm_1h,
                        precip_mm_24h = EXCLUDED.precip_mm_24h,
                        caudal_estimado = EXCLUDED.caudal_estimado,
                        rssi = EXCLUDED.rssi,
                        bateria_pct = EXCLUDED.bateria_pct,
                        fuente_comunicacion = EXCLUDED.fuente_comunicacion,
                        target_riesgo = EXCLUDED.target_riesgo
                    """,
                    registros,
                )

            if anomalas:
                registros_anom = [
                    (
                        a["estacion_id"],
                        a["fecha_utc"],
                        a["tipo_anomalia"],
                        a["detalle"],
                        a["severidad"],
                    )
                    for a in anomalas
                ]
                execute_values(
                    cur,
                    """
                    INSERT INTO anomalias (
                        estacion_id, fecha_utc, tipo_anomalia, detalle, severidad
                    ) VALUES %s
                    """,
                    registros_anom,
                )
        conn.commit()
    finally:
        conn.close()

    logger.info(
        "Cargadas %d lecturas y %d anomalías a Postgres", len(validas), len(anomalas)
    )
    return len(validas)


def cargar_influxdb(**context):
    from influxdb_client import InfluxDBClient, Point, WritePrecision
    from influxdb_client.client.write_api import SYNCHRONOUS

    ti = context["ti"]
    validas = ti.xcom_pull(key=XCOM_KEY, task_ids="validar_lecturas") or []

    if not validas:
        logger.info("Nada que cargar a InfluxDB")
        return 0

    client = InfluxDBClient(
        url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG
    )
    try:
        write_api = client.write_api(write_options=SYNCHRONOUS)
        puntos = []
        for f in validas:
            punto = (
                Point("lectura_hidrologica")
                .tag("estacion_id", f["estacion_id"])
                .tag("fuente_comunicacion", f.get("fuente_comunicacion", "desconocida"))
                .field("nivel_m", float(f["nivel_m"]))
                .field("precip_mm_1h", float(f.get("precip_mm_1h") or 0))
                .field("precip_mm_24h", float(f.get("precip_mm_24h") or 0))
                .field("caudal_estimado", float(f.get("caudal_estimado") or 0))
                .field("rssi", int(float(f.get("rssi") or 0)))
                .field("bateria_pct", float(f.get("bateria_pct") or 0))
                .time(f["fecha_utc"], WritePrecision.S)
            )
            puntos.append(punto)

        write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=puntos)
    finally:
        client.close()

    logger.info("Escritos %d puntos en InfluxDB (bucket=%s)", len(validas), INFLUXDB_BUCKET)
    return len(validas)


def resumen_pipeline(**context):
    ti = context["ti"]
    validas = ti.xcom_pull(key=XCOM_KEY, task_ids="validar_lecturas") or []
    anomalas = (
        ti.xcom_pull(key="anomalias_detectadas", task_ids="validar_lecturas") or []
    )
    logger.info(
        "Resumen ejecución %s: %d lecturas válidas, %d anomalías",
        context["run_id"],
        len(validas),
        len(anomalas),
    )


# --- Definición del DAG --------------------------------------------------

default_args = {
    "owner": "sat-hidrologico",
    "retries": 2,
    "retry_delay": timedelta(minutes=1),
}

with DAG(
    dag_id="etl_hidrologico",
    description="ETL de la Red Nacional de Monitoreo Hidrológico (SAT)",
    default_args=default_args,
    schedule_interval="*/10 * * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["hidrologia", "sat", "riesgo-desastres"],
) as dag:

    t_extraer = PythonOperator(
        task_id="extraer_lecturas",
        python_callable=extraer_lecturas,
    )

    t_validar = PythonOperator(
        task_id="validar_lecturas",
        python_callable=validar_lecturas,
    )

    t_cargar_pg = PythonOperator(
        task_id="cargar_postgres",
        python_callable=cargar_postgres,
    )

    t_cargar_influx = PythonOperator(
        task_id="cargar_influxdb",
        python_callable=cargar_influxdb,
    )

    t_resumen = PythonOperator(
        task_id="resumen_pipeline",
        python_callable=resumen_pipeline,
    )

    t_extraer >> t_validar >> [t_cargar_pg, t_cargar_influx] >> t_resumen
