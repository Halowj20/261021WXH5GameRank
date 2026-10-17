import logging
from concurrent.futures import ThreadPoolExecutor

from django.conf import settings
from django.db import close_old_connections

logger = logging.getLogger(__name__)


class TaskRunner:
    def __init__(self):
        self._pool = None

    def _get_pool(self):
        if self._pool is None:
            self._pool = ThreadPoolExecutor(max_workers=settings.TASK_WORKERS, thread_name_prefix="ingest")
        return self._pool

    def submit(self, fn, *args, **kwargs):
        if settings.TASKS_SYNC:
            fn(*args, **kwargs)
            return

        def wrapped():
            try:
                fn(*args, **kwargs)
            except Exception:
                logger.exception("background task failed")
            finally:
                close_old_connections()

        self._get_pool().submit(wrapped)


runner = TaskRunner()
