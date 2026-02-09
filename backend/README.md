# Microfinance Backend

Node.js/Express backend for the Microfinance Management System.

## Deployment on Render

1. Push this folder to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create a new **Web Service**
4. Connect your GitHub repo
5. Set the following:
   - **Root Directory**: `app/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Click **Create Web Service**

The database is already configured to use your Render PostgreSQL.

## API Endpoints

- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create group
- `GET /api/members` - Get all members
- `POST /api/members` - Create member
- `GET /api/collections` - Get all collections
- `POST /api/collections` - Create collection
- `GET /api/health` - Health check
