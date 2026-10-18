# Fixed version tag; record the resolved base digest before reproducibility claims.
FROM python:3.13.7-slim-bookworm@sha256:adafcc17694d715c905b4c7bebd96907a1fd5cf183395f0ebc4d3428bd22d92d
ARG APP_VERSION=v1
ENV APP_VERSION=${APP_VERSION} PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY server.py /app/server.py
USER 10001:10001
EXPOSE 8080
CMD ["python", "/app/server.py"]
