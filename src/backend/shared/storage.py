import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from mypy_boto3_s3.client import S3Client

from shared.config import Settings


class ObjectNotFoundError(Exception):
    pass


class S3Storage:
    def __init__(self, client: S3Client, bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    def ensure_bucket(self) -> None:
        try:
            self._client.head_bucket(Bucket=self._bucket)
        except ClientError:
            self._client.create_bucket(Bucket=self._bucket)

    def put(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(Bucket=self._bucket, Key=key, Body=data, ContentType=content_type)

    def get(self, key: str) -> bytes:
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=key)
        except self._client.exceptions.NoSuchKey as error:
            raise ObjectNotFoundError(key) from error
        return response["Body"].read()


def build_s3_storage(settings: Settings) -> S3Storage:
    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key.get_secret_value(),
        region_name="us-east-1",
        config=Config(connect_timeout=5, read_timeout=30, retries={"max_attempts": 2}),
    )
    return S3Storage(client, settings.s3_bucket)
