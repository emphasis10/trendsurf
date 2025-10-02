from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import AsyncIterator, Iterable
import xml.etree.ElementTree as ET

import httpx

from ..core.settings import get_settings

ARXIV_API_URL = "https://export.arxiv.org/api/query"
ISO8601 = "%Y-%m-%dT%H:%M:%SZ"


@dataclass
class ArxivPaper:
  source_id: str
  title: str
  summary: str
  published_at: datetime | None
  updated_at: datetime | None
  authors: list[str]
  pdf_url: str | None
  html_url: str | None
  primary_category: str | None
  categories: list[str]
  raw: dict[str, str]


class ArxivRateLimiter:
  def __init__(self, delay_ms: int = 3200) -> None:
    self._delay = delay_ms / 1000
    self._lock = asyncio.Lock()
    self._last_request: float = 0.0

  async def __aenter__(self) -> ArxivRateLimiter:
    async with self._lock:
      loop = asyncio.get_running_loop()
      now = loop.time()
      wait = self._delay - (now - self._last_request)
      if wait > 0:
        await asyncio.sleep(wait)
      self._last_request = loop.time()
    return self

  async def __aexit__(self, exc_type, exc, tb) -> None:  # type: ignore[override]
    return None


class ArxivClient:
  def __init__(self, *, delay_ms: int | None = None, max_results_per_run: int | None = None) -> None:
    settings = get_settings()
    self.delay_ms = delay_ms or settings.arxiv_delay_ms
    self.max_results_per_run = max_results_per_run or settings.arxiv_max_results_per_run
    self.user_agent = settings.user_agent
    self.rate_limiter = ArxivRateLimiter(self.delay_ms)

  async def query(self, search_query: str, *, start: int = 0, max_results: int = 100) -> list[ArxivPaper]:
    params = {
      "search_query": search_query,
      "start": start,
      "max_results": max_results,
      "sortBy": "lastUpdatedDate",
      "sortOrder": "descending",
    }
    headers = {"User-Agent": self.user_agent}
    async with self.rate_limiter:
      async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        response = await client.get(ARXIV_API_URL, params=params)
        response.raise_for_status()
        return list(parse_feed(response.text))

  async def iter_topic(self, filters: dict[str, Iterable[str]], *, page_size: int = 20) -> AsyncIterator[ArxivPaper]:
    search_query = build_search_query(filters)
    fetched = 0
    start = 0

    while fetched < self.max_results_per_run:
      remaining = self.max_results_per_run - fetched
      batch_size = min(page_size, remaining)
      entries = await self.query(search_query, start=start, max_results=batch_size)
      if not entries:
        break
      for entry in entries:
        yield entry
      fetched += len(entries)
      start += batch_size


def build_search_query(filters: dict[str, Iterable[str]]) -> str:
  parts: list[str] = []
  categories = [item for item in filters.get("categories", [])]
  if categories:
    parts.append(" OR ".join(f"cat:{cat}" for cat in categories))
  keywords = [item for item in filters.get("keywords", [])]
  if keywords:
    keyword_clause = " OR ".join(f"all:{_quote_keyword(keyword)}" for keyword in keywords)
    parts.append(keyword_clause)
  if not parts:
    return "all:ai"
  if len(parts) == 1:
    return parts[0]
  return " AND ".join(f"({part})" for part in parts)


def _quote_keyword(keyword: str) -> str:
  return keyword.replace(" ", "+")


def parse_feed(xml_text: str) -> Iterable[ArxivPaper]:
  ns = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
  }
  root = ET.fromstring(xml_text)
  for entry in root.findall("atom:entry", ns):
    arxiv_id = entry.findtext("atom:id", default="", namespaces=ns)
    title = entry.findtext("atom:title", default="", namespaces=ns).strip()
    summary = entry.findtext("atom:summary", default="", namespaces=ns).strip()
    published = parse_datetime(entry.findtext("atom:published", namespaces=ns))
    updated = parse_datetime(entry.findtext("atom:updated", namespaces=ns))
    primary_category = entry.find("arxiv:primary_category", ns)
    categories = [elem.get("term") for elem in entry.findall("atom:category", ns) if elem.get("term")]
    authors = [elem.findtext("atom:name", default="", namespaces=ns).strip() for elem in entry.findall("atom:author", ns)]

    pdf_url = None
    html_url = None
    for link in entry.findall("atom:link", ns):
      rel = link.get("rel")
      href = link.get("href")
      mime = link.get("type")
      if rel == "alternate" and href:
        html_url = href
      if mime == "application/pdf" and href:
        pdf_url = href

    yield ArxivPaper(
      source_id=arxiv_id.split("/")[-1],
      title=title,
      summary=summary,
      published_at=published,
      updated_at=updated,
      authors=[author for author in authors if author],
      pdf_url=pdf_url,
      html_url=html_url,
      primary_category=primary_category.get("term") if primary_category is not None else None,
      categories=[cat for cat in categories if cat],
      raw={
        "id": arxiv_id,
        "title": title,
        "summary": summary,
      },
    )


def parse_datetime(value: str | None) -> datetime | None:
  if not value:
    return None
  try:
    return datetime.strptime(value, ISO8601).replace(tzinfo=timezone.utc)
  except ValueError:
    return None
