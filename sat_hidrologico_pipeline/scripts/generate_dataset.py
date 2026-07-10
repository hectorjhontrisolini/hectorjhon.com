"""
Genera data/nivel_rio_sample.csv con lecturas sintéticas de estaciones
hidrológicas (nivel de río, precipitación, batería, señal) incluyendo
casos normales y casos de anomalía para pruebas del pipeline ETL.
"""
import csv
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

RANDOM_SEED = 42
N_ESTACIONES = 20
HORAS_HISTORIA = 48
FUENTES = ["lorawan", "satelital", "gsm"]

ESTACIONES_PREFIJOS = [
    "RIMAC", "CHILLON", "LURIN", "MANTARO", "SANTA",
    "CHIRA", "TUMBES", "PIURA", "MARANON", "UCAYALI",
]

OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "nivel_rio_sample.csv"

FIELDNAMES = [
    "estacion_id",
    "fecha_utc",
    "nivel_m",
    "precip_mm_1h",
    "precip_mm_24h",
    "caudal_estimado",
    "rssi",
    "bateria_pct",
    "fuente_comunicacion",
    "target_riesgo",
]

NIVEL_ALERTA = 2.5
NIVEL_MIN_VALIDO = 0.0
NIVEL_MAX_VALIDO = 8.0


def generar_estaciones(n):
    estaciones = []
    for i in range(n):
        prefijo = ESTACIONES_PREFIJOS[i % len(ESTACIONES_PREFIJOS)]
        idx = i // len(ESTACIONES_PREFIJOS) + 1
        estaciones.append(f"{prefijo}_{idx:03d}")
    return estaciones


def simular_serie(estacion_id, rng):
    filas = []
    nivel_base = rng.uniform(0.8, 1.8)
    bateria = rng.uniform(70, 100)
    inicio = datetime(2026, 1, 20, 0, 0, 0, tzinfo=timezone.utc)

    evento_lluvia_inicio = rng.randint(10, HORAS_HISTORIA - 10)
    evento_lluvia_dur = rng.randint(4, 10)

    for h in range(HORAS_HISTORIA):
        fecha = inicio + timedelta(hours=h)

        en_evento = evento_lluvia_inicio <= h < evento_lluvia_inicio + evento_lluvia_dur
        precip_1h = rng.uniform(6, 15) if en_evento else rng.uniform(0, 3)
        precip_24h = precip_1h * rng.uniform(6, 10) if en_evento else rng.uniform(0, 12)

        if en_evento:
            nivel_base += rng.uniform(0.15, 0.45)
        else:
            nivel_base = max(0.3, nivel_base - rng.uniform(0.02, 0.1))

        nivel_m = round(nivel_base + rng.uniform(-0.05, 0.05), 2)
        caudal_estimado = round(nivel_m * rng.uniform(1.8, 2.6), 2)

        bateria -= rng.uniform(0.1, 0.5)
        if rng.random() < 0.03:
            bateria -= rng.uniform(10, 30)
        bateria = max(5, min(100, bateria))

        rssi = rng.randint(-95, -60)
        if rng.random() < 0.04:
            rssi = rng.randint(-130, -101)

        fuente = rng.choice(FUENTES)

        target_riesgo = 1 if (nivel_m > NIVEL_ALERTA or precip_1h > 10) else 0

        # Inyección ocasional de valores fuera de rango (sensor dañado)
        if rng.random() < 0.015:
            nivel_m = round(rng.choice([-1.5, 12.3, 25.0]), 2)
            target_riesgo = 1

        filas.append(
            {
                "estacion_id": estacion_id,
                "fecha_utc": fecha.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "nivel_m": nivel_m,
                "precip_mm_1h": round(precip_1h, 1),
                "precip_mm_24h": round(precip_24h, 1),
                "caudal_estimado": caudal_estimado,
                "rssi": rssi,
                "bateria_pct": round(bateria, 1),
                "fuente_comunicacion": fuente,
                "target_riesgo": target_riesgo,
            }
        )
    return filas


def main():
    rng = random.Random(RANDOM_SEED)
    estaciones = generar_estaciones(N_ESTACIONES)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        total = 0
        for estacion_id in estaciones:
            filas = simular_serie(estacion_id, rng)
            writer.writerows(filas)
            total += len(filas)

    print(f"Generadas {total} filas para {len(estaciones)} estaciones en {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
