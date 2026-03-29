from __future__ import annotations
from typing import BinaryIO, List
from aiobotocore.client import AioBaseClient
from botocore.exceptions import ClientError


class StorageRepository:
    def __init__(self, client: AioBaseClient) -> None:
        self.client = client

    ###########################################################################
    ###########################################################################
    async def upload_file(
        self,
        bucket_name: str,
        key: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> None:
        await self.client.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    ###########################################################################
    ###########################################################################
    async def upload_fileobj(
        self,
        bucket_name: str,
        key: str,
        fileobj: BinaryIO,
        content_type: str = "application/octet-stream",
    ) -> None:
        await self.client.upload_fileobj(
            fileobj,
            bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    ###########################################################################
    ###########################################################################
    async def download_file(self, bucket_name: str, key: str) -> tuple[bytes, str]:
        """Returns (data, content_type)."""
        response = await self.client.get_object(Bucket=bucket_name, Key=key)
        data: bytes = await response["Body"].read()
        content_type: str = response.get("ContentType", "application/octet-stream")
        return data, content_type

    ###########################################################################
    ###########################################################################
    async def delete_file(self, bucket_name: str, key: str) -> None:
        await self.client.delete_object(Bucket=bucket_name, Key=key)

    ###########################################################################
    ###########################################################################
    async def delete_files(self, bucket_name: str, keys: List[str]) -> None:
        if not keys:
            return
        await self.client.delete_objects(
            Bucket=bucket_name,
            Delete={"Objects": [{"Key": k} for k in keys]},
        )

    ###########################################################################
    ###########################################################################
    async def file_exists(self, bucket_name: str, key: str) -> bool:
        try:
            await self.client.head_object(Bucket=bucket_name, Key=key)
            return True
        except ClientError:
            return False

    ###########################################################################
    ###########################################################################
    async def copy_file(
        self,
        src_bucket: str,
        src_key: str,
        dst_bucket: str,
        dst_key: str,
    ) -> None:
        await self.client.copy_object(
            CopySource={"Bucket": src_bucket, "Key": src_key},
            Bucket=dst_bucket,
            Key=dst_key,
        )
