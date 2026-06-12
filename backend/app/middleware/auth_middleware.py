from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from jose import jwt, JWTError
from app.config import settings

SKIP_PATHS = {"/auth/login", "/auth/register", "/health", "/docs", "/openapi.json", "/redoc"}


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Injects user_id and role into request.state for use by audit middleware.
    Does NOT enforce auth — that's handled by FastAPI dependencies per route.
    """
    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.clinic_id = None

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                request.state.user_id = payload.get("sub")
            except JWTError:
                pass

        return await call_next(request)
