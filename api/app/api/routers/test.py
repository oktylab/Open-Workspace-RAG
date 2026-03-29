import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.dependencies.repositories import StorageRepositoryDep
from app.core.settings import settings

router = APIRouter()


class UploadedFileResponse(BaseModel):
    key: str
    bucket: str
    size: int


@router.post("/files/pdf", response_model=UploadedFileResponse, status_code=201)
async def upload_pdf(
    storage: StorageRepositoryDep,
    file: UploadFile = File(...),
):
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=415, detail="Only PDF files are accepted.")

    key = f"{settings.PDF_FOLDER}/{uuid.uuid4()}.pdf"

    await storage.upload_fileobj(
        bucket_name=settings.FILES_BUCKET,
        key=key,
        fileobj=file.file,
        content_type="application/pdf",
    )

    return UploadedFileResponse(
        key=key,
        bucket=settings.FILES_BUCKET,
        size=file.size or 0,
    )