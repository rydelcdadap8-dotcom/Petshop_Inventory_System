# Petshop Inventory System API

This is a Node.js API built with Express. It connects to an Aiven PostgreSQL database and is ready to deploy on Render from GitHub.

## What It Includes

- Express server
- Aiven PostgreSQL connection through `DATABASE_URL`
- Health check endpoint for Render
- Petshop product inventory API
- Philippine peso pricing
- Stock in, stock out, and stock adjustment history
- Dashboard totals and low-stock tracking
- Admin and user login with role-based access
- Customer purchase reminders and next-product suggestions
- Database initializer
- Render deployment config
- GitHub-friendly project structure

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

3. Add your Aiven PostgreSQL connection string to `.env`:

   ```bash
   DATABASE_URL=postgres://avnadmin:password@your-host.aivencloud.com:12345/defaultdb?sslmode=require
   ```

4. Create the database table:

   ```bash
   npm run db:init
   ```

5. Add sample petshop products:

   ```bash
   npm run db:seed
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

The API will run at `http://localhost:3000`.

Default login accounts are created automatically when the app starts:

- Admin: `admin` / `admin123`
- User: `user` / `user123`

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `USER_USERNAME`, and `USER_PASSWORD` in `.env` before the first run to change these seeded accounts. Admins can add, edit, delete, receive stock, adjust stock, see supplier/cost/low-stock details, and record purchases. Users get a customer dashboard where they can browse public product details, see price and available quantity, and buy products. After buying, customers see a refill reminder and next-product suggestions based on the item they purchased.

## API Endpoints

- `GET /health` checks if the app and database are reachable.
- `POST /api/auth/login` logs in and returns the signed-in user role.
- `GET /api/auth/me` returns the current signed-in user.
- `POST /api/auth/logout` logs out the current session.
- `GET /api/products` lists products.
- `GET /api/products?search=food` searches by product name or supplier.
- `GET /api/products?category=Food` filters by category.
- `GET /api/products/:id` gets one product.
- `POST /api/products` creates a product.
- `PUT /api/products/:id` updates a product.
- `DELETE /api/products/:id` deletes a product.
- `POST /api/products/:id/stock` records stock in, stock out, or stock adjustment.
- `GET /api/dashboard` returns totals and recent stock movements.
- `GET /api/orders` lists the current user's orders, or all orders for admins.
- `POST /api/orders` creates a customer order with `gcash` or `cod` payment.
- `PATCH /api/orders/:id/status` lets admins update order status.
- `GET /api/stock-movements` lists recent stock movement history.

Create or update a product with JSON like:

  ```json
  {
    "name": "Dog Food",
    "category": "Food",
    "sku": "PET-FOOD-001",
    "barcode": "480000000001",
    "unit": "pcs",
    "quantity": 20,
    "costPrice": 500,
    "price": 650,
    "lowStockLimit": 5,
    "supplier": "Local Pet Supplier",
    "description": "Dry food for adult dogs"
  }
  ```

Record a stock movement with JSON like:

  ```json
  {
    "movementType": "stock_in",
    "quantity": 10,
    "remarks": "New delivery"
  }
  ```

Use `stock_in`, `stock_out`, or `adjustment` for `movementType`.

## Push To GitHub

From this folder:

```bash
git init
git add .
git commit -m "Initial Node.js Aiven Render system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## Deploy On Render

1. Push this project to GitHub.
2. In Render, choose **New Web Service**.
3. Connect your GitHub repository.
4. Render can read `render.yaml`, or you can use:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
5. Add this environment variable in Render:

   ```bash
   DATABASE_URL=your-aiven-postgresql-url
   ```

6. Deploy.

## Aiven Notes

Use the PostgreSQL service URI from Aiven. It usually includes `sslmode=require`. This project also enables SSL when `PGSSL=true`.
