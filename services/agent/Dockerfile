ARG BASE_IMAGE=docker.m.daocloud.io/library/python:3.11-slim
FROM ${BASE_IMAGE}

ARG PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ENV PIP_INDEX_URL=${PIP_INDEX_URL} \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app
COPY alembic.ini ./alembic.ini
COPY alembic ./alembic

RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir .

EXPOSE 8100

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=4 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8100/health/live', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100", "--root-path", "/agent"]
