from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_HOST: str = '0.0.0.0'
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"

    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    OLLAMA_HOST: str = 'http://ollama:11434'
    # OLLAMA_LLM_MODEL: str = "llama3.2:1b"
    OLLAMA_LLM_MODEL: str = "qwen2.5:1.5b"
    # OLLAMA_LLM_MODEL: str = "mistral:latest"
    OLLAMA_EMBEDDING_MODEL: str = "bge-m3"

    # ── Storage ───────────────────────────────────────────────────────────────
    FILES_BUCKET: str = "files"

    PDF_FOLDER: str = "pdfs"
    CSV_FOLDER: str = "csvs"


settings = Settings()
