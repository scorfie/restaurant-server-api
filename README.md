# Restaurant Server API

REST + WebSocket API for managing restaurant branches, per-branch menus, orders, customer accounts, and staff accounts, built with NestJS and Supabase (Postgres).

## Stack

- NestJS (TypeScript)
- Supabase Postgres, accessed via Prisma (`prisma/schema.prisma`)
- `class-validator` / `class-transformer` for request validation (DTOs)
- `@nestjs/jwt` + `bcryptjs` for authentication (custom JWT, not Supabase Auth — `staff`/`customers` tables own their own credentials)
- `@nestjs/websockets` (Socket.IO) for real-time order updates
- `@nestjs/swagger` for interactive API docs
- Layered architecture: controllers → services → Prisma → Postgres

## Project structure

```
prisma/
  schema.prisma          Datasource + all models/enums
  seed.ts                 Bootstraps the first admin staff account
src/
  main.ts                 Bootstrap: middleware, global prefix, pipes, filters, Swagger
  app.module.ts
  common/
    filters/http-exception.filter.ts   Uniform {success,message,details?} error shape
    guards/                             JwtAuthGuard, CustomerGuard, StaffRolesGuard
    decorators/                         @Roles(), @CurrentUser()
    pipes/positive-int.pipe.ts
    dto/pagination-query.dto.ts
  prisma/                 PrismaService (global module)
  auth/                   Login/register, JWT strategy
  branches/
  menu-items/              Branch-scoped + flat controllers
  orders/                   Branch-scoped + flat controllers, OrdersGateway (Socket.IO)
  customers/                Self-service + staff visibility
  staff/
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and fill in your Supabase connection strings, `JWT_SECRET`, and the `ADMIN_*` values:
   ```bash
   cp .env.example .env
   ```
   `DATABASE_URL` is Supabase's pooled Postgres connection (used at runtime); `DIRECT_URL` is the non-pooled connection (used only by `prisma migrate`). Both are on the Supabase project's Database settings page.

3. Create the database tables:
   ```bash
   npm run migrate:dev
   ```

4. Bootstrap the first admin staff account (there is no public admin signup endpoint — this is the only way to create one):
   ```bash
   npm run seed:admin
   ```

5. Start the server:
   ```bash
   npm run dev     # nest start --watch
   npm run build && npm start   # compiled
   ```

The API is served under `http://localhost:3000/api/v1`. Interactive docs are at `http://localhost:3000/api-docs` (raw spec at `/api-docs.json`).

## Authentication & authorization

There are two separate kinds of accounts, each with their own login endpoint and JWT:

- **Customers** — register themselves, place and view their own orders.
- **Staff** — `admin`, `manager`, or `staff` role, created only by an admin (or the seed script for the first admin). Manage branches, menus, and all orders.

Send the token from either login endpoint as `Authorization: Bearer <token>` on protected routes.

| Role                  | Can do                                                                 |
|------------------------|-------------------------------------------------------------------------|
| Public (no token)      | Browse branches and menus, register, log in                             |
| `customer`              | Manage own profile, place orders, view own order history                |
| `staff`                | Update menu item availability, create/view/update orders                |
| `manager`               | Everything `staff` can, plus create/update branches and menu items, view all customers |
| `admin`                | Everything, plus create/update/delete staff accounts                    |

### Auth endpoints

