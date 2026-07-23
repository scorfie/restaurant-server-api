# Restaurant Server API

REST API for managing restaurant branches, per-branch menus, orders, customer accounts, and staff accounts, built with Node.js, Express, and MySQL.

## Stack

- Node.js + Express, using native ES modules (`"type": "module"` in package.json)
- MySQL (`mysql2` with a connection pool)
- `express-validator` for request validation
- `jsonwebtoken` + `bcryptjs` for authentication
- `swagger-ui-express` for interactive API docs
- Layered architecture: routes → controllers → services → MySQL

## Project structure

```
src/
  config/
    db.js            MySQL connection pool
    migrate.js        Runs SQL files in migrations/
    seedAdmin.js       Bootstraps the first admin staff account
  controllers/
    auth.controller.js
    branch.controller.js
    customer.controller.js
    menuItem.controller.js
    order.controller.js
    staff.controller.js
  services/
    auth.service.js        Login for customers and staff, issues JWTs
    branch.service.js       All SQL queries live here
    customer.service.js
    menuItem.service.js
    order.service.js        Transactional order creation + status workflow
    staff.service.js
  routes/
    auth.routes.js
    branch.routes.js
    customer.routes.js
    menuItem.routes.js      Branch-scoped + flat routers
    order.routes.js         Branch-scoped + flat routers
    staff.routes.js
    index.js
  middleware/
    auth.js             JWT verification + role guards
    errorHandler.js
    validate.js
  validators/
    auth.validator.js
    branch.validator.js
    customer.validator.js
    menuItem.validator.js
    order.validator.js
    staff.validator.js
  utils/
    ApiError.js
    asyncHandler.js
    jwt.js
    password.js
  docs/
    openapi.js          OpenAPI 3.0 spec served at /api-docs
  app.js                Express app setup
migrations/
  001_create_branches_table.sql
  002_create_menu_items_table.sql
  003_create_orders_tables.sql
  004_create_customers_table.sql
  005_create_staff_table.sql
  006_add_customer_id_to_orders.sql
server.js               Entry point
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and adjust credentials (including `JWT_SECRET` and the `ADMIN_*` values):
   ```bash
   cp .env.example .env
   ```

3. Create the database and tables:
   ```bash
   npm run migrate
   ```

4. Bootstrap the first admin staff account (there is no public admin signup endpoint — this is the only way to create one):
   ```bash
   npm run seed:admin
   ```

5. Start the server:
   ```bash
   npm run dev   # with nodemon
   npm start     # plain node
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
