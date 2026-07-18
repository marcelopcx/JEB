# Guía de defensa — JEB (Carrito de compras con Java Enterprise)

Documento para el equipo. Si nunca han trabajado con Java Enterprise / Jakarta EE, empiecen por la sección 1.

---

## 1. ¿Qué es este proyecto? (en una frase)

Es una API REST de carrito de compras donde:

- los **productos** viven en una **base de datos PostgreSQL**
- el **carrito de cada usuario** vive en **caché en memoria** (no en la DB)

Cumple el enunciado: *consultar la DB solo para los productos que el cliente puede agregar o quitar; el carrito se guarda en caché por usuario*.

---

## 2. Java Enterprise explicado sin dolor

**Java Enterprise** (hoy se llama **Jakarta EE**) no es “otro lenguaje”. Es Java + un **servidor de aplicaciones** (Payara, WildFly, GlassFish) que te regala servicios listos:

| Tecnología | Anotación típica | ¿Para qué sirve aquí? |
|------------|------------------|------------------------|
| **JAX-RS** | `@Path`, `@GET`, `@POST` | Exponer la API HTTP (`/api/...`) |
| **EJB** | `@Stateless` | Lógica de negocio gestionada por el servidor (transacciones, pool) |
| **CDI** | `@Inject`, `@ApplicationScoped` | Inyectar dependencias (conectar capas sin `new`) |
| **JPA** | `@Entity`, `@PersistenceContext` | Mapear la tabla `products` a la clase `Product` |

### Analogía rápida

Imaginen un restaurante:

- **Resource (JAX-RS)** = el mesero (recibe el pedido del cliente HTTP)
- **Service (EJB)** = la cocina (decide qué hacer)
- **Repository (JPA)** = la despensa / DB (solo productos)
- **Cache (CDI)** = la bandeja del carrito en memoria (por usuario)

El mesero no cocina ni va a la despensa directo: llama a la cocina. Eso es **separación en capas**.

### ¿Qué es un “Enterprise Bean”?

Un **EJB** (Enterprise JavaBean) es una clase administrada por el servidor.

En este proyecto usamos **`@Stateless`**:

- el servidor crea instancias y las reutiliza
- no guardan estado de un usuario entre llamadas (por eso el carrito **no** está en el EJB, está en la caché)
- el servidor maneja transacciones al hablar con la DB

Clases `@Stateless` del proyecto:

- `ProductRepository`
- `ProductService`
- `CartService`
- `ProductDataLoader` (además es `@Singleton` + `@Startup`: corre al arrancar)

### ¿Qué es CDI?

**CDI** = inyección de dependencias.

En vez de hacer:

```java
ProductService service = new ProductService();
```

hacemos:

```java
@Inject
private ProductService productService;
```

El servidor conecta las piezas solo. Por eso existe `beans.xml` (activa CDI).

`CartCache` usa `@ApplicationScoped`: **una sola instancia para toda la app**, compartida, con un `ConcurrentHashMap` de carritos.

---

## 3. Regla de oro del enunciado (esto hay que saberlo de memoria)

| Acción | ¿Toca la DB? | ¿Toca la caché? |
|--------|--------------|-----------------|
| Listar productos | Sí | No |
| Ver un producto | Sí | No |
| Ver carrito | **No** | Sí |
| Agregar al carrito | Sí (validar producto) | Sí (guardar ítem) |
| Quitar del carrito | Sí (validar producto) | Sí (quitar ítem) |
| Vaciar carrito | No | Sí |

**Frase para la oral:**  
“La base de datos es la fuente de verdad del catálogo. El carrito es estado temporal por usuario y se mantiene en caché en memoria para no persistirlo en DB.”

---

## 4. Arquitectura del código

```
Cliente (Bruno / navegador)
        |
        v
+-------------------+
|  Resource (REST)  |  ProductResource, CartResource
+---------+---------+
          | @Inject
          v
+-------------------+
|  Service (EJB)    |  ProductService, CartService
+---------+---------+
          |
     +----+----+
     v         v
 Repository   CartCache
 (JPA/DB)     (memoria)
     |
     v
 PostgreSQL (Docker)
```

### Paquetes

| Paquete | Rol |
|---------|-----|
| `resource` | Endpoints HTTP |
| `service` | Reglas de negocio |
| `repository.dao` | Consultas a DB (solo `Product`) |
| `entity` | Tabla `products` |
| `dto` | Objetos JSON del carrito (NO son tablas) |
| `cache` | Carritos en memoria por `userId` |
| `bootstrap` | Datos de ejemplo al arrancar |

### Archivos de configuración importantes

| Archivo | Qué hace |
|---------|----------|
| `Application.java` | Prefijo `/api` + datasource a Postgres |
| `persistence.xml` | Unidad JPA `default` → datasource `java:app/jdbc/jeb` |
| `beans.xml` | Activa CDI |
| `import.sql` | Inserta productos al crear el esquema |
| `docker-compose.yml` | Levanta PostgreSQL |

---

## 5. API REST (qué demostrar)

Base (ajustar si tu servidor usa otro context path):

```text
http://localhost:8080/JEB-1.0-SNAPSHOT/api
```