| Method | Path                | Description                                   |
|--------|----------------------|-------------------------------------------------|
| POST   | `/auth/register`      | Register a new customer account                 |
| POST   | `/auth/login`          | Customer login → `{ token, customer }`           |
| POST   | `/auth/staff/login`    | Staff login → `{ token, staff }`                 |

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"AlicePass123","phone":"+94-77-1112222"}'

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"AlicePass123"}'
```

## Branch model

| Field            | Type              | Notes                          |
|------------------|-------------------|---------------------------------|
| id               | int               | auto increment                  |
| name             | string            | required                        |
| code             | string            | required, unique                |
| address          | string            | required                        |
| city             | string            | required                        |
| state            | string            | optional                        |
| country          | string            | optional (default `Sri Lanka`)  |
| postalCode       | string            | optional                        |
| phone            | string            | required                        |
| email            | string            | optional                        |
| managerName      | string            | optional                        |
| openingTime      | `HH:mm`/`HH:mm:ss`| optional                        |
| closingTime      | `HH:mm`/`HH:mm:ss`| optional                        |
| seatingCapacity  | int               | optional                        |
| latitude         | float             | optional                        |
| longitude        | float             | optional                        |
| status           | `active`/`inactive` | defaults to `active`          |

### Branch endpoints

| Method | Path                       | Auth              | Description                          |
|--------|-----------------------------|-------------------|---------------------------------------|
| GET    | `/health`                   | public            | Health check                          |
| POST   | `/branches`                 | admin/manager     | Create a branch                       |
| GET    | `/branches`                 | public            | List branches (pagination + filters)  |
| GET    | `/branches/:id`              | public            | Get a single branch                   |
| PUT    | `/branches/:id`              | admin/manager     | Update a branch (partial update)      |
| PATCH  | `/branches/:id/status`       | admin/manager     | Update only the branch status         |
| DELETE | `/branches/:id`              | admin/manager     | Delete a branch                       |

List filters: `page`, `limit`, `status`, `city`, `search` (matches `name` or `code`).

## Menu item model

| Field       | Type    | Notes                       |
|-------------|---------|------------------------------|
| id          | int     | auto increment               |
| branchId    | int     | branch this item belongs to  |
| name        | string  | required                     |
| description | string  | optional                     |
| price       | float   | required, >= 0               |
| category    | string  | optional (e.g. `Main`)       |
| imageUrl    | string  | optional, must be a valid URL |
| isAvailable | boolean | defaults to `true`           |

### Menu item endpoints

| Method | Path                                  | Auth                       | Description                              |
|--------|----------------------------------------|-----------------------------|--------------------------------------------|
| POST   | `/branches/:branchId/menu-items`       | admin/manager               | Create a menu item for a branch             |
| GET    | `/branches/:branchId/menu-items`       | public                      | List menu items for a branch (filters below)|
| GET    | `/menu-items/:id`                      | public                      | Get a single menu item                      |
| PUT    | `/menu-items/:id`                      | admin/manager/staff         | Update a menu item (e.g. toggle availability) |
| DELETE | `/menu-items/:id`                      | admin/manager               | Delete a menu item (fails with 409 if referenced by existing orders) |

List filters: `page`, `limit`, `category`, `isAvailable`, `search` (matches `name`).

## Order model

Orders belong to a branch, optionally to a customer account, and contain a snapshot of the menu items ordered (name and price at order time), so later menu price changes never affect historical orders.

| Field         | Type                                                        | Notes                              |
|---------------|--------------------------------------------------------------|--------------------------------------|
| id            | int                                                          | auto increment                       |
| branchId      | int                                                          | branch the order was placed at       |
| customerId    | int, nullable                                                | set when placed via `/customers/me/orders` |
| orderNumber   | string                                                       | generated, e.g. `ORD-000001`         |
| customerName  | string                                                       | from the account if `customerId` is set, otherwise free text |
| customerPhone | string                                                       | same as above                        |
| orderType     | `dine_in` / `takeaway` / `delivery`                          | defaults to `dine_in`                |
| tableNumber   | string                                                       | optional, typically used for dine-in |
| status        | `pending` / `preparing` / `ready` / `completed` / `cancelled`| defaults to `pending`                |
| notes         | string                                                       | optional                             |
| totalAmount   | float                                                        | sum of order item subtotals          |
| items         | array                                                        | `menuItemId`, `itemName`, `unitPrice`, `quantity`, `subtotal`, `notes` |

### Order status workflow

```
pending → preparing → ready → completed
   ↓          ↓          ↓
   └────── cancelled ────┘
```

Only the transitions in the diagram are allowed; anything else (e.g. `preparing → completed`, or re-setting the same status) returns `400`.

### Two ways to place an order

1. **Staff-facing** (walk-in / dine-in, taken by a staff member) — `POST /branches/:branchId/orders`, requires staff auth, accepts `customerName`/`customerPhone` as free text.
2. **Customer-facing** (self-service) — `POST /customers/me/orders`, requires customer auth, takes `branchId` in the body; `customerName`/`customerPhone` are always pulled from the logged-in account.

### Order endpoints (staff)

| Method | Path                              | Auth   | Description                                          |
|--------|-------------------------------------|--------|----------------------------------------------------------|
| POST   | `/branches/:branchId/orders`       | staff  | Create a walk-in/dine-in order for a branch                |
| GET    | `/branches/:branchId/orders`       | staff  | List orders for a branch (filters below)                   |
| GET    | `/orders`                          | staff  | List orders across all branches (filters + `branchId`)     |
| GET    | `/orders/:id`                      | staff  | Get a single order with its items                          |
| PATCH  | `/orders/:id/status`               | staff  | Transition an order's status                                |

List filters: `page`, `limit`, `status`, `orderType`, `dateFrom`, `dateTo` (ISO 8601).

### Order endpoints (customer)

| Method | Path                        | Auth      | Description                              |
|--------|-------------------------------|-----------|---------------------------------------------|
| POST   | `/customers/me/orders`       | customer  | Place an order as the logged-in customer     |
| GET    | `/customers/me/orders`       | customer  | List the logged-in customer's own orders     |
| GET    | `/customers/me/orders/:id`   | customer  | Get one of the logged-in customer's own orders (404 if it belongs to someone else) |
| PATCH  | `/customers/me/orders/:id/cancel` | customer | Cancel one of the logged-in customer's own orders (same transition rules as staff cancellation — fails with 400 once `completed` or already `cancelled`) |

```bash
curl -X POST http://localhost:3000/api/v1/customers/me/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customer-token>" \
  -d '{
    "branchId": 1,
    "orderType": "takeaway",
    "items": [
      { "menuItemId": 1, "quantity": 2 },
      { "menuItemId": 3, "quantity": 1, "notes": "no onions" }
    ]
  }'
