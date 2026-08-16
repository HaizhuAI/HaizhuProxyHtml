import os
import tempfile

os.environ["HZ_DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["HZ_SECRET_KEY"] = "test-secret"

import pytest
from fastapi.testclient import TestClient

from app.db import Base, engine
from app.main import app
from app.seed import seed


@pytest.fixture(scope="session", autouse=True)
def _db():
    Base.metadata.create_all(engine)
    seed()
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
