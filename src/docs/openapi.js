const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
});

const paginatedResponse = (itemsRef, description) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: itemsRef } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
    },
  },
});

const objectResponse = (ref, description, status = 200) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: status < 300 },
          data: { $ref: ref },
        },
      },
    },
  },
});

const pageParam = { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } };
const limitParam = { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } };

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Restaurant Server API',
    version: '1.0.0',
    description:
      'REST API for managing restaurant branches, menus, orders, customer accounts, and staff accounts. ' +
      'Authenticate with `POST /auth/login` (customers) or `POST /auth/staff/login` (staff), then send the ' +
      'returned token as `Authorization: Bearer <token>` on protected endpoints.\n\n' +
      'Real-time order updates are also available over Socket.IO on the same host/port (not representable in ' +
      'OpenAPI) — connect with the same JWT in the socket `auth` payload and listen for `order:created` / ' +
      '`order:statusChanged`. See the README for the full WebSocket event reference.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth', description: 'Registration and login for customers and staff' },
    { name: 'Customers', description: 'Customer self-service profile and orders' },
    { name: 'Staff', description: 'Staff account management (admin only, unless noted)' },
    { name: 'Branches', description: 'Restaurant branch management' },
    { name: 'Menu Items', description: 'Per-branch menu management' },
    { name: 'Orders', description: 'Staff-facing order management' },
    { name: 'Health', description: 'Service health check' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Branch: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          code: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string', nullable: true },
          country: { type: 'string' },
          postalCode: { type: 'string', nullable: true },
          phone: { type: 'string' },
          email: { type: 'string', nullable: true },
          managerName: { type: 'string', nullable: true },
          openingTime: { type: 'string', nullable: true, example: '08:00:00' },
          closingTime: { type: 'string', nullable: true, example: '22:00:00' },
          seatingCapacity: { type: 'integer', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          status: { type: 'string', enum: ['active', 'inactive'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      BranchInput: {
        type: 'object',
        required: ['name', 'code', 'address', 'city', 'phone'],
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          postalCode: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          managerName: { type: 'string' },
          openingTime: { type: 'string', example: '08:00' },
          closingTime: { type: 'string', example: '22:00' },
          seatingCapacity: { type: 'integer' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      },
      MenuItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          branchId: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          price: { type: 'number' },
          category: { type: 'string', nullable: true },
          isAvailable: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      MenuItemInput: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          category: { type: 'string' },
          isAvailable: { type: 'boolean', default: true },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          menuItemId: { type: 'integer' },
          itemName: { type: 'string' },
          unitPrice: { type: 'number' },
          quantity: { type: 'integer' },
          subtotal: { type: 'number' },
          notes: { type: 'string', nullable: true },
        },
      },
      OrderItemInput: {
        type: 'object',
        required: ['menuItemId', 'quantity'],
        properties: {
          menuItemId: { type: 'integer' },
          quantity: { type: 'integer', minimum: 1 },
          notes: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          branchId: { type: 'integer' },
          customerId: { type: 'integer', nullable: true },
          orderNumber: { type: 'string', example: 'ORD-000001' },
          customerName: { type: 'string', nullable: true },
          customerPhone: { type: 'string', nullable: true },
          orderType: { type: 'string', enum: ['dine_in', 'takeaway', 'delivery'] },
          tableNumber: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'] },
          notes: { type: 'string', nullable: true },
          totalAmount: { type: 'number' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      OrderInput: {
        type: 'object',
        required: ['items'],
        properties: {
          customerName: { type: 'string' },
          customerPhone: { type: 'string' },
          orderType: { type: 'string', enum: ['dine_in', 'takeaway', 'delivery'], default: 'dine_in' },
          tableNumber: { type: 'string' },
          notes: { type: 'string' },
          items: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/OrderItemInput' } },
        },
      },
      CustomerOrderInput: {
        type: 'object',
        required: ['branchId', 'items'],
        properties: {
          branchId: { type: 'integer' },
          orderType: { type: 'string', enum: ['dine_in', 'takeaway', 'delivery'], default: 'dine_in' },
          tableNumber: { type: 'string' },
          notes: { type: 'string' },
          items: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/OrderItemInput' } },
        },
      },
      OrderStatusInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'] },
        },
      },
      Customer: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string', nullable: true },
          address: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CustomerRegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 8 },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
      },
      CustomerUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
        },
      },
      ChangePasswordInput: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password', minLength: 8 },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      CustomerAuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          customer: { $ref: '#/components/schemas/Customer' },
        },
      },
      Staff: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          branchId: { type: 'integer', nullable: true },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      StaffCreateInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 8 },
          role: { type: 'string', enum: ['admin', 'manager', 'staff'], default: 'staff' },
          branchId: { type: 'integer', nullable: true },
        },
      },
      StaffUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
          branchId: { type: 'integer', nullable: true },
        },
      },
      StaffAuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          staff: { $ref: '#/components/schemas/Staff' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'API is healthy' } },
      },
    },

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new customer account',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerRegisterInput' } } } },
        responses: {
          201: objectResponse('#/components/schemas/Customer', 'Customer created', 201),
          400: errorResponse('Validation failed'),
          409: errorResponse('Email already registered'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in as a customer',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: {
          200: objectResponse('#/components/schemas/CustomerAuthResponse', 'Login successful'),
          401: errorResponse('Invalid email or password'),
        },
      },
    },
    '/auth/staff/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in as a staff member',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: {
          200: objectResponse('#/components/schemas/StaffAuthResponse', 'Login successful'),
          401: errorResponse('Invalid email or password'),
        },
      },
    },

    '/customers/me': {
      get: {
        tags: ['Customers'],
        summary: "Get the logged-in customer's profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: objectResponse('#/components/schemas/Customer', 'Customer profile'), 401: errorResponse('Missing or invalid token') },
      },
      put: {
        tags: ['Customers'],
        summary: "Update the logged-in customer's profile",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerUpdateInput' } } } },
        responses: { 200: objectResponse('#/components/schemas/Customer', 'Updated profile'), 401: errorResponse('Missing or invalid token') },
      },
    },
    '/customers/me/password': {
      put: {
        tags: ['Customers'],
        summary: "Change the logged-in customer's password",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordInput' } } } },
        responses: {
          200: { description: 'Password updated' },
          400: errorResponse('Current password is incorrect'),
          401: errorResponse('Missing or invalid token'),
        },
      },
    },
    '/customers/me/orders': {
      post: {
        tags: ['Customers'],
        summary: 'Place an order as the logged-in customer',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerOrderInput' } } } },
        responses: {
          201: objectResponse('#/components/schemas/Order', 'Order created', 201),
          400: errorResponse('Validation failed or a menu item is unavailable'),
          401: errorResponse('Missing or invalid token'),
        },
      },
      get: {
        tags: ['Customers'],
        summary: "List the logged-in customer's orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          pageParam,
          limitParam,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'] } },
        ],
        responses: { 200: paginatedResponse('#/components/schemas/Order', "Customer's orders"), 401: errorResponse('Missing or invalid token') },
      },
    },
    '/customers/me/orders/{id}': {
      get: {
        tags: ['Customers'],
        summary: "Get a single order belonging to the logged-in customer",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: objectResponse('#/components/schemas/Order', 'Order detail'),
          401: errorResponse('Missing or invalid token'),
          404: errorResponse('Order not found'),
        },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers'],
        summary: 'List customer accounts (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [pageParam, limitParam, { name: 'search', in: 'query', schema: { type: 'string' } }],
        responses: {
          200: paginatedResponse('#/components/schemas/Customer', 'Customer list'),
          401: errorResponse('Missing or invalid token'),
          403: errorResponse('Insufficient permissions'),
        },
      },
    },
    '/customers/{id}': {
      get: {
        tags: ['Customers'],
        summary: 'Get a customer account by id (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: objectResponse('#/components/schemas/Customer', 'Customer detail'),
          401: errorResponse('Missing or invalid token'),
          403: errorResponse('Insufficient permissions'),
          404: errorResponse('Customer not found'),
        },
      },
    },

    '/staff/me': {
      get: {
        tags: ['Staff'],
        summary: "Get the logged-in staff member's profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: objectResponse('#/components/schemas/Staff', 'Staff profile'), 401: errorResponse('Missing or invalid token') },
      },
    },
    '/staff': {
      post: {
        tags: ['Staff'],
        summary: 'Create a staff account (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StaffCreateInput' } } } },
        responses: {
          201: objectResponse('#/components/schemas/Staff', 'Staff created', 201),
          403: errorResponse('Insufficient permissions'),
          409: errorResponse('Email already in use'),
        },
      },
      get: {
        tags: ['Staff'],
        summary: 'List staff accounts (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [pageParam, limitParam, { name: 'branchId', in: 'query', schema: { type: 'integer' } }, { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'manager', 'staff'] } }],
        responses: { 200: paginatedResponse('#/components/schemas/Staff', 'Staff list'), 403: errorResponse('Insufficient permissions') },
      },
    },
    '/staff/{id}': {
      get: {
        tags: ['Staff'],
        summary: 'Get a staff account by id (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: objectResponse('#/components/schemas/Staff', 'Staff detail'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Staff not found') },
      },
      put: {
        tags: ['Staff'],
        summary: 'Update a staff account (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/StaffUpdateInput' } } } },
        responses: { 200: objectResponse('#/components/schemas/Staff', 'Updated staff'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Staff not found') },
      },
      delete: {
        tags: ['Staff'],
        summary: 'Delete a staff account (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 204: { description: 'Deleted' }, 403: errorResponse('Insufficient permissions'), 404: errorResponse('Staff not found') },
      },
    },

    '/branches': {
      post: {
        tags: ['Branches'],
        summary: 'Create a branch (admin/manager)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BranchInput' } } } },
        responses: { 201: objectResponse('#/components/schemas/Branch', 'Branch created', 201), 403: errorResponse('Insufficient permissions'), 409: errorResponse('Branch code already exists') },
      },
      get: {
        tags: ['Branches'],
        summary: 'List branches',
        parameters: [pageParam, limitParam, { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } }, { name: 'city', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }],
        responses: { 200: paginatedResponse('#/components/schemas/Branch', 'Branch list') },
      },
    },
    '/branches/{id}': {
      get: {
        tags: ['Branches'],
        summary: 'Get a branch by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: objectResponse('#/components/schemas/Branch', 'Branch detail'), 404: errorResponse('Branch not found') },
      },
      put: {
        tags: ['Branches'],
        summary: 'Update a branch (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BranchInput' } } } },
        responses: { 200: objectResponse('#/components/schemas/Branch', 'Updated branch'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Branch not found') },
      },
      delete: {
        tags: ['Branches'],
        summary: 'Delete a branch (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 204: { description: 'Deleted' }, 403: errorResponse('Insufficient permissions'), 404: errorResponse('Branch not found') },
      },
    },
    '/branches/{id}/status': {
      patch: {
        tags: ['Branches'],
        summary: 'Update a branch status (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['active', 'inactive'] } } } } } },
        responses: { 200: objectResponse('#/components/schemas/Branch', 'Updated branch'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Branch not found') },
      },
    },

    '/branches/{branchId}/menu-items': {
      post: {
        tags: ['Menu Items'],
        summary: 'Create a menu item for a branch (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'branchId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MenuItemInput' } } } },
        responses: { 201: objectResponse('#/components/schemas/MenuItem', 'Menu item created', 201), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Branch not found') },
      },
      get: {
        tags: ['Menu Items'],
        summary: 'List menu items for a branch',
        parameters: [
          { name: 'branchId', in: 'path', required: true, schema: { type: 'integer' } },
          pageParam,
          limitParam,
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'isAvailable', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: paginatedResponse('#/components/schemas/MenuItem', 'Menu item list'), 404: errorResponse('Branch not found') },
      },
    },
    '/menu-items/{id}': {
      get: {
        tags: ['Menu Items'],
        summary: 'Get a menu item by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: objectResponse('#/components/schemas/MenuItem', 'Menu item detail'), 404: errorResponse('Menu item not found') },
      },
      put: {
        tags: ['Menu Items'],
        summary: 'Update a menu item (admin/manager/staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MenuItemInput' } } } },
        responses: { 200: objectResponse('#/components/schemas/MenuItem', 'Updated menu item'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Menu item not found') },
      },
      delete: {
        tags: ['Menu Items'],
        summary: 'Delete a menu item (admin/manager)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 204: { description: 'Deleted' }, 403: errorResponse('Insufficient permissions'), 409: errorResponse('Menu item is referenced by existing orders') },
      },
    },

    '/branches/{branchId}/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create a walk-in/dine-in order for a branch (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'branchId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderInput' } } } },
        responses: { 201: objectResponse('#/components/schemas/Order', 'Order created', 201), 400: errorResponse('Validation failed or a menu item is unavailable'), 403: errorResponse('Insufficient permissions') },
      },
      get: {
        tags: ['Orders'],
        summary: 'List orders for a branch (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'branchId', in: 'path', required: true, schema: { type: 'integer' } },
          pageParam,
          limitParam,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'] } },
          { name: 'orderType', in: 'query', schema: { type: 'string', enum: ['dine_in', 'takeaway', 'delivery'] } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: paginatedResponse('#/components/schemas/Order', 'Order list'), 403: errorResponse('Insufficient permissions') },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders across all branches (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          pageParam,
          limitParam,
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'] } },
          { name: 'orderType', in: 'query', schema: { type: 'string', enum: ['dine_in', 'takeaway', 'delivery'] } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: paginatedResponse('#/components/schemas/Order', 'Order list'), 403: errorResponse('Insufficient permissions') },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get an order by id (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: objectResponse('#/components/schemas/Order', 'Order detail'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Order not found') },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Transition an order status (staff only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderStatusInput' } } } },
        responses: { 200: objectResponse('#/components/schemas/Order', 'Updated order'), 400: errorResponse('Invalid status transition'), 403: errorResponse('Insufficient permissions'), 404: errorResponse('Order not found') },
      },
    },
  },
};

export default openapiSpec;
