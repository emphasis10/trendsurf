import os
import signal
import structlog
from rq import Connection, Worker
from redis import Redis

logger = structlog.get_logger()


def run() -> None:
  """Start the RQ worker with default queue."""
  redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
  queue_names = [os.getenv("RQ_QUEUE", "default")]
  redis_conn = Redis.from_url(redis_url)

  with Connection(redis_conn):
    worker = Worker(queue_names)
    logger.info("worker.start", queues=queue_names, redis_url=redis_url)
    worker.work(with_scheduler=True)


def main() -> None:
  run()


if __name__ == "__main__":
  main()
