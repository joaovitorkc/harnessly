import os

from fastapi import FastAPI

app = FastAPI()
log_level = os.getenv("LOG_LEVEL", "info")


@app.get("/health", status_code=204)
def health() -> None:
    return None
