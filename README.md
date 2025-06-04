# Payroll Management System - MERN Stack

This project is a comprehensive Payroll Management System built using the MERN stack (MongoDB, Express.js, React, Node.js). It's a conversion and enhancement of an original PHP-based payroll application.

## Features

*   **Company & User Management:**
    *   Company registration.
    *   Admin user creation for companies.
    *   Employee user creation with role-based access (Company Admin, Employee Admin, HR Manager, Employee).
    *   Secure JWT-based authentication.
*   **Employee Lifecycle Management:**
    *   Detailed employee profiles (personal, contact, statutory, bank, next of kin).
    *   CRUD operations for employees.
    *   Management of departments and income grades (salary structures).
*   **Payroll Processing:**
    *   Calculation of gross earnings based on basic salary and allowances.
    *   Statutory deductions: PAYE (Tax), NHIF, NSSF (based on configurable rates/brackets).
    *   Handling of advances, damages, and reimbursements.
    *   Generation of monthly payroll records (payslips).
    *   Approval workflows for payslips (e.g., Pending, Approved, Paid).
*   **Financial Operations:**
    *   Management of employee advances, damages to be deducted, and reimbursements.
    *   Tracking status of these financial operations.
*   **Reporting & Payslips:**
    *   Viewing individual employee payslips with detailed breakdown of earnings and deductions.
    *   Listing of payroll runs.
    *   (Future enhancements could include summary reports for NHIF, Tax etc.)
*   **Settings & Configuration:**
    *   Management of banks.
    *   API endpoint for updating payroll settings like tax brackets and NHIF rates.

## Technologies Used

*   **Backend:**
    *   **Node.js:** JavaScript runtime environment.
    *   **Express.js:** Web application framework for Node.js.
    *   **MongoDB:** NoSQL database for storing application data.
    *   **Mongoose:** ODM (Object Data Modeling) library for MongoDB and Node.js.
    *   **JSON Web Tokens (JWT):** For secure authentication.
    *   **bcryptjs:** For password hashing.
    *   **dotenv:** For managing environment variables.
    *   **cors:** For enabling Cross-Origin Resource Sharing.
*   **Frontend:**
    *   **React:** JavaScript library for building user interfaces.
    *   **React Router DOM:** For client-side routing.
    *   **Axios:** Promise-based HTTP client for making API requests.
    *   **React Context API:** For global state management (e.g., authentication).
    *   **CSS:** For styling (basic setup, can be enhanced with frameworks/libraries).
*   **Development & Testing (Planned/Conceptual):**
    *   **Jest:** JavaScript testing framework.
    *   **Supertest:** For backend API endpoint testing.
    *   **React Testing Library (RTL):** For testing React components.
    *   **MongoDB Memory Server:** For isolated backend testing.
    *   **Mock Service Worker (MSW) / Axios Mock Adapter:** For frontend API mocking.

## Prerequisites

*   Node.js (v14.x or later recommended)
*   npm (Node Package Manager) or yarn
*   MongoDB (local instance or a cloud-hosted service like MongoDB Atlas)

## Project Structure

```
/payroll-mern/
  ├── client/         # React Frontend Application
  │   ├── public/
  │   ├── src/
  │   │   ├── assets/
  │   │   ├── components/ # Reusable UI components
  │   │   ├── features/   # Feature-specific components/pages (Conceptual)
  │   │   ├── hooks/
  │   │   ├── layouts/    # Main application layout
  │   │   ├── pages/      # Top-level page components
  │   │   ├── services/   # API service (Axios instance)
  │   │   ├── store/      # Global state (e.g., AuthContext)
  │   │   ├── utils/
  │   │   ├── App.js
  │   │   ├── index.js
  │   ├── package.json
  │   └── ...
  ├── server/         # Node.js/Express Backend API
  │   ├── config/     # Database connection, env config
  │   ├── controllers/ # Request handling logic
  │   ├── middleware/  # Custom middleware (auth, error handling)
  │   ├── models/     # Mongoose schemas and models
  │   ├── routes/     # API endpoint definitions
  │   ├── services/   # Business logic services (e.g., payroll calculation)
  │   ├── utils/      # Utility functions
  │   ├── .env        # Environment variables (MONGO_URI, JWT_SECRET, PORT)
  │   ├── package.json
  │   ├── server.js   # Main Express application setup
  │   └── ...
  ├── .gitignore
  └── README.md       # This file
```

