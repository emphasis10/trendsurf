from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
  CheckConstraint,
  DateTime,
  ForeignKey,
  Integer,
  Numeric,
  String,
  Text,
  UniqueConstraint,
  func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
  __tablename__ = "users"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
  name: Mapped[str | None] = mapped_column(String(200))
  password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
  role: Mapped[str] = mapped_column(String(32), default="user", nullable=False)
  llm_provider: Mapped[str | None] = mapped_column(String(64))
  llm_model: Mapped[str | None] = mapped_column(String(128))
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )

  topics: Mapped[list[Topic]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Topic(Base):
  __tablename__ = "topics"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  description: Mapped[str | None] = mapped_column(Text)
  filters_json: Mapped[dict | None] = mapped_column(JSONB)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )

  user: Mapped[User] = relationship(back_populates="topics")
  matches: Mapped[list[TopicMatch]] = relationship(back_populates="topic", cascade="all, delete-orphan")


class Paper(Base):
  __tablename__ = "papers"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  source: Mapped[str] = mapped_column(String(32), nullable=False)
  source_id: Mapped[str] = mapped_column(String(128), nullable=False)
  title: Mapped[str] = mapped_column(Text, nullable=False)
  authors: Mapped[list[str] | None] = mapped_column(ARRAY(String(128)))
  abstract: Mapped[str | None] = mapped_column(Text)
  published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
  updated_at_source: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
  url_pdf: Mapped[str | None] = mapped_column(Text)
  url_page: Mapped[str | None] = mapped_column(Text)
  primary_category: Mapped[str | None] = mapped_column(String(64))
  meta_json: Mapped[dict | None] = mapped_column(JSONB)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )

  analyses: Mapped[list[Analysis]] = relationship(back_populates="paper")

  __table_args__ = (UniqueConstraint("source", "source_id", name="uq_papers_source_source_id"),)


class Analysis(Base):
  __tablename__ = "analyses"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
  tldr: Mapped[str | None] = mapped_column(Text)
  ai_summary: Mapped[dict | None] = mapped_column(JSONB)
  novelty_score: Mapped[float | None] = mapped_column(Numeric(4, 1))
  provider: Mapped[str | None] = mapped_column(String(64))
  gen_model: Mapped[str | None] = mapped_column(String(128))
  embed_model: Mapped[str | None] = mapped_column(String(128))
  tokens: Mapped[int | None] = mapped_column(Integer)
  latency_ms: Mapped[int | None] = mapped_column(Integer)
  status: Mapped[str | None] = mapped_column(String(32))
  error: Mapped[str | None] = mapped_column(Text)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )

  paper: Mapped[Paper] = relationship(back_populates="analyses")


class TopicMatch(Base):
  __tablename__ = "topic_matches"

  topic_id: Mapped[int] = mapped_column(
    ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True, nullable=False
  )
  paper_id: Mapped[int] = mapped_column(
    ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True, nullable=False
  )
  score: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)
  reason: Mapped[str | None] = mapped_column(Text)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

  topic: Mapped[Topic] = relationship(back_populates="matches")
  paper: Mapped[Paper] = relationship()

  __table_args__ = (
    CheckConstraint("score >= 0", name="ck_topic_matches_score_min"),
    CheckConstraint("score <= 1", name="ck_topic_matches_score_max"),
  )


class Setting(Base):
  __tablename__ = "settings"

  key: Mapped[str] = mapped_column(String(128), primary_key=True)
  scope: Mapped[str] = mapped_column(String(64), nullable=False, default="system")
  value_json: Mapped[dict | None] = mapped_column(JSONB)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )


class Job(Base):
  __tablename__ = "jobs"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
  last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
  last_status: Mapped[str | None] = mapped_column(String(32))
  last_error: Mapped[str | None] = mapped_column(Text)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )


class PaperFulltext(Base):
  __tablename__ = "paper_fulltexts"

  paper_id: Mapped[int] = mapped_column(
    ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True, nullable=False
  )
  checksum: Mapped[str | None] = mapped_column(String(64))
  content: Mapped[str | None] = mapped_column(Text)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
  updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
  )
