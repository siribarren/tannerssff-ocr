import logging
import time
from functools import wraps

timer_history = {}

def procesar_stats(name: str, duracion_ms: int):
    stats = timer_history.setdefault(name, {"count": 0, "total_ms": 0.0, "min_ms": float("inf"), "max_ms": float("-inf")})

    stats["count"] += 1

    stats["total_ms"] += duracion_ms
    stats["min_ms"] = min(stats["min_ms"], duracion_ms)
    stats["max_ms"] = max(stats["max_ms"], duracion_ms)
    stats["avg_ms"] = stats["total_ms"] / stats["count"]

    can_txt = f"{stats['count']:>4}"
    min_txt = f"{stats['min_ms']:>5} [ms]"
    max_txt = f"{stats['max_ms']:>5} [ms]"
    avg_txt = f"{int(stats['avg_ms']):>5} [ms]"
    tot_txt = f"{int(stats['total_ms']):>6} [ms]"
    msg = f"Resumen {name:<40} | llamadas={can_txt} | min={min_txt} | max={max_txt} | avg={avg_txt} | total={tot_txt}"
    logging.debug(msg)


def my_timer(name: str):
    """
    Decorador que mide tiempo de ejecución y agrega entradas a history:
     - name
     - fecha_inicio
     - fecha_termino
     - duracion
    """

    def decorator(func):  # pyright: ignore[reportMissingParameterType]
        @wraps(func)
        def wrapper(*args, **kwargs):  # pyright: ignore[reportMissingParameterType]
            ini = time.perf_counter()
            result = func(*args, **kwargs)
            duracion_seg = time.perf_counter() - ini
            duracion_ms = int(duracion_seg * 1000)
            procesar_stats(name, duracion_ms)
            return result

        return wrapper

    return decorator