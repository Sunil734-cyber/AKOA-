# Backend ↔ Frontend API Endpoints

Base URL used by the frontend: `http://localhost:8100`  
(set via `VITE_AKOA_API_BASE_URL` in the frontend, default is localhost:8100)



 backend Run command = python -m uvicorn app.main:app --reload --port 8100







AI:


## Directories

| Role | Directory |
|---|---|
| Backend API (routes / FastAPI) | `Backend/apis/app/` |
| Backend route definitions | `Backend/apis/app/routes.py` |
| Backend app entry | `Backend/apis/app/main.py` |
| Frontend API client (calls these endpoints) | `Frontend/src/lib/api.ts` |
| Frontend UI pages | `Frontend/src/routes/` |

---

## Endpoints that connect Backend → Frontend

All paths are under `/api` (defined in `Backend/apis/app/routes.py`).  
Frontend functions that call them are in `Frontend/src/lib/api.ts`.

### System / Overview

| Method | Endpoint | Backend handler | Frontend function | Used for |
|---|---|---|---|---|
| `GET` | `/api/health` | `health` | (docs / manual check) | API + Prometheus status |
| `GET` | `/api/overview` | `overview` | `fetchOverview()` | Dashboard Overview page |

### Services & Metrics

| Method | Endpoint | Backend handler | Frontend function | Used for |
|---|---|---|---|---|
| `GET` | `/api/services` | `list_services` | `fetchServices()` | Services list |
| `GET` | `/api/services/{service}` | `service_detail` | `fetchServiceDetail(name)` | Service detail page |
| `GET` | `/api/metrics/{service}?range=` | `service_metrics` | `fetchServiceMetrics(name, range)` | Metrics charts |

### Costs

| Method | Endpoint | Backend handler | Frontend function | Used for |
|---|---|---|---|---|
| `GET` | `/api/costs/profiles` | `cost_profiles` | (available on backend) | Pricing profiles list |
| `GET` | `/api/costs?usage_window=` | `costs` | `fetchCosts(usageWindow)` | Cost / waste view |
| `GET` | `/api/costs/estimate?service=&replicas=` | `cost_estimate` | `fetchCostEstimate(service, replicas)` | What-if replica cost |

### Actions / Operations

| Method | Endpoint | Backend handler | Frontend function | Used for |
|---|---|---|---|---|
| `GET` | `/api/actions` | `list_actions` | `fetchActions()` | Actions history |
| `POST` | `/api/actions` | `create_action` | `createAction(payload)` | Create / log an action |

### Account / Auth / Copilot

| Method | Endpoint | Backend handler | Frontend function | Used for |
|---|---|---|---|---|
| `GET` | `/api/profile` | `get_profile` | `fetchProfile()` | Profile page |
| `PUT` | `/api/profile` | `put_profile` | `updateProfile(payload)` | Update profile |
| `GET` | `/api/settings` | `get_settings` | `fetchSettings()` | Settings page |
| `PUT` | `/api/settings` | `put_settings` | `updateSettings(payload)` | Update settings |
| `POST` | `/api/auth/login` | `login` | `loginApi(email, password, keepSignedIn)` | Login page |
| `POST` | `/api/copilot/query` | `copilot_query` | `queryCopilot(question)` | AI Copilot page |

---

## Quick full list (path only)

1. `GET  /api/health`
2. `GET  /api/overview`
3. `GET  /api/services`
4. `GET  /api/services/{service}`
5. `GET  /api/metrics/{service}`
6. `GET  /api/costs/profiles`
7. `GET  /api/costs`
8. `GET  /api/costs/estimate`
9. `GET  /api/actions`
10. `POST /api/actions`
11. `GET  /api/profile`
12. `PUT  /api/profile`
13. `GET  /api/settings`
14. `PUT  /api/settings`
15. `POST /api/auth/login`
16. `POST /api/copilot/query`

---

## How they connect

```
Frontend (Frontend/src/)
   └── Frontend/src/lib/api.ts   ← fetchJson() calls http://localhost:8100/api/...
            │
            ▼
Backend API (Backend/apis/)
   └── Backend/apis/app/routes.py  ← FastAPI /api endpoints
            │
            ▼
   Prometheus (localhost:9090) + cost/settings helpers
```

Run API from: `Backend/apis`  
Run dashboard from: `Frontend`
