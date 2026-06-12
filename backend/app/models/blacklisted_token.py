from datetime import datetime
from sqlalchemy import String, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("TIMEZONE('utc', NOW())"))
