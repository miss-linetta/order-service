# Order Management Service

This project provides a service for managing orders, including creating, updating, retrieving, and deleting orders, along with state transitions and price confirmation via an external service.

## API Endpoints

### Create Order

**POST /orders**

This endpoint creates a new order. You need to provide the following parameters in the request body:
- `name`: The name of the order (string).
- `isin`: The International Securities Identification Number (ISIN) (string).
- `amount`: The amount of the order (number).

**Request Example:**
```json
{
  "name": "Test Order",
  "isin": "US0378331005",
  "amount": 1
}
```

**Response Example:**
```json
{
  "id": 1,
  "name": "Test Order",
  "isin": "US0378331005",
  "amount": 1,
  "price": 0,
  "state": 0
}
```

---

### Get All Orders

**GET /orders**

This endpoint retrieves all orders. You can filter by `state` by passing it as a query parameter.

**Request Example (with state filter):**
```http
GET /orders?state=0
```

**Response Example:**
```json
[
  {
    "id": 1,
    "name": "Test Order",
    "isin": "US0378331005",
    "amount": 1,
    "price": 0,
    "state": 0
  }
]
```

---

### Get Order by ID

**GET /orders/:id**

This endpoint retrieves an order by its ID.

**Request Example:**
```http
GET /orders/1
```

**Response Example:**
```json
{
  "id": 1,
  "name": "Test Order",
  "isin": "US0378331005",
  "amount": 1,
  "price": 0,
  "state": 0
}
```

---

### Update Order Amount

**PATCH /orders/:id/amount**

This endpoint updates the amount of an order. You need to provide the new amount in the request body.

**Request Example:**
```json
{
  "amount": 2
}
```

**Response Example:**
```json
{
  "id": 1,
  "name": "Test Order",
  "isin": "US0378331005",
  "amount": 2,
  "price": 0,
  "state": 0
}
```

---

### Update Order State

**PATCH /orders/:id/state**

This endpoint updates the state of an order. You need to provide the new state in the request body. If the order is in the `STATE_CREATED` state and is being updated to `STATE_CONFIRMED`, a confirmation request will be made to an external service.

**Request Example:**
```json
{
  "state": 1
}
```

**Response Example:**
```json
{
  "id": 1,
  "name": "Test Order",
  "isin": "US0378331005",
  "amount": 2,
  "price": 100,
  "state": 1
}
```

---

### Delete Order

**DELETE /orders/:id**

This endpoint deletes an order by its ID. Deletion is only allowed for orders that are in the `STATE_CREATED` state.

**Request Example:**
```http
DELETE /orders/1
```

**Response Example:**
```json
{
  "id": 1,
  "name": "Test Order",
  "isin": "US0378331005",
  "amount": 1,
  "price": 0,
  "state": 0
}
```

---

## Main Service Functionality

### Key Variables and States:

- **Order State:**
  - `0` – Created (`STATE_CREATED`)
  - `1` – Confirmed (`STATE_CONFIRMED`)

- **Price Calculation:**
  If the order transitions to `STATE_CONFIRMED`, the price is fetched from an external confirmation service.

### Errors:

- **400 Bad Request**: Invalid request or missing required parameters.
- **404 Not Found**: Order not found.

---

### Technologies Used

- **Node.js** for the backend API.
- **MySQL** for the database.
- **gRPC** for communication with the external confirmation service.

---

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/miss-linetta/order-service.git
   ```

2. Set up the port configuration in `.env` for order service:
   ```bash
   PORT=8080
   ```

3. Set up the port configuration in `.env` for confirmation service:
   ```bash
   PORT=9090
   ```

4. Start the service (you must have Docker installed):
   ```bash
   docker compose build
   docker compose up -d
   
   ```

The service will run on `http://localhost:3001`.
