from __future__ import annotations

import httpx

from ..core.settings import get_settings


class GrobidError(RuntimeError):
  pass


async def process_fulltext(pdf_bytes: bytes, *, consolidate_header: int = 1, timeout: float | None = None) -> str:
  settings = get_settings()
  if not settings.grobid_url:
    raise GrobidError("GROBID_URL is not configured")

  timeout = timeout or settings.grobid_timeout
  files = {"input": ("document.pdf", pdf_bytes, "application/pdf")}
  data = {"consolidateHeader": str(consolidate_header)}

  async with httpx.AsyncClient(timeout=timeout) as client:
    try:
      response = await client.post(f"{settings.grobid_url}/api/processFulltextDocument", files=files, data=data)
      response.raise_for_status()
    except httpx.HTTPError as exc:
      raise GrobidError(f"GROBID request failed: {exc}") from exc

  if not response.text.strip():
    raise GrobidError("GROBID returned empty response")

  return response.text
