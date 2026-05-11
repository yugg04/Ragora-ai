class ExternalServiceError(RuntimeError):
    def __init__(self, service: str, status_code: int | None, detail: str) -> None:
        self.service = service
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"{service} error: {detail}")
