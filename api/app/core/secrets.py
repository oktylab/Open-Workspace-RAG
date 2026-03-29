from pydantic_settings import BaseSettings, SettingsConfigDict

class Secrets(BaseSettings):

    SECRET_KEY: str

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int
    POSTGRES_HOST: str

    REDIS_HOST: str
    REDIS_PORT: int

    SEAWEEDFS_HOST: str
    SEAWEEDFS_S3_PORT: int
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str

    @property
    def SEAWEEDFS_S3_URL(self) -> str:
        return f"http://{self.SEAWEEDFS_HOST}:{self.SEAWEEDFS_S3_PORT}"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

secrets = Secrets()