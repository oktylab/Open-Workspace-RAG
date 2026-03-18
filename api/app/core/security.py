import bcrypt, jwt, secrets as secrets_module
from datetime import datetime, timedelta, timezone
from app.core.secrets import secrets
from app.core.settings import settings

#################################################################################
#################################################################################
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

#################################################################################
#################################################################################
def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)

#################################################################################
#################################################################################
def create_access_token(subject: str | int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(
        to_encode, 
        secrets.SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )

#################################################################################
#################################################################################
def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token, 
            secrets.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("sub")
    except jwt.InvalidTokenError:
        return None
    


#################################################################################
#################################################################################
def generate_workspace_api_key() -> str:
    random_str = secrets_module.token_urlsafe(32)
    return f"pk_ws_{random_str}"