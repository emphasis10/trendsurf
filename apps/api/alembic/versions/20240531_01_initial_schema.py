from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20240531_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
  op.create_table(
    "users",
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("email", sa.String(length=320), nullable=False, unique=True),
    sa.Column("name", sa.String(length=200), nullable=True),
    sa.Column("password_hash", sa.String(length=255), nullable=False),
    sa.Column("role", sa.String(length=32), nullable=False, server_default="user"),
    sa.Column("llm_provider", sa.String(length=64), nullable=True),
    sa.Column("llm_model", sa.String(length=128), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )

  op.create_table(
    "topics",
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sa.Column("name", sa.String(length=200), nullable=False),
    sa.Column("description", sa.Text(), nullable=True),
    sa.Column("filters_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )
  op.create_index("ix_topics_user_id", "topics", ["user_id"])

  op.create_table(
    "papers",
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("source", sa.String(length=32), nullable=False),
    sa.Column("source_id", sa.String(length=128), nullable=False),
    sa.Column("title", sa.Text(), nullable=False),
    sa.Column("authors", postgresql.ARRAY(sa.String(length=128)), nullable=True),
    sa.Column("abstract", sa.Text(), nullable=True),
    sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("updated_at_source", sa.DateTime(timezone=True), nullable=True),
    sa.Column("url_pdf", sa.Text(), nullable=True),
    sa.Column("url_page", sa.Text(), nullable=True),
    sa.Column("primary_category", sa.String(length=64), nullable=True),
    sa.Column("meta_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.UniqueConstraint("source", "source_id", name="uq_papers_source_source_id"),
  )
  op.create_index("ix_papers_source", "papers", ["source"])

  op.create_table(
    "analyses",
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), nullable=False),
    sa.Column("tldr", sa.Text(), nullable=True),
    sa.Column("ai_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("novelty_score", sa.Numeric(4, 1), nullable=True),
    sa.Column("provider", sa.String(length=64), nullable=True),
    sa.Column("gen_model", sa.String(length=128), nullable=True),
    sa.Column("embed_model", sa.String(length=128), nullable=True),
    sa.Column("tokens", sa.Integer(), nullable=True),
    sa.Column("latency_ms", sa.Integer(), nullable=True),
    sa.Column("status", sa.String(length=32), nullable=True),
    sa.Column("error", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )
  op.create_index("ix_analyses_paper_id", "analyses", ["paper_id"])

  op.create_table(
    "settings",
    sa.Column("key", sa.String(length=128), primary_key=True),
    sa.Column("scope", sa.String(length=64), nullable=False, server_default="system"),
    sa.Column("value_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )

  op.create_table(
    "jobs",
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("name", sa.String(length=128), nullable=False, unique=True),
    sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column("last_status", sa.String(length=32), nullable=True),
    sa.Column("last_error", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )

  op.create_table(
    "paper_fulltexts",
    sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    sa.Column("checksum", sa.String(length=64), nullable=True),
    sa.Column("content", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
  )

  op.create_table(
    "topic_matches",
    sa.Column("topic_id", sa.Integer(), sa.ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    sa.Column("paper_id", sa.Integer(), sa.ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    sa.Column("score", sa.Numeric(6, 4), nullable=False),
    sa.Column("reason", sa.Text(), nullable=True),
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.CheckConstraint("score >= 0", name="ck_topic_matches_score_min"),
    sa.CheckConstraint("score <= 1", name="ck_topic_matches_score_max"),
  )
  op.execute(
    sa.text(
      "CREATE INDEX ix_topic_matches_topic_score_created ON topic_matches (topic_id, score DESC, created_at DESC)"
    )
  )


def downgrade() -> None:
  op.execute(sa.text("DROP INDEX IF EXISTS ix_topic_matches_topic_score_created"))
  op.drop_table("topic_matches")
  op.drop_table("paper_fulltexts")
  op.drop_table("jobs")
  op.drop_table("settings")
  op.drop_index("ix_analyses_paper_id", table_name="analyses")
  op.drop_table("analyses")
  op.drop_index("ix_papers_source", table_name="papers")
  op.drop_table("papers")
  op.drop_index("ix_topics_user_id", table_name="topics")
  op.drop_table("topics")
  op.drop_table("users")
