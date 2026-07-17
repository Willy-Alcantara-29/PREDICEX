# PREDICEX AI Service

Este directorio contiene el esqueleto del módulo predictivo de PREDICEX.

## Requisitos

- Python 3.10+
- Paquetes listados en `requirements.txt`

## Instalación

```bash
pip install -r src/ai/requirements.txt
```

## Ejecución

```bash
uvicorn src.ai.main:app --reload --host 0.0.0.0 --port 8001
```

## Endpoints

- GET `/health`
- POST `/forecast`
