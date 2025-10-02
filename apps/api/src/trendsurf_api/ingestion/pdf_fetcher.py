from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx

from ..core.settings import get_settings


class PdfTooLargeError(RuntimeError):
  pass


class PdfDownloadError(RuntimeError):
  pass


@dataclass(slots=True)
class PdfDocument:
  content: bytes
  content_type: str | None
  etag: str | None
  last_modified: str | None


async def fetch_pdf(url: str, *, timeout: float = 60.0, retries: int = 3) -> PdfDocument:
  settings = get_settings()
  max_bytes = settings.pdf_max_mb * 1024 * 1024
  delay = 1.0

  for attempt in range(retries):
    try:
      async with httpx.AsyncClient(
        timeout=timeout, headers={"User-Agent": settings.user_agent}
      ) as client:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()
    except httpx.HTTPError as exc:
      if attempt == retries - 1:
        raise PdfDownloadError(f"Failed to download PDF: {exc}") from exc
      await asyncio.sleep(delay)
      delay *= 2
      continue

    if response.headers.get("Content-Length"):
      content_length = int(response.headers["Content-Length"])
      if content_length > max_bytes:
        raise PdfTooLargeError(f"PDF exceeds size limit ({content_length} bytes)")

    content = response.content
    if len(content) > max_bytes:
      raise PdfTooLargeError("PDF exceeds size limit after download")

    return PdfDocument(
      content=content,
      content_type=response.headers.get("Content-Type"),
      etag=response.headers.get("ETag"),
      last_modified=response.headers.get("Last-Modified"),
    )

  raise PdfDownloadError("Failed to download PDF")
