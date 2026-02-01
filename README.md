# Children Holiday Spending Tracker

A full-stack application for tracking and managing holiday spending for children. This project is structured as a monorepo containing both the frontend and backend components.

## Project Structure

- **`/backend`**: FastAPI (Python) application providing a REST API, using SQLAlchemy and Alembic.
- **`/frontend`**: React (TypeScript) application built with Vite and Tailwind CSS, served by Fastify in production.

## Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```
The backend will be running at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be running at `http://localhost:5173`.

## Architecture Overview

- **Frontend**: React SPA using `@tanstack/react-query` for data fetching and `lucide-react` for icons. Styled with Tailwind CSS.
- **Backend**: FastAPI with asynchronous database support via `asyncpg`/`aiosqlite`.
- **Database**: Supports SQLite for local development and PostgreSQL for production.
- **Deployment**: The frontend is optimized to be served via a Fastify static server for compatibility with platforms that prefer Node.js runtimes over Docker.

## Features

- **Child Dashboard**: Individual views for children to see their spending.
- **Admin Management**: Secure (PIN-protected) interface for adding, updating, and deleting expenses.
- **Currency Support**: Formatted currency display for all transactions.
- **Category Tracking**: Categorize expenses (e.g., Toys, Clothes, Food).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
