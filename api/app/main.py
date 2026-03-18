from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.api.router import admin_router, public_router
import uvicorn

# ==========================================
# ==========================================
app = FastAPI(
    title="Admin API",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=admin_router, prefix=settings.API_PREFIX)

@app.get("/")
def health_check():
    return {"status": "Admin API is healthy"}


# ==========================================
# ==========================================
public_app = FastAPI(
    title="Public API",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

public_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

public_app.include_router(router=public_router)
app.mount(settings.API_PREFIX, public_app)


# ==========================================
# ==========================================
if __name__ == "__main__":    
    uvicorn.run(
        "app.main:app", 
        host=settings.API_HOST, 
        port=settings.API_PORT, 
        reload=True,
        log_level="info",
        access_log=False,
        use_colors=False,
        timeout_graceful_shutdown=1
    )