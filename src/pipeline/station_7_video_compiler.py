def _iso_now() -> str:
    """Trả về ISO 8601 timestamp hiện tại (UTC)."""
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond:06d}Z"
