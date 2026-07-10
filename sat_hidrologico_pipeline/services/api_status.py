"""
API de estado del pipeline hidrológico (SAT).

Endpoints:
  GET /status          -> estado del pipeline (última ejecución, conteo de
                          estaciones activas, salud de la BD)
  GET /last-readings    -> últimas 10 lecturas por estación
  GET /alerts           -> anomalías detectadas (nivel fuera de rango,
                          batería baja, pérdida de señal)

Ejecutar con:
    uvicorn services.api_status:app --host 0.0.0.0 --port 8000 --reload
"""
import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

import psycopg2
import psycopg2.extras
from fastapi import FastAPI, HTTPException, Query, status as http_status
from pydantic import BaseModel

PG_CONN = {
    "host": os.environ.get("HYDRO_PG_HOST", "localhost"),
    "port": os.environ.get("HYDRO_PG_PORT", "5433"),
    "dbname": os.environ.get("HYDRO_PG_DB", "hydro"),
    "user": os.environ.get("HYDRO_PG_USER", "hydro"),
    "password": os.environ.get("HYDRO_PG_PASSWORD", "hydro"),
}

ESTACION_INACTIVA_MIN = 60  # minutos sin reportar -> se considera inactiva

app = FastAPI(
    title="SAT Hidrológico - API de Estado",
    description="Estado del pipeline, últimas lecturas y alertas de la Red "
    "Nacional de Monitoreo Hidrológico",
    version="1.0.0",
)


@contextmanager
def get_conn():
    conn = psycopg2.connect(**PG_CONN)
    try:
        yield conn
    finally:
        conn.close()


def _dict_cursor(conn):
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)