| Método | URL | Descripción |
|--------|-----|-------------|
| `GET` | `/products` | Catálogo (DB) |
| `GET` | `/products/{id}` | Un producto (DB) |
| `GET` | `/cart/{userId}` | Carrito (caché) |
| `POST` | `/cart/{userId}/items` | Agregar ítem |
| `DELETE` | `/cart/{userId}/items/{productId}` | Quitar ítem |
| `DELETE` | `/cart/{userId}` | Vaciar carrito |

Body para agregar:

```json
{
  "productId": 1,
  "quantity": 2
}
```

Colección Bruno lista en: `bruno/jeb-cart-api/`  
Abrir en Bruno → Open Collection → elegir esa carpeta → entorno **local**.

---

## 6. Cómo levantarlo (paso a paso para la demo)

### Requisitos

- Docker Desktop encendido
- JDK + Maven (o el wrapper `./mvnw`)
- Servidor Jakarta EE (Payara / WildFly) o despliegue desde IntelliJ

### 1) Base de datos

```bash
docker compose up -d
```

- Host: `localhost`
- Puerto: **5433** (no 5432; ese suele estar ocupado)
- DB / user / password: `jeb` / `jeb` / `jeb`

### 2) Desplegar la app

Desde IntelliJ: Run/Deploy del WAR en Payara/WildFly.  
O construir:

```bash
./mvnw clean package
```

y desplegar `target/JEB-1.0-SNAPSHOT.war`.

### 3) Probar

Orden recomendado en Bruno:

1. List Products  
2. Get Product By Id  
3. Add Item To Cart  
4. Get Cart  
5. Remove Item / Clear Cart  

---

## 7. Flujo interno al agregar un producto (para dibujar en la pizarra)

1. Cliente hace `POST /api/cart/user1/items` con `{ productId: 1, quantity: 2 }`
2. `CartResource` recibe la petición y llama a `CartService`
3. `CartService` pregunta a `ProductRepository` si el producto 1 existe (**DB**)
4. Si existe, toma el carrito de `CartCache` para `user1` (**memoria**)
5. Agrega o suma la cantidad del ítem (guarda nombre y precio como “foto” del momento)
6. Recalcula el total y guarda de nuevo en caché
7. Devuelve el carrito en JSON

Cuando después hacen `GET /api/cart/user1`, **no se consulta la DB**.

---

## 8. Preguntas típicas del profesor (y respuestas cortas)

**¿Por qué el carrito no está en la base de datos?**  
Porque el enunciado pide caché. Además el carrito es temporal; si reinicias el servidor se pierde, y eso es coherente con una caché en memoria.

**¿Qué pasa si hay dos nodos (dos servidores)?**  
Esta caché es local (`ConcurrentHashMap`). No se comparte entre servidores. En producción se usaría caché distribuida (Infinispan, Redis). Para la práctica está bien y se puede mencionar como limitación.

**¿Qué es `@Stateless`?**  
Un EJB sin estado de conversación: el servidor lo gestiona y no guarda datos de un usuario entre requests.

**¿Qué es `@ApplicationScoped`?**  
Una sola instancia CDI para toda la aplicación. La usamos en `CartCache` para que todos los requests vean los mismos carritos en memoria.

**¿Qué es JPA?**  
API para mapear clases Java a tablas SQL. `Product` ↔ tabla `products`.

**¿Dónde está la URL de PostgreSQL?**  
En `Application.java` (`@DataSourceDefinition`). `persistence.xml` solo referencia el nombre JNDI `java:app/jdbc/jeb`.

**¿Quién crea la tabla y los datos?**  
JPA con `drop-and-create` + `import.sql`. Si el SQL no corre, `ProductDataLoader` inserta productos al arrancar.

**Diferencia entre Entity y DTO**  
- `Product` = entidad JPA (DB)  
- `CartDto` / `CartItemDto` = solo JSON/memoria, no tablas

---

## 9. División sugerida para la defensa (equipo)

| Rol | Qué explica | Archivos clave |
|-----|-------------|----------------|
| Persona 1 | Enunciado + arquitectura general | este doc, diagrama |
| Persona 2 | DB, JPA, Docker, `Product` | `entity`, `persistence.xml`, `docker-compose.yml` |
| Persona 3 | Caché + carrito | `CartCache`, `CartService` |
| Persona 4 | API REST + demo Bruno | `*Resource`, colección Bruno |

Todos deben poder decir la **regla de oro** (sección 3).

---

## 10. Glosario express

- **WAR**: empaquetado web que se despliega en el servidor  
- **JNDI**: nombre con el que el servidor encuentra el datasource (`java:app/jdbc/jeb`)  
- **Datasource**: conexión configurada a la base de datos  
- **Endpoint**: una URL + método HTTP de la API  
- **Seed / bootstrap**: datos iniciales para no tener la DB vacía  
- **Context path**: prefijo del WAR, ej. `/JEB-1.0-SNAPSHOT`

---

## 11. Checklist 5 minutos antes de presentar

- [ ] `docker compose ps` → contenedor `jeb-postgres` healthy  
- [ ] App desplegada sin errores en el log  
- [ ] `GET /products` devuelve productos  
- [ ] Agregar ítem y ver carrito  
- [ ] Explicar en voz alta: “DB = productos, caché = carrito”  
- [ ] Bruno abierto con entorno `local` (revisar `baseUrl` si falla)

---

¡Éxito en la defensa! Si algo falla en vivo, muestren el código de `CartService.addItem`: ahí se ve claro el acceso a DB y luego a caché.
