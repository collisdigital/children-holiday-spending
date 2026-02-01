# Backend - Holiday Spending Tracker

This is the FastAPI backend for the Holiday Spending Tracker. It provides a RESTful API to manage children and their holiday expenses, using SQLAlchemy for ORM and Alembic for database migrations.

## Prerequisites

- Python 3.11 or higher
- `pip` (or `pipenv`/`poetry`)

## Getting Started

1.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables:**
    The application uses `pydantic-settings` to manage configuration. You can create a `.env` file in the `backend` directory:
    - `DATABASE_URL`: SQLAlchemy connection string. Defaults to `sqlite+aiosqlite:///./holiday_tracker.db`.
    - `ADMIN_PIN`: PIN for administrative actions. Defaults to `1122`.

3.  **Run Migrations:**
    Before starting the server, apply the database migrations:
    ```bash
    alembic upgrade head
    ```

4.  **Run in Development mode:**
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000` and the interactive docs at `http://localhost:8000/docs`.

## Database Migrations

- **Create a new migration:**
  ```bash
  alembic revision --autogenerate -m "description of changes"
  ```
- **Apply migrations:**
  ```bash
  alembic upgrade head
  ```
- **Revert last migration:**
  ```bash
  alembic downgrade -1
  ```

## Testing & Quality

- **Run tests:**
  ```bash
  pytest
  ```
- **Run linting:**
  ```bash
  ruff check .
  ```
- **Auto-format code:**
  ```bash
  ruff format .
  ```

## Project Structure

- `alembic/`: Database migration scripts and configuration.
- `config.py`: Application settings and environment variable handling.
- `crud.py`: Create, Read, Update, and Delete operations.
- `database.py`: SQLAlchemy engine and session management.
- `main.py`: FastAPI application initialization and route definitions.
- `models.py`: SQLAlchemy database models.
- `schemas.py`: Pydantic schemas for data validation and serialization.
- `tests/`: Automated test suite.
