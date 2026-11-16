# How to run AKOA (dashboard + telemetry)

Goal: get Prometheus on **http://localhost:9090**, the API on **http://localhost:8100**, and the dashboard on **http://localhost:8080**.

You need **4 terminals** open at the same time. Keep each one running.

---

## Prerequisites

Install and keep running:

- Docker Desktop (must be running)
- Minikube
- kubectl
- Helm
- Python 3.10+
- Node.js (for the dashboard)

Open **PowerShell** (use the same shell style for all kubectl/minikube commands).

Check tools:

```powershell
docker version
minikube version
kubectl version --client
helm version
python --version
node --version
```

If `kubectl` / `minikube` are not recognized, open a **new** PowerShell after install, or add them to PATH.

---

## One-time setup (cluster + Prometheus)

Do this once from the repo root:

```powershell
cd C:\Users\sunil\Downloads\AKOA-main
```

### 1. Start Minikube

```powershell
minikube start --cpus=4 --memory=6144
kubectl get nodes
```

Node should show `Ready`.

### 2. Install Prometheus + Grafana

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace --set prometheus.prometheusSpec.retention=14d --set "prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=5Gi" --set "prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes[0]=ReadWriteOnce"
kubectl get pods -n monitoring
```

Wait until monitoring pods are `Running` (2–5 minutes).

### 3. Build demo app images into Minikube

```powershell
minikube image build -t akoa-backend:1.0 ./services/backend
minikube image build -t akoa-frontend:1.0 ./services/frontend
minikube image build -t akoa-db:1.0 ./services/db
```

### 4. Deploy the demo services

```powershell
kubectl apply -f k8s/
kubectl get pods,svc
```

Expect `backend`, `frontend`, and `db-service` pods `Running`.

---

## Every time you use the dashboard (4 terminals)

### Terminal 1 — Prometheus port-forward (required)

Without this, the API returns `503 telemetry_unavailable`.

```powershell
kubectl -n monitoring port-forward svc/monitoring-kube-prometheus-prometheus 9090
```

Leave this running.

**Verify:** open [http://localhost:9090](http://localhost:9090)  
You should see the Prometheus UI. Also check [http://localhost:9090/targets](http://localhost:9090/targets) — `akoa-services` targets should be **UP**.

---

### Terminal 2 — AKOA API

```powershell
cd C:\Users\sunil\Downloads\AKOA-main\apis
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --port 8100
```

Leave this running.

**Verify:** open [http://localhost:8100/docs](http://localhost:8100/docs)  
Or:

```powershell
curl.exe http://localhost:8100/api/health
```

---

### Terminal 3 — Dashboard

```powershell
cd C:\Users\sunil\Downloads\AKOA-main\akoa-enterprise-dashboard-main
npm install
npm run dev
```

Leave this running.

**Verify:** open the URL Vite prints, usually:

- [http://localhost:8080](http://localhost:8080)

If 8080 is busy, Vite may use `8081` — use the URL shown in the terminal.

---

### Terminal 4 — Frontend tunnel (needed for workload simulation)

```powershell
minikube service frontend --url
```

Keep this terminal open. It prints a URL like `http://127.0.0.1:xxxxx` — copy that port; it changes every time you restart the tunnel.

---

### Terminal 5 — Workload simulation (live demo)

Needs Terminal 1 (Prometheus) and Terminal 4 (frontend tunnel) already running.

```powershell
cd C:\Users\sunil\Downloads\AKOA-main\tools
pip install requests
python diurnal.py http://127.0.0.1:<tunnel-port> --period 300 --days 2 --peak 40 --seed 1 --scale "0.3:2,0.6:3,0.8:1"
```

Replace `<tunnel-port>` with the port from Terminal 4.

- Quick demo (~10 min): `--period 300 --days 2`
- Longer dataset run: `--period 1800 --days 4` (see main README)

What you should see:
- Script sends day/night-style traffic to `/backend`
- Backend replicas can scale on the schedule (`--scale`)
- Dashboard / Prometheus request rate and CPU rise during the “day” phase
- A `load_log.csv` ground-truth file is written in `tools/`

**Do not restart deployments while the tunnel is in use** — the tunnel port changes and load stops.

---

## Final check (the endpoints you asked about)

1. Open **http://localhost:9090** → Prometheus loads.
2. Open **http://localhost:8100/docs** → API docs load (no crash).
3. Refresh the dashboard at **http://localhost:8080**.
4. Overview should show services / CPU / memory (not “Telemetry degraded”).

If overview still fails, the API log will show `GET /api/overview 503` — that almost always means Terminal 1 (port-forward) is not running.

---

## Quick “already set up” restart

If Minikube and monitoring were installed earlier:

```powershell
# Terminal A
minikube start
kubectl -n monitoring port-forward svc/monitoring-kube-prometheus-prometheus 9090

# Terminal B
cd C:\Users\sunil\Downloads\AKOA-main\apis
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8100

# Terminal C
cd C:\Users\sunil\Downloads\AKOA-main\akoa-enterprise-dashboard-main
npm run dev
```

Then verify:

1. http://localhost:9090  
2. Refresh http://localhost:8080  

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `kubectl` not recognized | Install kubectl/minikube, open a new PowerShell, confirm PATH |
| Port 9090 not loading | Start Terminal 1 port-forward; keep it open |
| API `503 telemetry_unavailable` | Prometheus not reachable — fix 9090 first |
| Dashboard empty / loading forever | API must be on 8100; dashboard defaults to `http://localhost:8100` |
| Monitoring pods `Pending` | Restart Minikube with more memory (`--memory=6144`) |
| `ErrImageNeverPull` | Re-run the `minikube image build` commands, then restart pods |

---

## Port map

| Service | URL |
|---|---|
| Prometheus | http://localhost:9090 |
| AKOA API | http://localhost:8100 |
| Dashboard | http://localhost:8080 |
| Grafana (optional) | http://localhost:3000 (separate port-forward) |

Optional Grafana:

```powershell
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
```
