COMPOSE := docker-compose

.PHONY: help up down build restart logs shell-api shell-frontend migrate seed fresh test lint

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Environment ──────────────────────────────────────────────

setup: ## Initial project setup
	@cp -n .env.example .env 2>/dev/null || true
	@cp -n backend/.env.example backend/.env 2>/dev/null || true
	@echo "Environment files created. Edit .env as needed."

up: ## Start all containers
	$(COMPOSE) up -d

down: ## Stop all containers
	$(COMPOSE) down

build: ## Build/rebuild containers
	$(COMPOSE) build

restart: ## Restart all containers
	$(COMPOSE) restart

logs: ## Tail container logs
	$(COMPOSE) logs -f

logs-api: ## Tail API logs
	$(COMPOSE) logs -f api

logs-frontend: ## Tail frontend logs
	$(COMPOSE) logs -f frontend

# ─── Backend ──────────────────────────────────────────────────

shell-api: ## Open shell in API container
	$(COMPOSE) exec api sh

composer-install: ## Install PHP dependencies
	$(COMPOSE) exec api composer install

migrate: ## Run database migrations
	$(COMPOSE) exec api php artisan migrate

seed: ## Run database seeders
	$(COMPOSE) exec api php artisan db:seed

fresh: ## Fresh migration + seed
	$(COMPOSE) exec api php artisan migrate:fresh --seed

test: ## Run backend tests
	$(COMPOSE) exec api php vendor/bin/phpunit

key-generate: ## Generate JWT secret
	$(COMPOSE) exec api php artisan jwt:secret

# ─── Frontend ─────────────────────────────────────────────────

shell-frontend: ## Open shell in frontend container
	$(COMPOSE) exec frontend sh

npm-install: ## Install frontend dependencies
	$(COMPOSE) exec frontend npm install

# ─── Database ─────────────────────────────────────────────────

db: ## Open MySQL CLI
	$(COMPOSE) exec mysql mysql -u app -psecret numeros_rojos

redis-cli: ## Open Redis CLI
	$(COMPOSE) exec redis redis-cli

# ─── Utilities ────────────────────────────────────────────────

status: ## Show container status
	$(COMPOSE) ps

clean: ## Remove volumes and containers
	$(COMPOSE) down -v --remove-orphans

export-csv: ## Export economy_records to CSV (usage: make export-csv TABLE=economy_records)
	$(COMPOSE) exec api php artisan export:csv $(TABLE)
