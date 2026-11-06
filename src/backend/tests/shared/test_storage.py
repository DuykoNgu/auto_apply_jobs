from uuid import uuid4

import pytest
from botocore.exceptions import EndpointConnectionError

from shared.config import get_settings
from shared.storage import ObjectNotFoundError, build_s3_storage


def test_put_get_round_trip_and_missing_key() -> None:
    storage = build_s3_storage(get_settings())
    try:
        storage.ensure_bucket()
    except EndpointConnectionError:
        pytest.skip("object storage is not reachable")
    key = f"tests/{uuid4()}.pdf"
    storage.put(key, b"%PDF-1.4 data", "application/pdf")
    assert storage.get(key) == b"%PDF-1.4 data"
    with pytest.raises(ObjectNotFoundError):
        storage.get(f"tests/{uuid4()}-missing.pdf")
