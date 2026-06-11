.PHONY: help dev build seed migrate docker-up docker-down lint

help:
	@echo "Oliveira Apply AI — Comandos disponíveis:"
	@echo ""
	@echo "  make dev          Inicia backend + frontend em modo desenvolvimento"
	@echo "  make dev-backend  Inicia só o backend"
	@echo "  make dev-frontend Inicia só o frontend"
	@echo "  make build        Build de produção (backend + frontend)"
	@echo "  make migrate      Executa migrações do banco"
	@echo "  make seed         Popula o banco com dados de exemplo"
	@echo "  make docker-up    Sobe todos os containers (docker compose)"
	@echo "  make docker-down  Para todos os containers"
	@echo "  make lint         Roda ESLint em todo o projeto"
	@echo ""

dev:
	@echo "🚀 Iniciando em modo desenvolvimento..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

build:
	@echo "🔨 Build de produção..."
	cd backend && npm run build
	cd frontend && npm run build

install:
	cd backend && npm install
	cd frontend && npm install

migrate:
	cd backend && npx prisma migrate dev

migrate-prod:
	cd backend && npx prisma migrate deploy

seed:
	cd backend && npx prisma db seed

studio:
	cd backend && npx prisma studio

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

clean:
	rm -rf backend/dist backend/node_modules frontend/.next frontend/node_modules