## Setup and Installation

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd payroll-mern
    ```

2.  **Backend Setup:**
    ```bash
    cd server
    npm install
    ```
    *   Create a `.env` file in the `server` directory by copying `server/.env.example` (if provided) or by creating it manually.
    *   Update the `.env` file with your MongoDB connection string and a JWT secret:
        ```env
        NODE_ENV=development
        PORT=5001
        MONGO_URI=your_mongodb_connection_string # e.g., mongodb://localhost:27017/payroll-mern-db
        JWT_SECRET=your_strong_jwt_secret_key
        ```

3.  **Frontend Setup:**
    ```bash
    cd ../client
    npm install
    ```
    *   The frontend is configured to proxy API requests to the backend server (running on port 5001 by default) during development. This is set in `client/package.json`.

## Running the Application

1.  **Run the Backend Server:**
    *   Navigate to the `server` directory: `cd server`
    *   Start the server:
        ```bash
        npm run dev   # If you have a dev script using nodemon (recommended)
        # OR
        npm start # If your start script runs the server directly
        ```
    *   The backend API will typically be running on `http://localhost:5001`.

2.  **Run the Frontend Application:**
    *   Open a new terminal.
    *   Navigate to the `client` directory: `cd client`
    *   Start the React development server:
        ```bash
        npm start
        ```
    *   The React application will typically open in your browser at `http://localhost:3000`.

## Available Scripts

### Backend (`server/package.json`)

*   `npm start`: Starts the production server (you might need to define this, e.g., `node server.js`).
*   `npm run server` (or `npm run dev\`): Starts the development server, often with `nodemon` for auto-restarts (e.g., `nodemon server.js`).
*   `npm test`: Runs backend tests (setup required).

### Frontend (`client/package.json`)

*   `npm start`: Runs the app in development mode.
*   `npm run build`: Builds the app for production to the `build` folder.
*   `npm test`: Launches the test runner in interactive watch mode.
*   `npm run eject`: Ejects from Create React App (use with caution).

## API Endpoint Overview (Key Routes)

*   **Authentication (`/api/auth`):**
    *   `POST /company/register`: Register a new company and its admin.
    *   `POST /login`: Login for any user role.
    *   `GET /me`: Get current logged-in user's profile.
*   **Employees (`/api/employees`):**
    *   `POST /`: Create a new employee.
    *   `GET /`: Get list of employees (company-specific).
    *   `GET /:id`: Get a single employee.
    *   `PUT /:id`: Update an employee.
    *   `DELETE /:id`: Deactivate an employee.
*   **Departments (`/api/departments`):** CRUD for company departments.
*   **Income Grades (`/api/income-grades`):** CRUD for company income grades.
*   **Banks (`/api/banks`):** CRUD for banks (globally managed by admin).
*   **Payroll Operations (`/api/payroll-ops`):**
    *   `/advances`, `/damages`, `/reimbursements`: CRUD and status updates.
*   **Payrolls (`/api/payrolls`):**
    *   `POST /run`: Process payroll for a given month/year.
    *   `GET /`: List payroll records (payslips).
    *   `GET /:id`: Get a specific payslip.
    *   `PUT /:id/status`: Update payslip status (approve, paid).
    *   `POST /settings`: Update payroll settings (tax rates, NHIF rates).

---

This README provides a comprehensive overview for developers to get started with the MERN Payroll Management System.
