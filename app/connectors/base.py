import asyncio
import json
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List

import httpx
try:
    import structlog
except ImportError:
    import logging as structlog
    structlog.get_logger = lambda: logging.getLogger(__name__)
import aioredis
from pydantic import BaseModel

from ..config import settings
from ..models.evento import EventoUrbano

log = structlog.get_logger()

class BaseConnector(ABC):
    """Classe base para todos os conectores de fontes externas.
    Implementa:
      - request com httpx.AsyncClient, timeout 30s
      - retry exponencial (3 tentativas) para códigos 429, 5xx
      - cache Redis com TTL configurável por fonte
      - rate‑limit simples (token bucket) por fonte
      - logging estruturado
    """

    source_name: str  # nome da fonte, ex: "clima", "transito"
    cache_ttl: int = 60  # default, sobrescrito nas subclasses
    rate_limit: int = 60  # requisições por minuto

    def __init__(self):
        self._redis = aioredis.from_url(settings.REDIS_URL)
        self._last_reset = time.time()
        self._tokens = self.rate_limit
        self._lock = asyncio.Lock()

    async def _acquire_token(self):
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_reset
            if elapsed > 60:
                self._tokens = self.rate_limit
                self._last_reset = now
            if self._tokens <= 0:
                await asyncio.sleep(60 - elapsed)
                self._tokens = self.rate_limit
                self._last_reset = time.time()
            self._tokens -= 1

    async def _request(self, method: str, url: str, params: Dict[str, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
        await self._acquire_token()
        async with httpx.AsyncClient(timeout=30.0) as client:
            attempt = 0
            backoff = 1
            while True:
                attempt += 1
                try:
                    r = await client.request(method, url, params=params, headers=headers)
                    log.info(
                        "request",
                        source=self.source_name,
                        url=url,
                        status=r.status_code,
                        duration_ms=r.elapsed.total_seconds() * 1000,
                    )
                    if r.status_code >= 400:
                        body = await r.aread()
                        log.error(
                            "request_error",
                            source=self.source_name,
                            url=url,
                            status=r.status_code,
                            body=body.decode(errors="ignore"),
                        )
                        if r.status_code in {429, 500, 502, 503, 504} and attempt < 3:
                            await asyncio.sleep(backoff)
                            backoff *= 2
                            continue
                        raise httpx.HTTPStatusError(
                            f"HTTP {r.status_code} – {r.text}", request=r.request, response=r
                        )
                    return r.json()
                except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                    log.error("request_exception", source=self.source_name, error=str(exc))
                    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code in {429, 500, 502, 503, 504} and attempt < 3:
                        await asyncio.sleep(backoff)
                        backoff *= 2
                        continue
                    raise

    async def _cache_get(self, key: str) -> Any:
        data = await self._redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def _cache_set(self, key: str, value: Any, ttl: int | None = None):
        await self._redis.set(key, json.dumps(value), ex=ttl or self.cache_ttl)

    @abstractmethod
    async def fetch(self, params: Dict[str, Any]) -> List[EventoUrbano]:
        """Implementação concreta deve validar, normalizar e devolver lista de EventoUrbano"""
        raise NotImplementedError
