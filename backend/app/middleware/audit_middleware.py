from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from sqlalchemy import select


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Logs state-changing requests (POST/PUT/DELETE) to audit_log.
    Only logs authenticated requests.
    Runs after the route handler completes successfully.
    """
    TRACKED_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.method not in self.TRACKED_METHODS:
            return response
        if response.status_code >= 400:
            return response

        # Best-effort: log after response. Errors here don't affect the user.
        try:
            user_id = getattr(request.state, "user_id", None)
            clinic_id = getattr(request.state, "clinic_id", None)
            if user_id:
                from app.database import AsyncSessionLocal
                from app.models.audit_log import AuditLog
                async with AsyncSessionLocal() as db:
                    log = AuditLog(
                        user_id=user_id,
                        clinic_id=clinic_id,
                        action=f"{request.method} {request.url.path}",
                        ip_address=request.client.host if request.client else None,
                    )
                    db.add(log)
                    await db.commit()
        except Exception as e:
            print(f"[AuditMiddleware] Error: {e}")

        return response
