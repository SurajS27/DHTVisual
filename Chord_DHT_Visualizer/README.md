# Chord DHT Visualizer

An interactive web visualizer for a Chord Distributed Hash Table project. The app explains the core distributed computing ideas behind the original Python/Flask + Docker + Kubernetes implementation: hash-space ownership, predecessor/successor ranges, finger-table routing, and multi-hop key lookup.

## What is inside

```text
Chord_DHT_Visualizer/
├── src/                     # React + TypeScript visualizer
├── public/                  # Static frontend assets
├── backend/                 # Original Python distributed node project
│   ├── chord_node.py         # Flask Chord node implementation
│   ├── requirements.txt      # Python backend dependencies
│   ├── Dockerfile            # Docker image for one Chord node
│   ├── yamlfiles/            # Kubernetes deployment/service configs
│   ├── commands.txt          # Original deployment commands
│   └── BACKEND_README.md     # Original backend project README
├── package.json              # Frontend scripts/dependencies
├── vite.config.ts            # Vite config
├── vercel.json               # Vercel SPA routing config
└── README.md
```

## Frontend

The frontend is self-contained and can run without starting the Python backend. It mirrors the Chord logic from `backend/chord_node.py` in TypeScript so it can be hosted as a static site on Vercel.

Features:

- Chord ring visualization
- Editable identifier size `m`
- Editable active node list
- Start node and lookup key controls
- Finger table generation
- Multi-hop routing path
- Distributed computing explanations
- Flask/Docker/Kubernetes architecture explanation

## Run locally

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Build for production:

```bash
npm run build
```

## Deploy frontend on Vercel

1. Push this folder to GitHub.
2. Import the GitHub repository into Vercel.
3. Use these settings if Vercel does not auto-detect them:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

The Python backend is included for project completeness, but Vercel will host the React visualizer as a static frontend.

## Python backend

The backend folder contains the original distributed computing implementation. Each Chord node is a Flask service configured with environment variables:

- `NODE_ID`
- `PRED_ID`
- `FINGER_TABLE`

Run a single node locally:

```bash
cd backend
pip install -r requirements.txt
set NODE_ID=9
set PRED_ID=4
set FINGER_TABLE=[11,11,14,18,28]
python chord_node.py
```

Then query it:

```bash
curl -X POST http://127.0.0.1:5000/lookup -H "Content-Type: application/json" -d "{\"key\":30}"
```

## Docker and Kubernetes

The original deployment path is preserved under `backend/`:

```bash
cd backend
docker build -t my-chord-node .
kubectl apply -f yamlfiles/configmap.yaml
kubectl apply -f yamlfiles/node_deploy.yaml
kubectl apply -f yamlfiles/service.yaml
```

This represents the distributed system as multiple independent Flask nodes, each running as a containerized Kubernetes pod.

## Note on backend hosting

Vercel is ideal for this static visualizer. The Flask backend is better hosted separately on a Python-capable service such as Render, Railway, Fly.io, a VM, or Kubernetes. If hosted separately, the frontend can later be changed to call the live `/lookup` endpoint instead of using the built-in TypeScript simulation.
