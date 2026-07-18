# JEB — Carrito de compras (Jakarta EE)

API REST de carrito de compras en **Java Enterprise (Jakarta EE)**:

- **Productos** → PostgreSQL (JPA)
- **Carrito por usuario** → caché en memoria (CDI)

## Requisitos

- Docker Desktop
- JDK 11+ (recomendado) y Maven, o IntelliJ con Payara/WildFly
- [Bruno](https://www.usebruno.com/) (opcional, para probar la API)

## Arranque rápido

### 1. Base de datos

```bash
docker compose up -d
```

| Parámetro | Valor |
|-----------|--------|
| Host | `localhost` |
| Puerto | `5433` |
| Database | `jeb` |
| User / Password | `jeb` / `jeb` |

### 2. Desplegar la aplicación

```bash
./mvnw clean package
```

Despliega `target/JEB-1.0-SNAPSHOT.war` en Payara o WildFly (o usa Run desde IntelliJ).

### 3. Probar

Base URL típica:

```text
http://localhost:8080/JEB-1.0-SNAPSHOT/api
```

Colección Bruno: carpeta [`bruno/jeb-cart-api`](bruno/jeb-cart-api).

| Método | Ruta | Origen |
|--------|------|--------|
| `GET` | `/products` | DB |
| `GET` | `/products/{id}` | DB |
| `GET` | `/cart/{userId}` | Caché |
| `POST` | `/cart/{userId}/items` | DB + caché |
| `DELETE` | `/cart/{userId}/items/{productId}` | DB + caché |
| `DELETE` | `/cart/{userId}` | Caché |

## Documentación para la defensa

Lee **[`docs/GUIA-DEFENSA.md`](docs/GUIA-DEFENSA.md)**: explicación de Jakarta EE, arquitectura, demo y preguntas típicas para el equipo.

## Estructura

```
src/main/java/com/ziff/jeb/
├── Application.java          # /api + datasource Postgres
├── bootstrap/                # seed de productos
├── cache/                    # carritos en memoria
├── dto/                      # JSON del carrito
├── entity/                   # Product (JPA)
├── repository/dao/           # acceso a DB
├── resource/                 # endpoints REST
└── service/                  # lógica de negocio (EJB)
```
