# PeoCleaner Application

## Project Description

PeoCleaner is a web application designed to facilitate cleaning service bookings. It consists of a user-facing frontend where customers can book services, manage their profiles, and view their booking status, and an administrative backend to manage all bookings and service availability.

The backend is built with Node.js, Express, and uses an SQLite database for data persistence. The frontend is a modern Single Page Application (SPA) developed using React, Vite, and styled with Tailwind CSS.

![PeoCleaner Project Structure](image_c4fdbd.png)

*(Insert the image you provided here. Make sure the image file `image_c4fdbd.png` is also in the root of your GitHub repository)*

## Features

### User Application

* Browse available cleaning services and their prices.
* Select multiple cleaning services for a single booking.
* Book services by selecting from available date and time slots fetched from the backend.
* Create and manage a user profile including name, address (structured: Number, Street, City), mobile number, and email.
* Option to use profile address/name or enter different details for a specific booking.
* View a dashboard of upcoming and completed bookings.
* See the status of each booking (Pending, Confirmed, On the Way, Completed, Cancelled).
* Edit or cancel existing bookings (status will change to Cancelled).
* Dynamic price calculation based on selected services.


## Technologies Used

**Backend:**

* Node.js
* Express.js
* SQLite (via `sqlite` and `sqlite3` libraries)
* dotenv
* express-async-handler
* nodemon (for development)

**Frontend:**

* React
* Vite
* Tailwind CSS
* lucide-react (for icons)

## Setup

To get the application running locally, follow these steps:

### Prerequisites

* Node.js and npm installed on your machine. You can download them from [https://nodejs.org/](https://nodejs.org/). It's recommended to use an LTS version.
* A terminal (Command Prompt, PowerShell, Git Bash, WSL, etc.).

### 1. Backend Setup

1.  Navigate into the backend directory:
    ```bash
    cd cleaning-service-backend
    ```
2.  Install backend dependencies:
    ```bash
    npm install
    ```
3.  Initialize the SQLite database and seed it with initial data (services, mock user, mock profile, mock initial bookings):
    ```bash
    npm run init-db
    ```
    *(This will create the `data` directory and the `database.sqlite` file inside it if they don't exist)*.
4.  Set up environment variables:
    ```bash
    cp .env.example .env
    ```
    *(You can edit the `.env` file if needed, but the default settings should work).*
5.  Start the backend server (for development):
    ```bash
    npm run dev
    ```
    *(The server should start on `http://localhost:3000` by default. Keep this terminal window open).*

### 2. Frontend Setup

1.  Open a **new** terminal window or tab.
2.  Navigate into the frontend directory from the project root:
    ```bash
    cd cleaning-service-user-frontend
    ```
3.  Install frontend dependencies:
    ```bash
    npm install
    ```
4.  Ensure Tailwind CSS is correctly set up (Vite handles most of this, but verify):
    * Check `tailwind.config.js`: The `content` array should include paths to your source files (e.g., `./src/**/*.{js,jsx,ts,tsx}`).
    * Check your main CSS file (e.g., `src/index.css`): It should include the Tailwind directives at the top:
        ```css
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        ```
    * Check your main entry file (e.g., `src/main.jsx`): It should import the main CSS file:
        ```javascript
        import './index.css';
        ```
5.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    *(Vite will usually start this on `http://localhost:5173` by default, or another available port).*

## How to Check

1.  **Verify Backend:** Check the terminal where you ran `npm run dev` for the backend. You should see messages indicating the server is running (e.g., "Server is running on http://localhost:3000", "SQLite database connected").
2.  **Verify Frontend:** Open your web browser and navigate to the address where the frontend development server is running (e.g., `http://localhost:5173`).
3.  **Check Connection:** If the frontend loads and displays services, your profile (using mock user ID 1), and existing bookings (if any were seeded and not cancelled), it means the frontend is successfully communicating with the backend API. Try booking a new service or updating your profile to see data persist across page reloads (as it's stored in the SQLite database).
