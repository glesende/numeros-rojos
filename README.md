# Numeros Rojos - Portal de Transparencia

**Los datos que todo socio de Independiente tiene que saber.**

Portal de datos abiertos del Club Atletico Independiente (Argentina). Transparencia economica, contractual y deportiva.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Backend](https://img.shields.io/badge/Backend-Lumen%20PHP%208.2-orange)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-blue)
![Docker](https://img.shields.io/badge/Infra-Docker-2496ED)

---

## ¿Sos de otro club y querés replicarlo?

Números Rojos está diseñado para ser replicable. Si representás a una institución deportiva y querés tener tu propio portal de transparencia, podés clonar este repositorio y adaptarlo.

**¿Qué necesitás cambiar?**

| Qué | Dónde |
|-----|-------|
| Nombre e identidad del club | `frontend/src/pages/HomePage.jsx`, `frontend/src/components/layout/Footer.jsx` |
| Datos iniciales | `backend/database/seeders/` |
| Variables de entorno | `.env` y `backend/.env` |
| Integración de estadísticas | `backend/app/Services/BeSoccerService.php` (opcional) |

Si tenés dudas durante la adaptación, [abrí un Issue](https://github.com/glesende/numeros-rojos/issues) con la etiqueta `adaptacion-club`.

---

## Stack

| Capa       | Tecnologia                     |
|------------|--------------------------------|
| Backend    | Lumen (PHP 8.2)               |
| Base datos | MySQL 8.0                      |
| Cache      | Redis 7                        |
| Frontend   | React 18 + Vite 5              |
| Estilos    | TailwindCSS 3.4                |
| Auth admin | JWT (tymon/jwt-auth)           |
| Infra      | Docker + docker-compose        |

---

## Estructura del proyecto

```
numeros-rojos/
├── backend/                  # API Lumen
│   ├── app/
│   │   ├── Console/Commands/ # Comandos (export CSV)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/
│   │   │   └── Middleware/
│   │   ├── Models/           # EconomyRecord, Contract, User
│   │   ├── Providers/
│   │   └── Services/         # BeSoccerService
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
├── frontend/                 # React + Vite
│   └── src/
│       ├── api/              # Axios client + endpoints
│       ├── components/       # UI components
│       ├── context/          # AuthContext
│       ├── hooks/            # useFilters
│       └── pages/            # Vistas
├── docker/
│   ├── nginx/
│   ├── mysql/
│   ├── php/
│   └── frontend/
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Inicio rapido

### 1. Clonar y configurar

```bash
git clone https://github.com/glesende/numeros-rojos numeros-rojos
cd numeros-rojos
make setup
```

Editar `.env` y `backend/.env` si es necesario.

### 2. Levantar el entorno

```bash
make build
make up
```

### 3. Migrar y seedear

```bash
make migrate
make seed
```

### 4. Acceder

| Servicio  | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:5173         |
| API       | http://localhost:8080/api/v1  |
| API root  | http://localhost:8080         |

### Credenciales admin por defecto

```
Email:    admin@numerosrojos.ar
Password: password
```

---

## Comandos disponibles (Makefile)

```bash
make help              # Ver todos los comandos
make up                # Levantar contenedores
make down              # Detener contenedores
make build             # Rebuild contenedores
make logs              # Ver logs
make migrate           # Correr migraciones
make seed              # Correr seeders
make fresh             # Migrate fresh + seed
make test              # Correr tests PHPUnit
make db                # Abrir MySQL CLI
make redis-cli         # Abrir Redis CLI
make shell-api         # Shell en el contenedor API
make shell-frontend    # Shell en el contenedor frontend
make export-csv TABLE=economy_records  # Exportar a CSV
make clean             # Eliminar volumenes
```

---

## API Endpoints

### Publicos

| Metodo | Ruta                          | Descripcion                    |
|--------|-------------------------------|--------------------------------|
| GET    | /api/v1/economy               | Listar registros economicos    |
| GET    | /api/v1/economy/{id}          | Detalle de registro            |
| GET    | /api/v1/contracts             | Listar contratos               |
| GET    | /api/v1/contracts/{id}        | Detalle de contrato            |
| GET    | /api/v1/standings             | Posiciones (BeSoccer)          |
| GET    | /api/v1/player/{id}/stats     | Stats de jugador (BeSoccer)    |
| GET    | /api/v1/league/stats          | Stats de liga (BeSoccer)       |

### Filtros disponibles (economy)

- `type` - cobro | pago
- `official` - 1 | 0
- `date_from` - YYYY-MM-DD
- `date_to` - YYYY-MM-DD
- `sort_dir` - asc | desc
- `page` - numero de pagina
- `per_page` - registros por pagina (max 100)

### Admin (requiere JWT)

| Metodo | Ruta                              | Descripcion                |
|--------|-----------------------------------|----------------------------|
| POST   | /api/v1/auth/login                | Login (devuelve JWT)       |
| GET    | /api/v1/admin/me                  | Usuario actual             |
| POST   | /api/v1/admin/auth/refresh        | Refrescar token            |
| POST   | /api/v1/admin/auth/logout         | Cerrar sesion              |
| POST   | /api/v1/admin/economy             | Crear registro economico   |
| PUT    | /api/v1/admin/economy/{id}        | Actualizar registro        |
| DELETE | /api/v1/admin/economy/{id}        | Eliminar registro          |
| POST   | /api/v1/admin/contracts           | Crear contrato             |
| PUT    | /api/v1/admin/contracts/{id}      | Actualizar contrato        |
| DELETE | /api/v1/admin/contracts/{id}      | Eliminar contrato          |

---

## BeSoccer

Para activar las estadisticas en tiempo real:

1. Obtener API key de BeSoccer
2. Configurar en `.env`:
   ```
   BESOCCER_API_KEY=tu_api_key
   ```
3. Los TTL de cache son configurables via:
   ```
   CACHE_TTL_STANDINGS=3600
   CACHE_TTL_PLAYER_STATS=1800
   CACHE_TTL_LEAGUE_STATS=3600
   ```

---

## Modelo de datos

### economy_records

| Campo            | Tipo                       |
|------------------|----------------------------|
| id               | bigint (PK)                |
| description      | text                       |
| type             | enum: cobro, pago          |
| amount           | decimal(15,2)              |
| currency         | enum: ARS, USD, EUR       |
| record_date      | date                       |
| official         | boolean                    |
| carried_out      | boolean                    |
| links            | json (nullable)            |
| created_at       | timestamp                  |
| updated_at       | timestamp                  |

### contracts

| Campo                | Tipo                       |
|----------------------|----------------------------|
| id                   | bigint (PK)                |
| external_id          | varchar(255) nullable       |
| full_name            | varchar(255)               |
| expiration_date      | date                       |
| club_pass_percentage | decimal(5,2)               |
| estimated_salary     | decimal(15,2) nullable     |
| currency             | enum: ARS, USD, EUR (nullable)  |
| official             | boolean                    |
| clauses              | json (nullable)            |
| links                | json (nullable)            |
| created_at           | timestamp                  |
| updated_at           | timestamp                  |

---

## Preparado para el futuro

- **Historial de cambios:** Estructura preparada para agregar tabla de auditorias (model events)
- **Exportacion CSV:** Comando `php artisan export:csv {table}` implementado
- **Automatizacion de estadisticas:** BeSoccerService con cache Redis, listo para scheduled tasks
- **Nuevas secciones:** Arquitectura modular para agregar nuevos modelos y controladores

---

## Desarrollo

### Backend

```bash
make shell-api
composer install
php artisan migrate
php artisan db:seed
```

### Frontend

```bash
make shell-frontend
npm install
npm run dev
```

---

## Contribuir

Las contribuciones son bienvenidas. Leé [CONTRIBUTING.md](CONTRIBUTING.md) para saber cómo empezar.

Para reportar errores o sugerir mejoras, usá los [Issues de GitHub](https://github.com/glesende/numeros-rojos/issues).

---

## Licencia

MIT License. Ver [LICENSE](LICENSE) para más detalles.
