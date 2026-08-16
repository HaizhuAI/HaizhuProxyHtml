from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .routers import admin, auth, console, model_lab, public, subscribe


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(console.router)
    app.include_router(admin.router)
    app.include_router(public.router)
    app.include_router(subscribe.router)
    app.include_router(model_lab.router)

    @app.get("/api/health")
    def health():
        return {"status": "ok", "app": settings.app_name, "version": settings.version}

    return app


app = create_app()
