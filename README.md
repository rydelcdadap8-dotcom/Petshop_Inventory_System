# Petshop Inventory System API

This is a Node.js API built with Express. It connects to an Aiven PostgreSQL database and is ready to deploy on Render from GitHub.

## What It Includes

- Express server
- Aiven PostgreSQL connection through `DATABASE_URL`
- Health check endpoint for Render
- Petshop product inventory API
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

5. Start the app:

   ```bash
   npm run dev
   ```

The API will run at `http://localhost:3000`.

## API Endpoints

- `GET /health` checks if the app and database are reachable.
- `GET /api/products` lists products.
- `GET /api/products?search=food` searches by product name or supplier.
- `GET /api/products?category=Food` filters by category.
- `GET /api/products/:id` gets one product.
- `POST /api/products` creates a product.
- `PUT /api/products/:id` updates a product.
- `DELETE /api/products/:id` deletes a product.

Create or update a product with JSON like:

  ```json
  {
    "name": "Dog Food",
    "category": "Food",
    "quantity": 20,
    "price": 12.5,
    "supplier": "Aiven Pet Supplies",
    "description": "Dry food for adult dogs"
  }
  ```

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