```

Order creation validates that every `menuItemId` belongs to the target branch and is currently available, computes each line's subtotal server-side from the menu item's current price, and writes the order plus its items in a single database transaction.

## Real-time order updates (WebSocket)

The HTTP server and the WebSocket server run on the same port (`server.js` wraps the Express app in a plain `http.Server` and attaches Socket.IO to it), so no separate port or process is needed.

### Connecting

Authenticate the socket with the **same JWT** used for REST (customer or staff token), passed in the `auth` payload — not as an HTTP header, since this is a handshake, not a request:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<jwt-from-login>' },
});

socket.on('connect_error', (err) => console.error('rejected:', err.message));
```

A connection without a valid token is rejected at the handshake (`connect_error`) before any data is exchanged. On connect, sockets are auto-joined to a room based on their identity:

- Customer token → joined to `customer:<customerId>` (their own order updates only).
- Staff token (any role) → joined to `staff` (every order update, matching what `GET /orders` already exposes to staff).

### Client → server events

| Event                | Payload            | Who           | Effect                                                                 |
|-----------------------|----------------------|----------------|---------------------------------------------------------------------------|
| `order:subscribe`     | `{ orderId }`         | customer/staff | Joins `order:<id>` and acks with `{ success, data: <order> }` — this is the "get status" call: it returns the current order immediately, then live updates follow via `order:statusChanged`. Customers get a `success: false` ack (no order leaked) if the order isn't theirs. |
| `order:unsubscribe`   | `{ orderId }`         | customer/staff | Leaves `order:<id>`.                                                        |
| `branch:subscribe`    | `{ branchId }`        | staff only     | Joins `branch:<id>` (e.g. a kitchen display for one branch). Acks `{ success: false }` for customer tokens. |
| `branch:unsubscribe`  | `{ branchId }`        | staff only     | Leaves `branch:<id>`.                                                       |

### Server → client events

| Event                 | Payload         | Sent to                                                              |
|------------------------|-------------------|-------------------------------------------------------------------------|
| `order:created`        | full order object  | `staff` room, `branch:<branchId>` room, and `customer:<customerId>` room if the order has one |
| `order:statusChanged`  | full order object  | same targets as above, plus anyone subscribed to `order:<id>` directly     |

```js
socket.emit('order:subscribe', { orderId: 42 }, (res) => {
  if (res.success) console.log('current status:', res.data.status);
});

socket.on('order:statusChanged', (order) => {
  console.log(`order ${order.orderNumber} is now ${order.status}`);
});
```

Both `order:created` and `order:statusChanged` fire from `order.service.js` after the triggering REST call (`POST .../orders` or `PATCH /orders/:id/status`) commits — there's no polling on the client side.

## Customer account endpoints

| Method | Path                    | Auth               | Description                          |
|--------|---------------------------|---------------------|-----------------------------------------|
| GET    | `/customers/me`           | customer            | Get own profile                          |
| PUT    | `/customers/me`           | customer            | Update own profile (name, phone, address) |
| PUT    | `/customers/me/password`  | customer            | Change own password                      |
| GET    | `/customers`               | admin/manager       | List customer accounts (filters: `page`, `limit`, `search`) |
| GET    | `/customers/:id`           | admin/manager       | Get a customer account by id             |

## Staff account endpoints

| Method | Path             | Auth            | Description                                   |
|--------|--------------------|------------------|--------------------------------------------------|
| GET    | `/staff/me`         | any staff role   | Get own staff profile                             |
| POST   | `/staff`             | admin            | Create a staff account                            |
| GET    | `/staff`             | admin/manager    | List staff accounts (filters: `page`, `limit`, `branchId`, `role`) |
| GET    | `/staff/:id`         | admin/manager    | Get a staff account by id                         |
| PUT    | `/staff/:id`         | admin            | Update a staff account (name, role, branch)       |
| DELETE | `/staff/:id`         | admin            | Delete a staff account                            |

## API documentation (Swagger)

A full OpenAPI 3.0 spec covering every endpoint (schemas, auth requirements, example responses) is served at:

- `GET /api-docs` — interactive Swagger UI. Use the "Authorize" button to paste a `Bearer <token>` once and it applies to every try-it-out call.
- `GET /api-docs.json` — the raw spec, importable into Postman/Insomnia.

## Error format

All errors are returned as:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "name", "message": "name is required" }]
}
```
