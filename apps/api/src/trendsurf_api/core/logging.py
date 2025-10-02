import logging

import structlog


def configure_logging() -> None:
  """Configure structlog + standard logging."""
  logging.basicConfig(level=logging.INFO, format="%(message)s")
  structlog.configure(
    processors=[
      structlog.processors.TimeStamper(fmt="iso"),
      structlog.processors.add_log_level,
      structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    cache_logger_on_first_use=True,
  )
