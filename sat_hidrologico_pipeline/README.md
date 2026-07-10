# SAT Hidrológico Pipeline

Pipeline ETL automatizada para una **Red Nacional de Monitoreo Hidrológico**
(Sistema de Alerta Temprana - SAT), orientada a Gestión del Riesgo de
Desastres. Ingiere lecturas de estaciones remotas (nivel de río,
precipitación, batería, señal), valida anomalías, y las carga a Postgres e
InfluxDB para su visualización en Grafana y consulta vía API.

## Estructura del proyecto

```
sat_hidrologico_pipeline/
    dags/                       # DAGs de Airflow
        etl_hidrologico.py
    scripts/                    # Utilidades y simulador
        generate_dataset.py
        init_hydro_db.sql
        simulator.py
    services/                   # API de estado (FastAPI)
        api_status.py
        Dockerfile
        requirements.txt
    data/                       # Dataset sintético
        nivel_rio_sample.csv
    dashboards/                 # Dashboard de Grafana (provisioning)
        dashboard-provider.yml
        json/sat_hidrologico.json
    config/
        grafana-datasources.yml
    reports/                    # Salidas de análisis / notebooks
    notebooks/                  # Notebooks exploratorios
    docker-compose.yml
    README.md
```

## Arquitectura

```
Estaciones (LoRaWAN / satelital)
        |  HTTP POST /ingest
        v
   FastAPI (api_status)  --------> staging_lecturas (Postgres)
        |
        |  cada 10 min
        v
   Airflow DAG (etl_hidrologico)
        |-- extraer_lecturas    (staging o CSV de bootstrap)
        |-- validar_lecturas    (rango, batería, señal)
        |-- cargar_postgres     -> fact_hydrology, anomalias
        |-- cargar_influxdb     -> bucket "hidrologia" (series temporales)
        v
   Grafana  <---- InfluxDB (series) + Postgres (tablas/alertas)
   API /status /last-readings /alerts  <---- Postgres
```

## 1. Requisitos e instalación (entorno local sin Docker)

```bash
pip install apache-airflow pandas sqlalchemy influxdb-client fastapi uvicorn
```

Para el servicio de API y el simulador instala además:

```bash
pip install psycopg2-binary requests
```

> Recomendado: usa un entorno virtual (`python -m venv venv`) antes de instalar.

## 2. Levantar la infraestructura completa (Docker Compose)

Requiere Docker y Docker Compose instalados.

```bash
docker compose up -d --build
```

Esto levanta:

| Servicio            | Puerto | Descripción                              |
|---------------------|--------|-------------------------------------------|
| airflow-webserver    | 8080   | UI de Airflow (usuario/clave: admin/admin) |
| hydro-postgres       | 5433   | Base de datos de dominio (fact_hydrology)  |
| influxdb             | 8086   | Series temporales                          |
| api-status           | 8000   | API FastAPI de estado                      |
| grafana              | 3000   | Dashboards (usuario/clave: admin/admin)    |

Espera ~30-60s a que `airflow-init` termine de migrar la base de datos antes
de que el scheduler/webserver queden operativos.

## 3. Generar el dataset sintético

```bash
python scripts/generate_dataset.py
```

Genera `data/nivel_rio_sample.csv` con columnas:

```
estacion_id,fecha_utc,nivel_m,precip_mm_1h,precip_mm_24h,caudal_estimado,rssi,bateria_pct,fuente_comunicacion,target_riesgo
RIMAC_001,2026-01-21T10:00:00Z,1.23,2.1,12.5,3.2,-87,78,lorawan,0
RIMAC_001,2026-01-21T11:00:00Z,2.95,8.4,20.1,5.8,-90,75,satelital,1
```

Este CSV se usa como carga inicial de bootstrap del DAG cuando aún no hay
lecturas en la tabla de staging (por ejemplo, antes de correr el simulador).

## 4. DAG de Airflow — `etl_hidrologico`

- **Schedule:** `*/10 * * * *` (cada 10 minutos)
- **Tareas:** `extraer_lecturas -> validar_lecturas -> [cargar_postgres, cargar_influxdb] -> resumen_pipeline`
- **Validaciones de anomalías:**
  1. `nivel_m` fuera de rango (< 0 m o > 8 m) -> descarta la lectura y registra anomalía `nivel_fuera_de_rango`
  2. `bateria_pct < 20` -> anomalía `bateria_baja` (la lectura igual se carga)
  3. `rssi < -100` -> anomalía `perdida_de_senal` (la lectura igual se carga)
