# API — Backend

Python 3.12 · FastAPI · SQLAlchemy 2.0 async · Alembic · TaskIQ · pgvector · Crawl4AI

## Directory Structure

- `app/main.py`: Entrypoint (admin + public apps)
- `app/models/`: SQLAlchemy ORM models
- `app/schemas/`: Pydantic request/response models
- `app/repositories/`: Data access logic (use these in routers)
- `app/api/routers/`: API endpoints (one resource group per file)
- `app/taskiq/tasks/`: TaskIQ task implementations
- `app/utils/`: Pure functions (no side effects, DB, or HTTP)

## Core API Standards

- **Type Everything:** Full type annotations for parameters and return types. Use Pydantic models; avoid `dict` or `Any`
- **Stateless Utils:** `utils/` must be pure. Move any DB/HTTP logic to endpoints or repositories
- **Single Responsibility:** Router endpoints handle requests; repositories handle DB. Decomposition is mandatory for large functions
- **Explicit Handling:** Use specific exceptions; never swallow errors silently
- **Dependencies:** Evaluate every new package. Prefer stdlib or already installed libs

## Database Migrations (Alembic)

1. **Generate Revision:**
   `docker compose exec api alembic revision --autogenerate -m "revision_name"`
2. **Review Revision:** Check `api/alembic/versions/` for `ltree`, `vector`, and array defaults
3. **Apply:** `docker compose exec api alembic upgrade head`
4. **Rollback:** `docker compose exec api alembic downgrade -1`
5. **Status:** `docker compose exec api alembic current`

## Performance Checklist

- Are queries using indexes?
- Is embedding generation happening in background tasks (TaskIQ)?
- Are database sessions handled asynchronously (`async with get_session()`)?
