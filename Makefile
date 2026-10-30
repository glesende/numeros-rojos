COMPOSE := docker compose

-include .env.local

.PHONY: help up down build restart logs shell-api shell-frontend migrate seed fresh test test-ci lint fresh-start db-pull

# Colors for output
GREEN=\033[0;32m
NC=\033[0m # No Color

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

migrate-rollback: ## Run database migrations
	$(COMPOSE) exec api php artisan migrate:rollback

seed: ## Run database seeders
	$(COMPOSE) exec api php artisan db:seed

fresh: ## Fresh migration + seed
	$(COMPOSE) exec api php artisan migrate:fresh --seed

test: ## Run backend tests (sobre numeros_rojos_testing, nunca la base de desarrollo)
	@$(COMPOSE) exec -T mysql sh -c "mysql -uroot -p\"\$$MYSQL_ROOT_PASSWORD\" -e \"CREATE DATABASE IF NOT EXISTS numeros_rojos_testing CHARACTER SET utf8mb4; GRANT ALL PRIVILEGES ON numeros_rojos_testing.* TO '\$$MYSQL_USER'@'%';\"" 2>/dev/null
	$(COMPOSE) exec api php vendor/bin/phpunit

CI_IMAGE ?= numeros-rojos-ci-api
CI_NET := numeros-rojos-ci-$(shell echo $$$$)

test-ci: ## Tests backend (MySQL efímero) + build frontend en contenedores, sin tocar el stack; gate de make deploy
	docker build -q -f docker/php/Dockerfile -t $(CI_IMAGE) .
	@set -e; \
	trap 'docker rm -f $(CI_NET)-mysql >/dev/null 2>&1; docker network rm $(CI_NET) >/dev/null 2>&1' EXIT; \
	docker network create $(CI_NET) >/dev/null; \
	docker run -d --name $(CI_NET)-mysql --network $(CI_NET) --network-alias mysql \
		-e MYSQL_ROOT_PASSWORD=secret -e MYSQL_DATABASE=numeros_rojos -e MYSQL_USER=app -e MYSQL_PASSWORD=secret \
		-v "$$PWD/docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
		--health-cmd 'mysqladmin ping -h 127.0.0.1 -uroot -psecret --silent' --health-interval 2s --health-retries 60 mysql:8.0 >/dev/null; \
	echo "Esperando MySQL de test..."; \
	until [ "$$(docker inspect -f '{{.State.Health.Status}}' $(CI_NET)-mysql)" = healthy ]; do sleep 2; done; \
	docker run --rm --network $(CI_NET) -e DB_HOST=mysql -e DB_USERNAME=app -e DB_PASSWORD=secret -e DB_DATABASE=numeros_rojos \
		-e JWT_SECRET=ci-test-secret-0123456789abcdef0123456789abcdef -e APP_KEY=base64:$$(head -c 32 /dev/zero | base64) \
		-w /var/www/html --entrypoint php $(CI_IMAGE) vendor/bin/phpunit; \
	docker run --rm -u "$$(id -u):$$(id -g)" -e HOME=/tmp -v "$$PWD/frontend:/app" -w /app node:20-alpine sh -c 'npm ci --no-audit --no-fund && npm run build'

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

fresh-start: ## Fresh install: down, build, up, npm-install, migrate:fresh --seed
	$(COMPOSE) down
	$(COMPOSE) build
	$(COMPOSE) up -d
	$(COMPOSE) exec frontend npm install
	$(COMPOSE) exec api composer install
	$(COMPOSE) exec api php artisan migrate:fresh --seed
	@echo ""
	@echo "$(GREEN)=====================================$(NC)"
	@echo "$(GREEN)   Números Rojos está listo!$(NC)"
	@echo "$(GREEN)=====================================$(NC)"
	@echo "$(GREEN)Frontend: http://localhost:$${FRONTEND_PORT:-5173}$(NC)"
	@echo "$(GREEN)API:      http://localhost:$${NGINX_PORT:-8080}$(NC)"
	@echo ""

# ─── Production ─────────────────────────────────────────────────

SERVER ?= $(error SERVER no definido. Crea .env.local con SERVER=user@ip)
DEPLOY_PATH ?= $(error DEPLOY_PATH no definido. Crea .env.local con DEPLOY_PATH=/ruta/proyecto)

prod-build: ## Construir para producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod build

prod-up: ## Levantar en modo producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

prod-down: ## Parar producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod down

prod-restart: ## Reiniciar producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod restart

prod-logs: ## Ver logs de producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f

prod-migrate: ## Ejecutar migraciones en producción
	@echo "⏳ Esperando a que la base de datos esté disponible..."
	@docker compose -f docker-compose.prod.yml --env-file .env.prod exec mysql sh -c "\
		until mysqladmin ping -h localhost -u root -p\$$MYSQL_ROOT_PASSWORD --silent; do \
			echo 'Esperando base de datos...'; \
			sleep 2; \
		done"
	@echo "✅ Base de datos lista"
	@docker compose -f docker-compose.prod.yml --env-file .env.prod exec api php artisan migrate --force
	@echo "$(GREEN)Migraciones aplicadas$(NC)"

cache-warm: ## Precalentar caché de BeSoccer en producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod exec api php artisan besoccer:warm-cache

prod-status: ## Ver estado de producción
	docker compose -f docker-compose.prod.yml --env-file .env.prod ps

ssh-vps: ## Conectar al VPS
	ssh $(SERVER)

db-pull: ## Descargar BD de producción a local. Uso: make db-pull [TABLE=tabla] [FORCE=1]
	@if [ -z "$(FORCE)" ]; then \
		read -p "Esto reemplazara datos en la BD local. Continuar? [y/N] " confirm && \
		{ [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; } || { echo "Cancelado."; exit 1; }; \
	fi
	@if [ -n "$(TABLE)" ]; then \
		echo "Descargando tabla '$(TABLE)' desde produccion..."; \
		ssh $(SERVER) "cd $(DEPLOY_PATH) && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T mysql sh -c 'mysqldump -u root -p\$$MYSQL_ROOT_PASSWORD --add-drop-table \$$MYSQL_DATABASE $(TABLE)'" \
		| $(COMPOSE) exec -T mysql sh -c "mysql -u \$$MYSQL_USER -p\$$MYSQL_PASSWORD \$$MYSQL_DATABASE"; \
	else \
		echo "Descargando base de datos completa desde produccion..."; \
		ssh $(SERVER) "cd $(DEPLOY_PATH) && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T mysql sh -c 'mysqldump -u root -p\$$MYSQL_ROOT_PASSWORD --add-drop-table \$$MYSQL_DATABASE'" \
		| $(COMPOSE) exec -T mysql sh -c "mysql -u \$$MYSQL_USER -p\$$MYSQL_PASSWORD \$$MYSQL_DATABASE"; \
	fi
	@echo "$(GREEN)Base de datos local actualizada$(NC)"

deploy: ## Deploy blue/green sin corte (usage: make deploy TAG=x.x.x): tests, backup, build y smoke en el color inactivo, conmutación de nginx
	@if [ -z "$(TAG)" ]; then \
		echo "Error: TAG is required. Use: make deploy TAG=x.x.x"; \
		exit 1; \
	fi
	@if [ -n "$$(git status --porcelain --untracked-files=no)" ]; then \
		echo "Error: el árbol tiene cambios sin commitear; deploy desde una copia limpia de main."; \
		exit 1; \
	fi
	@CURRENT_BRANCH=$$(git branch --show-current); \
	if [ "$$CURRENT_BRANCH" != "main" ]; then \
		echo "Current branch is $$CURRENT_BRANCH, merging with main..."; \
		git checkout main && git pull origin main && git merge $$CURRENT_BRANCH || exit 1; \
	else \
		git pull --ff-only origin main || exit 1; \
	fi
	@echo "Verificando tests y build antes de taggear (make test-ci)..."
	@$(MAKE) --no-print-directory test-ci || { echo "Error: tests/build fallaron; no se pushea, no se taggea y no se despliega."; exit 1; }
	@git push origin main
	@echo "Creating release $(TAG)..."
	@git tag -a $(TAG) -m "Release version $(TAG)"
	@git push origin $(TAG)
	@echo "🚀 Desplegando $(TAG) en $(SERVER) (blue/green: build y smoke en el color inactivo, conmutación sin corte)..."
	@ssh $(SERVER) "cd $(DEPLOY_PATH) && \
		git fetch --tags && PREV_REF=\$$(git rev-parse HEAD) && git checkout $(TAG) && \
		PREV_REF=\$$PREV_REF scripts/deploy-bluegreen.sh $(TAG)"
	@echo "✅ Deploy $(TAG) completado y verificado!"
