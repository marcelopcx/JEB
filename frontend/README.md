# JEB cart demo frontend

React/Vite classroom interface for the existing JEB Jakarta EE API. It displays real browser-visible HTTP exchanges and a separately labelled static explanation of each backend path.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- JDK 17 at `/usr/lib/jvm/java-17-openjdk`
- Docker with Compose
- Ports 5173, 5433, and 8080 available

## Start

From the repository root, start PostgreSQL and build the WAR:

```bash
docker compose up -d --wait
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH="$JAVA_HOME/bin:$PATH"
./mvnw clean package
```

Start WildFly:

```bash
docker run -d --rm --name jeb-wildfly --network host \
  -v "$PWD/target/JEB-1.0-SNAPSHOT.war:/opt/jboss/wildfly/standalone/deployments/JEB-1.0-SNAPSHOT.war:ro" \
  quay.io/wildfly/wildfly:40.0.1.Final-jdk17
```

Start the frontend:

```bash
npm install --prefix frontend
npm run dev --prefix frontend -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Vite forwards `/api` to `http://localhost:8080/JEB-1.0-SNAPSHOT/api`.

## Verify

```bash
npm test --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

All commands must exit with status 0 before the presentation.

## Stop

Stop the frontend with `Ctrl+C`, then run:

```bash
docker stop jeb-wildfly
docker compose down
```

`docker compose down` keeps the named PostgreSQL volume. Add `--volumes` only when intentionally discarding local database data.

## Demonstration limits

- The UI has no checkout, payment, order, login, or authentication flow.
- User IDs are cache keys, not authenticated accounts.
- Carts are local WildFly-process memory and disappear when that process stops.
- Product stock is transport data only; this backend does not enforce or decrement stock during cart operations.
- Adding the same product accumulates quantity. There is no endpoint for replacing part of an item's quantity.
- `Explained backend path` is static documentation, not server telemetry.
