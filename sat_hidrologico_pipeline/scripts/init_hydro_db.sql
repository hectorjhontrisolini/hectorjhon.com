-- Esquema inicial para la Red Nacional de Monitoreo Hidrológico (SAT)

CREATE TABLE IF NOT EXISTS fact_hydrology (
    id BIGSERIAL PRIMARY KEY,
    estacion_id VARCHAR(50) NOT NULL,
    fecha_utc TIMESTAMPTZ NOT NULL,
    nivel_m NUMERIC(6, 2) NOT NULL,
    precip_mm_1h NUMERIC(6, 2),
    precip_mm_24h NUMERIC(6, 2),
    caudal_estimado NUMERIC(8, 2),
    rssi INTEGER,
    bateria_pct NUMERIC(5, 1),
    fuente_comunicacion VARCHAR(20),
    target_riesgo SMALLINT,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (estacion_id, fecha_utc)
);

CREATE INDEX IF NOT EXISTS idx_fact_hydrology_estacion_fecha
    ON fact_hydrology (estacion_id, fecha_utc DESC);

CREATE TABLE IF NOT EXISTS dim_estacion (
    estacion_id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(120),
    cuenca VARCHAR(80),
    latitud NUMERIC(9, 6),
    longitud NUMERIC(9, 6),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS anomalias (
    id BIGSERIAL PRIMARY KEY,
    estacion_id VARCHAR(50) NOT NULL,
    fecha_utc TIMESTAMPTZ NOT NULL,
    tipo_anomalia VARCHAR(40) NOT NULL,
    detalle TEXT,
    severidad VARCHAR(20) NOT NULL DEFAULT 'media',
    detectado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalias_fecha
    ON anomalias (fecha_utc DESC);

CREATE TABLE IF NOT EXISTS staging_lecturas (
    id BIGSERIAL PRIMARY KEY,
    estacion_id VARCHAR(50) NOT NULL,
    fecha_utc TIMESTAMPTZ NOT NULL,
    nivel_m NUMERIC(6, 2),
    precip_mm_1h NUMERIC(6, 2),
    precip_mm_24h NUMERIC(6, 2),
    caudal_estimado NUMERIC(8, 2),
    rssi INTEGER,
    bateria_pct NUMERIC(5, 1),
    fuente_comunicacion VARCHAR(20),
    recibido_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    procesado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_staging_procesado
    ON staging_lecturas (procesado)
    WHERE NOT procesado;

CREATE TABLE IF NOT EXISTS pipeline_runs (
    id BIGSERIAL PRIMARY KEY,
    run_id VARCHAR(120) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    filas_procesadas INTEGER DEFAULT 0,
    filas_validas INTEGER DEFAULT 0,
    filas_anomalas INTEGER DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso'
);
