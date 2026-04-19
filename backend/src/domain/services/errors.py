class DomainError(Exception):
    """Base domain error for known business failures."""


class PersistenceError(DomainError):
    """Raised when a request cannot be persisted."""


class AuthenticationError(DomainError):
    """Raised when authentication fails for known credentials reasons."""