- **Carga:** filas válidas a `fact_hydrology` (Postgres) y al bucket `hidrologia` en InfluxDB; anomalías a la tabla `anomalias`.

Activa el DAG desde la UI de Airflow (http://localhost:8080) o con:

```bash
docker compose exec airflow-webserver airflow dags unpause etl_hidrologico
docker compose exec airflow-webserver airflow dags trigger etl_hidrologico
```

## 5. Servicio FastAPI — `services/api_status.py`

Ejecución local (sin Docker):

```bash
uvicorn services.api_status:app --host 0.0.0.0 --port 8000 --reload
```

Endpoints:

| Método | Ruta             | Descripción                                   |
|--------|------------------|------------------------------------------------|
| GET    | `/status`        | Estado del pipeline, estaciones activas, salud de BD |
| GET    | `/last-readings` | Últimas 10 lecturas por estación                |
| GET    | `/alerts`        | Anomalías detectadas (nivel, batería, señal)    |
| POST   | `/ingest`        | Recibe lecturas del simulador de estaciones     |
| GET    | `/docs`          | Documentación interactiva (Swagger UI)          |

## 6. Simulador de estaciones — `scripts/simulator.py`

Simula estaciones LoRaWAN/satelitales enviando lecturas por HTTP POST al
endpoint `/ingest` de la API.

```bash
python scripts/simulator.py --estaciones 200 --rondas 1 --api-url http://localhost:8000
```

Parámetros principales:

- `--estaciones`: número de estaciones simuladas (por defecto 200)
- `--rondas`: número de lecturas por estación
- `--intervalo`: segundos entre rondas
- `--concurrencia`: requests HTTP concurrentes (por defecto 20)

El script mide e imprime la duración total y valida el criterio de
aceptación de **< 10 minutos para 200 estaciones**.

## 7. Dashboard de Grafana

Provisionado automáticamente al levantar `docker compose up`
(`dashboards/dashboard-provider.yml` + `dashboards/json/sat_hidrologico.json`).

Accede en http://localhost:3000 (admin/admin) → carpeta **SAT Hidrologico**.

Paneles incluidos:

1. **Nivel de río (m) por estación** — series temporales desde InfluxDB, con umbral visual en 2.5 m
2. **Batería de estaciones (%)** — umbral rojo bajo 20%
3. **Calidad de señal (RSSI dBm)** — umbral rojo bajo -100 dBm
4. **Alertas activas: nivel_m > 2.5** — tabla desde Postgres (`fact_hydrology`)
5. **Anomalías detectadas (últimas 24h)** — tabla desde Postgres (`anomalias`)

## 8. Criterios de aceptación

| Criterio                                          | Cómo se verifica |
|----------------------------------------------------|-------------------|
| Procesar 200 estaciones simuladas en < 10 min      | `python scripts/simulator.py --estaciones 200` reporta la duración total |
| Detectar 3 tipos de anomalías                      | `nivel_fuera_de_rango`, `bateria_baja`, `perdida_de_senal` en tabla `anomalias` / endpoint `/alerts` |
| API funcionando                                    | `curl http://localhost:8000/status` |
| Dashboard operativo                                | Grafana en http://localhost:3000, carpeta "SAT Hidrologico" |

## Flujo de prueba end-to-end

```bash
# 1. Levantar infraestructura
docker compose up -d --build

# 2. Generar dataset de bootstrap (opcional, ya incluido en el repo)
python scripts/generate_dataset.py

# 3. Disparar el DAG para cargar el CSV de bootstrap
docker compose exec airflow-webserver airflow dags trigger etl_hidrologico

# 4. Simular 200 estaciones en tiempo real
python scripts/simulator.py --estaciones 200 --rondas 3 --intervalo 30

# 5. Verificar API y alertas
curl http://localhost:8000/status
curl http://localhost:8000/alerts
curl http://localhost:8000/last-readings

# 6. Ver el dashboard
# http://localhost:3000
```
