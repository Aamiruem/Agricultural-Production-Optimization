FROM python:3.12-slim
RUN pip install --no-cache-dir "mlflow==3.18.0"
RUN useradd --create-home --uid 10001 mlflow && mkdir /mlflow && chown mlflow /mlflow
USER mlflow
EXPOSE 5000
# --allowed-hosts: MLflow rejects unknown Host headers; allow the compose service
# name (other containers) and localhost (the browser UI on port 5000).
CMD ["mlflow", "server", "--host", "0.0.0.0", "--port", "5000", \
     "--backend-store-uri", "sqlite:////mlflow/mlflow.db", \
     "--artifacts-destination", "/mlflow/artifacts", "--serve-artifacts", \
     "--allowed-hosts", "mlflow,mlflow:5000,localhost,localhost:5000,127.0.0.1,127.0.0.1:5000"]