@app.get("/status")
def status():
    """Estado general del pipeline: última carga, estaciones activas, BD."""
    try:
        with get_conn() as conn, _dict_cursor(conn) as cur:
            cur.execute("SELECT COUNT(*) AS total FROM fact_hydrology")
            total_lecturas = cur.fetchone()["total"]

            cur.execute(
                "SELECT MAX(ingested_at) AS ultima_carga FROM fact_hydrology"
            )
            ultima_carga = cur.fetchone()["ultima_carga"]

            cur.execute(
                """
                SELECT COUNT(DISTINCT estacion_id) AS estaciones_activas
                FROM fact_hydrology
                WHERE fecha_utc > now() - interval '%s minutes'
                """,
                (ESTACION_INACTIVA_MIN,),
            )
            estaciones_activas = cur.fetchone()["estaciones_activas"]

            cur.execute("SELECT COUNT(DISTINCT estacion_id) AS total FROM fact_hydrology")
            estaciones_totales = cur.fetchone()["total"]

            cur.execute(
                """
                SELECT COUNT(*) AS total FROM anomalias
                WHERE detectado_at > now() - interval '24 hours'
                """
            )
            anomalias_24h = cur.fetchone()["total"]

        return {
            "servicio": "sat_hidrologico_pipeline",
            "estado": "operativo",
            "base_datos": "conectada",
            "total_lecturas": total_lecturas,
            "ultima_carga_utc": ultima_carga,
            "estaciones_activas": estaciones_activas,
            "estaciones_totales": estaciones_totales,
            "anomalias_ultimas_24h": anomalias_24h,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except psycopg2.OperationalError as e:
        return {
            "servicio": "sat_hidrologico_pipeline",
            "estado": "degradado",
            "base_datos": "desconectada",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@app.get("/last-readings")
def last_readings(estacion_id: Optional[str] = Query(None, description="Filtrar por estación")):
    """Últimas 10 lecturas por estación (o de una estación específica)."""
    try:
        with get_conn() as conn, _dict_cursor(conn) as cur:
            if estacion_id:
                cur.execute(
                    """
                    SELECT estacion_id, fecha_utc, nivel_m, precip_mm_1h,
                           precip_mm_24h, caudal_estimado, rssi, bateria_pct,
                           fuente_comunicacion, target_riesgo
                    FROM fact_hydrology
                    WHERE estacion_id = %s
                    ORDER BY fecha_utc DESC
                    LIMIT 10
                    """,
                    (estacion_id,),
                )
                lecturas = cur.fetchall()
                if not lecturas:
                    raise HTTPException(
                        status_code=404,
                        detail=f"No hay lecturas para la estación {estacion_id}",
                    )
                return {"estacion_id": estacion_id, "lecturas": lecturas}

            cur.execute(
                """
                SELECT estacion_id, fecha_utc, nivel_m, precip_mm_1h,
                       precip_mm_24h, caudal_estimado, rssi, bateria_pct,
                       fuente_comunicacion, target_riesgo
                FROM (
                    SELECT *,
                           ROW_NUMBER() OVER (
                               PARTITION BY estacion_id ORDER BY fecha_utc DESC
                           ) AS rn
                    FROM fact_hydrology
                ) sub
                WHERE rn <= 10
                ORDER BY estacion_id, fecha_utc DESC
                """
            )
            filas = cur.fetchall()

        por_estacion: dict[str, list] = {}
        for fila in filas:
            por_estacion.setdefault(fila["estacion_id"], []).append(fila)

        return {"estaciones": por_estacion, "total_estaciones": len(por_estacion)}
    except HTTPException:
        raise
    except psycopg2.OperationalError as e:
        raise HTTPException(status_code=503, detail=f"Base de datos no disponible: {e}")


@app.get("/alerts")
def alerts(
    horas: int = Query(24, description="Ventana de tiempo en horas"),
    severidad: Optional[str] = Query(None, description="Filtrar por severidad"),
):
    """Anomalías detectadas: nivel fuera de rango, batería baja, pérdida de señal."""
    try:
        with get_conn() as conn, _dict_cursor(conn) as cur:
            query = """
                SELECT estacion_id, fecha_utc, tipo_anomalia, detalle,
                       severidad, detectado_at
                FROM anomalias
                WHERE detectado_at > now() - interval '%s hours'
            """
            params = [horas]
            if severidad:
                query += " AND severidad = %s"
                params.append(severidad)
            query += " ORDER BY detectado_at DESC LIMIT 500"

            cur.execute(query, tuple(params))
            anomalias = cur.fetchall()

            cur.execute(
                """
                SELECT tipo_anomalia, COUNT(*) AS total
                FROM anomalias
                WHERE detectado_at > now() - interval '%s hours'
                GROUP BY tipo_anomalia
                """,
                (horas,),
            )
            resumen = {r["tipo_anomalia"]: r["total"] for r in cur.fetchall()}

        return {
            "ventana_horas": horas,
            "total_alertas": len(anomalias),
            "resumen_por_tipo": resumen,
            "alertas": anomalias,
        }
    except psycopg2.OperationalError as e:
        raise HTTPException(status_code=503, detail=f"Base de datos no disponible: {e}")


class LecturaIngest(BaseModel):
    estacion_id: str
    fecha_utc: str
    nivel_m: float
    precip_mm_1h: Optional[float] = None
    precip_mm_24h: Optional[float] = None
    caudal_estimado: Optional[float] = None
    rssi: Optional[int] = None
    bateria_pct: Optional[float] = None
    fuente_comunicacion: Optional[str] = "desconocida"


@app.post("/ingest", status_code=http_status.HTTP_201_CREATED)
def ingest(lectura: LecturaIngest):
    """Recibe lecturas de estaciones (LoRaWAN/satelital) enviadas por el
    simulador y las guarda en staging para que el DAG del ETL las procese."""
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO staging_lecturas (
                    estacion_id, fecha_utc, nivel_m, precip_mm_1h,
                    precip_mm_24h, caudal_estimado, rssi, bateria_pct,
                    fuente_comunicacion
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    lectura.estacion_id,
                    lectura.fecha_utc,
                    lectura.nivel_m,
                    lectura.precip_mm_1h,
                    lectura.precip_mm_24h,
                    lectura.caudal_estimado,
                    lectura.rssi,
                    lectura.bateria_pct,
                    lectura.fuente_comunicacion,
                ),
            )
            conn.commit()
        return {"recibido": True, "estacion_id": lectura.estacion_id}
    except psycopg2.OperationalError as e:
        raise HTTPException(status_code=503, detail=f"Base de datos no disponible: {e}")


@app.get("/")
def root():
    return {
        "servicio": "SAT Hidrológico - API de Estado",
        "endpoints": ["/status", "/last-readings", "/alerts", "/ingest", "/docs"],
    }
