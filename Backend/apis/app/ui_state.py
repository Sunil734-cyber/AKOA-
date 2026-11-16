from __future__ import annotations

from datetime import datetime, timezone

from .schemas import ActionCreate, ActionRecord, LoginResponse, UiSettings, UserProfile


def _hhmm_now() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.hour:02d}:{now.minute:02d}"


_actions: list[ActionRecord] = [
    ActionRecord(
        id="AKOA-2409-1032",
        time="10:32",
        service="backend",
        action="2 → 4 replicas",
        requestedBy="Sreenidhi",
        approvedBy="Sreenidhi",
        result="Success",
        what="Replica count was increased from 2 to 4.",
        why="Request volume increased 41% over 90 minutes; forecast remained elevated.",
        evidence="CPU peaked at 68%; p95 latency increased to 74 ms.",
        approver="Sreenidhi Guruprasad · Infrastructure Engineer",
        k8sVerb="PATCH apps/v1",
        k8sResource="Deployment development/backend",
        k8sField="spec.replicas: 4",
        duration="14.2s",
    ),
    ActionRecord(
        id="AKOA-2409-0915",
        time="09:15",
        service="db-service",
        action="3 → 1 replicas",
        requestedBy="AKOA",
        approvedBy="Sreenidhi",
        result="Success",
        what="Replica count was reduced from 3 to 1.",
        why="CPU remained below 10% for 6 hours; forecast predicted low demand.",
        evidence="CPU 6-hour average 8%; request rate 0.3 req/s.",
        approver="Sreenidhi Guruprasad · Infrastructure Engineer",
        k8sVerb="PATCH apps/v1",
        k8sResource="Deployment development/db-service",
        k8sField="spec.replicas: 1",
        duration="11.8s",
    ),
    ActionRecord(
        id="AKOA-2409-0842",
        time="08:42",
        service="frontend",
        action="1 → 2 replicas",
        requestedBy="AKOA",
        approvedBy=None,
        result="Rejected",
        what="Proposed replica increase from 1 to 2.",
        why="Recommendation required approval outside the low-risk policy window.",
        evidence="Confidence 74% below the 80% auto-approval threshold.",
        approver="—",
        k8sVerb="PATCH apps/v1",
        k8sResource="Deployment development/frontend",
        k8sField="spec.replicas: 2",
        duration="—",
    ),
]

_profile = UserProfile(
    name="Sreenidhi Guruprasad",
    email="sreenidhi@company.com",
    company="Company Infrastructure",
    role="Infrastructure Engineer",
    sso="Enabled",
    lastSignIn="Today · 08:31",
    permissions=[
        "View infrastructure",
        "View metrics",
        "View recommendations",
        "Request actions",
        "Approve low-risk actions",
    ],
)

_settings = UiSettings(
    namespace="development",
    cluster="minikube",
    autoApprove=False,
    requireForecast=True,
    notifyRecommendations=True,
    notifyExecution=True,
    notifyPolicy=True,
)

_demo_users: dict[str, str] = {
    "sreenidhi@company.com": "akoa-demo-2026",
}


def list_actions() -> list[ActionRecord]:
    return list(_actions)


def add_action(payload: ActionCreate) -> ActionRecord:
    aid = f"AKOA-2410-{datetime.now(timezone.utc).strftime('%H%M%S')}"
    rec = ActionRecord(id=aid, time=_hhmm_now(), **payload.model_dump())
    _actions.insert(0, rec)
    return rec


def get_profile() -> UserProfile:
    return _profile


def update_profile(name: str, email: str, company: str, role: str) -> UserProfile:
    global _profile
    _profile = _profile.model_copy(update={"name": name, "email": email, "company": company, "role": role})
    return _profile


def get_settings() -> UiSettings:
    return _settings


def update_settings(
    namespace: str,
    auto_approve: bool,
    require_forecast: bool,
    notify_recommendations: bool,
    notify_execution: bool,
    notify_policy: bool,
) -> UiSettings:
    global _settings
    _settings = _settings.model_copy(
        update={
            "namespace": namespace,
            "autoApprove": auto_approve,
            "requireForecast": require_forecast,
            "notifyRecommendations": notify_recommendations,
            "notifyExecution": notify_execution,
            "notifyPolicy": notify_policy,
        }
    )
    return _settings


def login(email: str, password: str) -> LoginResponse | None:
    expected = _demo_users.get(email.lower())
    if expected is None or expected != password:
        return None
    return LoginResponse(user=email, token="akoa-demo-token")
