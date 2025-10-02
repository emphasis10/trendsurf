from __future__ import annotations

from contextlib import contextmanager

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from .settings import get_settings


_engine: Engine | None = None
_SessionFactory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
  global _engine
  if _engine is None:
    settings = get_settings()
    _engine = create_engine(settings.database_url, future=True, echo=False)
  return _engine


def get_session_factory() -> sessionmaker[Session]:
  global _SessionFactory
  if _SessionFactory is None:
    _SessionFactory = sessionmaker(bind=get_engine(), autocommit=False, autoflush=False, future=True)
  return _SessionFactory


@contextmanager
def session_scope() -> Session:
  session = get_session_factory()()
  try:
    yield session
    session.commit()
  except Exception:
    session.rollback()
    raise
  finally:
    session.close()
