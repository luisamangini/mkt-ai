import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Header

app = FastAPI(title="MKT-AI API", version="1.0.0")

API_TOKEN = os.getenv("API_TOKEN", "")


def _verificar_token(authorization: str | None):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Token invalido")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/run/research")
def run_research(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)

    try:
        from backend.agents.research_agent import run

        output = run()

        return {
            "status": "ok",
            "temas": len(output.temas),
            "data": output.data,
            "temas_lista": [tema.titulo for tema in output.temas],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/content")
def run_content(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)

    try:
        from backend.agents.content_agent import run

        output = run()

        return {
            "status": "ok",
            "titulo": output.titulo_interno,
            "pilar": output.pilar.value,
            "formato": output.formato.value,
            "compliance": output.compliance_checou,
            "data": output.data,
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))