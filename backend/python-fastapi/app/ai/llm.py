"""Claude client factory.

The assistant uses the official Anthropic SDK. If the SDK can't be loaded or
no credentials are configured, the API still works and the assistant falls
back to retrieval-only answers.
"""
import logging
import os
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LLMStatus:
    client: object | None
    reason: str

    @property
    def available(self) -> bool:
        return self.client is not None


@lru_cache(maxsize=1)
def get_llm() -> LLMStatus:
    mode = get_settings().assistant_llm.lower()
    if mode == "off":
        return LLMStatus(None, "disabled by ASSISTANT_LLM=off")
    if mode == "auto" and not (os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN")):
        return LLMStatus(
            None,
            "no ANTHROPIC_API_KEY set (or run `ant auth login` and set ASSISTANT_LLM=on)",
        )
    try:
        import anthropic
    except Exception as exc:  # ImportError, or a native dependency blocked by the OS
        logger.warning("Anthropic SDK unavailable: %s", exc)
        return LLMStatus(None, f"Anthropic SDK could not be loaded: {exc.__class__.__name__}")
    # Credentials resolve from ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or an `ant auth login` profile.
    return LLMStatus(anthropic.Anthropic(max_retries=2, timeout=120.0), "ok")


def describe_error(exc: Exception) -> str:
    """User-facing message for SDK errors without importing the SDK."""
    name = type(exc).__name__
    return {
        "AuthenticationError": "The AI service rejected the API key. Check ANTHROPIC_API_KEY.",
        "PermissionDeniedError": "The API key is not allowed to use this model.",
        "RateLimitError": "The AI service is busy right now. Please try again in a minute.",
        "APIConnectionError": "Could not reach the AI service. Check the server's internet connection.",
        "APITimeoutError": "The AI service took too long to respond. Please try again.",
        "InternalServerError": "The AI service had a temporary problem. Please try again.",
    }.get(name, "The assistant hit an unexpected error. Please try again.")
