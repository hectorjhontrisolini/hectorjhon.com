"""
Simulador de estaciones de monitoreo hidrológico.

Simula hasta N estaciones (LoRaWAN y satelital) enviando lecturas por HTTP
POST al endpoint /ingest de la API del pipeline (services/api_status.py).

Uso:
    python scripts/simulator.py --estaciones 200 --rondas 1 --api-url http://localhost:8000

Criterio de aceptación: procesar 200 estaciones simuladas en < 10 min.
Este script mide y reporta el tiempo total de envío.
"""
import argparse
import concurrent.futures
import random
import sys
import time
from datetime import datetime, timezone

import requests

FUENTES = ["lorawan", "satelital"]
PREFIJOS = [
    "RIMAC", "CHILLON", "LURIN", "MANTARO", "SANTA",
    "CHIRA", "TUMBES", "PIURA", "MARANON", "UCAYALI",
    "APURIMAC", "URUBAMBA", "HUALLAGA", "VILCANOTA", "MOCHE",
    "TAMBO", "CHICAMA", "JEQUETEPEQUE", "ZANA", "CAMANA",
]


def generar_id_estaciones(n: int) -> list[str]:
    ids = []
    i = 0
    while len(ids) < n:
        prefijo = PREFIJOS[i % len(PREFIJOS)]
        idx = i // len(PREFIJOS) + 1
        ids.append(f"{prefijo}_{idx:03d}")
        i += 1
    return ids


def generar_lectura(estacion_id: str, rng: random.Random, forzar_anomalia: bool = False) -> dict:
    nivel_m = round(rng.uniform(0.5, 2.2), 2)
    bateria_pct = round(rng.uniform(40, 100), 1)
    rssi = rng.randint(-95, -60)

    if forzar_anomalia or rng.random() < 0.05:
        tipo = rng.choice(["nivel", "bateria", "senal"])
        if tipo == "nivel":
            nivel_m = round(rng.choice([-2.0, 9.5, 15.0]), 2)
        elif tipo == "bateria":
            bateria_pct = round(rng.uniform(2, 19), 1)
        else:
            rssi = rng.randint(-140, -101)

    return {
        "estacion_id": estacion_id,
        "fecha_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "nivel_m": nivel_m,
        "precip_mm_1h": round(rng.uniform(0, 12), 1),
        "precip_mm_24h": round(rng.uniform(0, 40), 1),
        "caudal_estimado": round(nivel_m * rng.uniform(1.8, 2.6), 2),
        "rssi": rssi,
        "bateria_pct": bateria_pct,
        "fuente_comunicacion": rng.choice(FUENTES),
    }


def enviar_lectura(api_url: str, lectura: dict, timeout: float) -> tuple[bool, str]:
    try:
        resp = requests.post(f"{api_url}/ingest", json=lectura, timeout=timeout)
        if resp.status_code == 201:
            return True, ""
        return False, f"HTTP {resp.status_code}: {resp.text[:200]}"
    except requests.RequestException as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(description="Simulador de estaciones hidrológicas")
    parser.add_argument("--estaciones", type=int, default=200, help="Número de estaciones a simular")
    parser.add_argument("--rondas", type=int, default=1, help="Número de lecturas por estación")
    parser.add_argument("--intervalo", type=float, default=0, help="Segundos entre rondas")
    parser.add_argument("--api-url", type=str, default="http://localhost:8000", help="URL base de la API")
    parser.add_argument("--concurrencia", type=int, default=20, help="Requests concurrentes")
    parser.add_argument("--timeout", type=float, default=5.0, help="Timeout por request (s)")
    parser.add_argument("--seed", type=int, default=None, help="Semilla RNG (reproducibilidad)")
    args = parser.parse_args()

    rng = random.Random(args.seed)
    estaciones = generar_id_estaciones(args.estaciones)

    print(f"Simulando {len(estaciones)} estaciones x {args.rondas} ronda(s) -> {args.api_url}/ingest")

    inicio = time.monotonic()
    total_ok = 0
    total_error = 0
    errores_muestra = []

    for ronda in range(args.rondas):
        lecturas = [generar_lectura(eid, rng) for eid in estaciones]

        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrencia) as pool:
            futuros = [
                pool.submit(enviar_lectura, args.api_url, lectura, args.timeout)
                for lectura in lecturas
            ]
            for fut in concurrent.futures.as_completed(futuros):
                ok, err = fut.result()
                if ok:
                    total_ok += 1
                else:
                    total_error += 1
                    if len(errores_muestra) < 5:
                        errores_muestra.append(err)

        print(f"Ronda {ronda + 1}/{args.rondas} completada")
        if args.intervalo > 0 and ronda < args.rondas - 1:
            time.sleep(args.intervalo)

    duracion = time.monotonic() - inicio
    print("---")
    print(f"Enviadas OK: {total_ok}  |  Errores: {total_error}  |  Duración: {duracion:.2f}s")
    if errores_muestra:
        print("Muestra de errores:")
        for e in errores_muestra:
            print(f"  - {e}")

    if duracion > 600:
        print("ADVERTENCIA: supera el criterio de aceptación de < 10 min")
        sys.exit(1)


if __name__ == "__main__":
    main()
