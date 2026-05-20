# Chord DHT Kubernetes Deployment

A Python-based implementation of the Chord Distributed Hash Table (DHT) protocol, deployed on Kubernetes using Docker and Flask. Designed for resilient and scalable key lookup across a distributed set of nodes, each represented as a stateless microservice.

## Features

- **Chord DHT** protocol implementation for efficient distributed key lookup.
- **Flask REST API** for key queries to any node.
- **Dockerized** nodes for portability and ease of deployment.
- **Kubernetes deployment** for scalable, production-ready orchestration.
- **Configurable** node IDs, predecessor IDs, and finger tables.

## Prerequisites

- [Python 3.7+](https://www.python.org/)
- [Docker](https://docs.docker.com/)
- [Kubernetes (kubectl or microk8s)](https://kubernetes.io/)
- [Git](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

https://github.com/SurajS27/Distributed_Computing.git


### 2. Build the Docker Image

docker build -t my-chord-node .


Optionally, tag and push to Docker Hub:

docker tag my-chord-node <your-dockerhub-username>/chord-node:latest
docker push <your-dockerhub-username>/chord-node:latest


### 3. Kubernetes Deployment

**Edit Kubernetes YAMLs if needed (e.g., node IDs, ports, finger tables).**

Apply ConfigMap (for environment configuration):

kubectl apply -f yamlfiles/configmap.yaml


Deploy nodes:

sudo microk8s kubectl apply -f yamlfiles/node_deploy.yaml


Expose services:

kubectl apply -f yamlfiles/service.yaml


### 4. Query the DHT (Example)

Send a lookup request to a specific node:

curl -X POST http://<NODE_IP>:<NODE_PORT>/lookup -d '{"key": 30}' -H "Content-Type: application/json"


Response:

{
"responsible_node": 14,
"trail": "9 -> 14"
}


## Project Structure

| File/Dir              | Purpose                                  |
|-----------------------|------------------------------------------|
| `chord_node.py`       | Main Flask-based DHT node implementation |
| `dumped.py`           | Code development and reference versions  |
| `requirements.txt`    | Python dependencies (Flask, requests)    |
| `yamlfiles/`          | Kubernetes configuration files (.yaml)   |
| `configmap.yaml`      | K8s env configs: node IDs, fingers, etc. |
| `node_deploy.yaml`    | Multi-node deployment spec (one per node)|
| `service.yaml`        | K8s service (NodePort exposure)          |

## Configuration

- **NODE_ID, PRED_ID, FINGER_TABLE**: Set per-node using environment variables (via YAML or ConfigMap).
- **Port:** Default is 5000 (Flask inside the container).

## API

- **POST /lookup**

  Request Body:

{ "key": 30 }


Response:

{ "responsible_node": <node_id>, "trail": "n1 -> n2 -> ..." }


## Troubleshooting

- Ensure each node gets its unique environment variables.
- Use `kubectl get pods` and `kubectl describe pod <podname>` for Kubernetes logs.
- Check `docker logs <container-id>` if debugging locally.
- Verify service exposure with: `kubectl get services`





