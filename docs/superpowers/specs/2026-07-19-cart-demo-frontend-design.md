# Build a transparent cart demonstration frontend

Create a small React and TypeScript interface that operates the real JEB cart API while making every HTTP interaction understandable during a classroom presentation. The interface favors technical transparency and predictable operation over storefront polish.

## Quick path

1. Start PostgreSQL and deploy the JEB WAR to WildFly.
2. Start the Vite frontend from `frontend/`.
3. Use the catalog and cart while the technical panel displays each real request and its explanatory backend path.

## Goals

- Demonstrate every cart operation currently supported by the backend.
- Make actual HTTP requests, responses, status codes, and durations visible.
- Explain the internal Jakarta EE path without presenting inferred steps as runtime telemetry.
- Keep the interface simple enough to operate confidently during the presentation.
- Avoid backend changes unless a verified integration blocker requires one.

## Non-goals

- Checkout, payments, orders, login, or authentication.
- Partial quantity updates, because the backend has no matching endpoint.
- A production storefront or elaborate visual effects.
- Claims that the local cart cache is distributed or persistent.
- Instrumenting the Java backend solely to animate the interface.

## Architecture

The frontend lives in `frontend/` inside the JEB repository and uses React, Vite, and TypeScript. During development, Vite proxies `/api` to the deployed WildFly context path. This avoids browser CORS failures without changing the Java application.

```text
Browser
  -> Vite /api proxy
  -> WildFly /JEB-1.0-SNAPSHOT/api
  -> JAX-RS Resource
  -> EJB Service
  -> ProductRepository/PostgreSQL or CartCache
```

The browser only observes the HTTP boundary. Internal pipeline steps are static explanations mapped to each endpoint and must be labelled `Explained backend path`, not runtime traces.

## Screen layout

The application uses one responsive screen with four regions:

| Region | Responsibility |
| --- | --- |
| Header | Application title, backend connection state, and editable user ID |
| Product catalog | Real products from `GET /products` with inspect and add actions |
| Cart | Current items, quantities, subtotals, total, remove actions, and clear action |
| Technical panel | Latest HTTP exchange, explained backend path, and request history |

The catalog and cart are the primary interaction area. The technical panel remains visible during the demo but uses compact disclosure controls for large JSON bodies.

## Components and boundaries

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `api/cartApi` | Typed calls to the existing JEB endpoints | `fetch` wrapper |
| `api/httpClient` | Timing, JSON parsing, normalized errors, and exchange capture | Browser Fetch API |
| `CartDemo` | Coordinates selected user, catalog, cart, and request history | API modules |
| `ProductCatalog` | Displays products and emits inspect/add intents | Product data |
| `CartPanel` | Displays backend cart state and emits remove/clear intents | Cart data |
| `UserSelector` | Changes the active cart identity | User ID state |
| `RequestInspector` | Shows real method, path, status, duration, request, and response | Captured exchanges |
| `BackendPath` | Shows the labelled explanatory path for an endpoint | Static endpoint map |
| `ConnectionStatus` | Distinguishes connected, loading, and unavailable states | Latest request state |

Business totals are never recomputed as the source of truth. The interface renders the subtotal and total returned by the backend.

## Interaction flow

### Initial load

1. Select the default user `demo-eliab`.
2. Request `GET /products`.
3. Request `GET /cart/demo-eliab`.
4. Render each response independently so a catalog failure does not erase an already loaded cart.

### Add a product

1. The presenter chooses a quantity greater than zero and clicks Add.
2. The frontend sends `POST /cart/{userId}/items` with `productId` and `quantity`.
3. The returned cart replaces the local cart state.
4. The technical panel records the real exchange and displays:

```text
CartResource -> CartService -> ProductRepository -> PostgreSQL
                                -> CartCache
```

### Inspect a product

Selecting a product's technical details sends `GET /products/{id}` and displays the returned entity in the request inspector. This intentionally exercises the product-by-ID endpoint without adding a separate storefront page.

### Remove or clear

- Removing sends `DELETE /cart/{userId}/items/{productId}`.
- Clearing sends `DELETE /cart/{userId}`.
- In both cases, the returned cart replaces local cart state.

### Change user

Changing the user ID requests that user's cart and keeps the catalog loaded. This allows the presentation to compare `demo-eliab` and another user without claiming authentication or durable user accounts.

## HTTP transparency

Each captured exchange contains:

- request method and relative API path;
- start time and measured duration;
- request JSON when present;
- response status and JSON or text body;
- normalized success or failure state.

The newest exchange appears expanded. Up to 20 exchanges remain in memory for the current browser session. History is presentation evidence only and is not persisted.

## Error handling

- Do not apply optimistic cart updates; only backend responses change cart state.
- Show backend `400` and `404` messages when the response contains `{ "error": string }`.
- Show status and raw response text when the server returns another format.
- Distinguish a rejected HTTP response from an unreachable backend.
- Disable only the action currently in flight, preventing accidental duplicate submissions while preserving the rest of the screen.
- Keep the last valid catalog and cart visible when a later request fails.
- Validate non-empty user IDs and positive integer quantities before sending requests.

## Visual direction

Use a restrained technical-dashboard style: neutral background, high-contrast cards, readable monospace JSON, and one accent color for active operations. HTTP success and failure states use accessible color plus text labels. No animations are required beyond a small loading indicator and highlighting the newest exchange.

## Verification

### Automated

- TypeScript production build succeeds.
- HTTP client tests cover successful JSON, backend error JSON, non-JSON failure, and unreachable backend.
- API tests verify method, path, and body for each supported cart operation.
- Component tests verify loading, empty cart, populated cart, and visible error states.

### Integrated smoke test

With PostgreSQL and WildFly running:

1. Load five products.
2. Load an empty cart for a new user ID.
3. Add product 1 with quantity 2 and display total `1799.98` for the seeded data.
4. Add the same product again and show that the backend accumulates quantity.
5. Switch users and show separate cart state.
6. Remove the item and clear the cart.
7. Trigger quantity validation and product-not-found errors.
8. Stop WildFly and confirm the unavailable state is understandable.

## Acceptance checklist

- [ ] Every displayed catalog and cart value comes from the JEB API.
- [ ] All six existing endpoints used by the frontend are observable in the technical panel.
- [ ] Actual HTTP evidence and explained backend paths are visibly differentiated.
- [ ] The presenter can switch user IDs and demonstrate independent in-memory carts.
- [ ] The frontend works through the Vite proxy without Java CORS changes.
- [ ] No unsupported checkout, authentication, stock enforcement, or quantity replacement is implied.
- [ ] Build, focused frontend tests, and the integrated smoke sequence pass before presentation.

## Presentation sequence

1. Confirm backend connectivity and explain the two state stores.
2. Load products from PostgreSQL.
3. Load a new in-memory cart.
4. Add one product and inspect the complete HTTP exchange.
5. Add it again to demonstrate accumulation.
6. Switch users to demonstrate cache keys.
7. Show one controlled backend error.
8. Remove and clear the cart.
9. Close by stating that carts are local, ephemeral, and not distributed across nodes.
