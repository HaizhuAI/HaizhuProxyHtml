.PHONY: dev-backend dev-frontend build test e2e up down seed clean package

dev-backend:
	cd backend && python -m app.seed && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

test:
	cd backend && python -m pytest tests/ -q

up:
	docker compose up -d --build

down:
	docker compose down

seed:
	cd backend && python -m app.seed

clean:
	docker compose down -v

package:
	bash scripts/package.sh
