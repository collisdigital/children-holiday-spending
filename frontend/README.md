# Frontend - Holiday Spending Tracker

This is the React frontend for the Children Holiday Spending application. It is built with Vite, TypeScript, Tailwind CSS, and served in production using Fastify.

## Prerequisites

- Node.js (v20 or higher recommended)
- npm

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    The application connects to a backend API. You can configure the backend location using environment variables:
    - `BACKEND_HOST`: The hostname of the backend API (used by Vite proxy). Defaults to `localhost`.
    - `BACKEND_PORT`: The port of the backend API (used by Vite proxy). Defaults to `8000`.
    - `VITE_API_URL`: If set, overrides the proxy and uses this absolute URL for all API requests (e.g., `https://api.myapp.com`). If unset, the app uses relative paths, which are proxied via the Vite development server.

3.  **Run in Development mode:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

## Production

To run the application in a production-like environment:

1.  **Build the application:**
    ```bash
    npm run build
    ```
    This generates a static `dist` folder.

2.  **Start the Fastify server:**
    ```bash
    npm start
    ```
    The server will serve the `dist` folder on port `8000` (or the port specified by the `PORT` environment variable). It includes built-in SPA routing support.

## Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the production assets.
- `npm start`: Runs the Fastify production server (requires `npm run build` first).
- `npm test`: Runs the test suite using Vitest.
- `npm run lint`: Runs ESLint for code quality checks.
- `npm run preview`: Locally previews the production build.

## Project Structure

- `src/api`: API client configuration (Axios).
- `src/components`: Reusable UI components.
- `src/pages`: Main application views/routes.
- `src/utils`: Helper functions and utilities.
- `server.js`: Fastify server for production hosting.
