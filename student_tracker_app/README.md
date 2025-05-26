# Student Attendance & Performance Tracker

## Overview

The Student Attendance & Performance Tracker is a full-stack web application designed to help educational institutions or individual instructors manage students, subjects, teachers, enrollments, attendance records, assignments, and grades. It provides a user-friendly interface for CRUD operations on these entities and offers basic reporting functionalities. The entire application is containerized using Docker and orchestrated with Docker Compose for ease of setup and deployment.

## Features Implemented

*   **Student Management:** Add, view, edit, and delete student records.
*   **Subject Management:** Add, view, edit, and delete subjects.
*   **Teacher Management:** Add, view, edit, and delete teacher records.
*   **Enrollment Management:** Enroll students in subjects with assigned teachers, and manage these enrollments.
*   **Attendance Tracking:** Record and view attendance for students in enrolled subjects.
*   **Assignment & Grade Tracking:** Create assignments for subjects and record grades for students.
*   **Reporting:**
    *   View average grade for a subject.
    *   View overall average grade for a student.
    *   Generate a list of students with low attendance for a subject based on a configurable threshold.
*   **Dockerized:** Fully containerized backend, frontend, and database services for consistent environments and easy deployment.

## Technologies Used

*   **Backend:** Python, Flask, SQLAlchemy, Gunicorn
*   **Frontend:** HTML, CSS, JavaScript, Bootstrap
*   **Database:** MySQL 8.0
*   **Containerization:** Docker, Docker Compose
*   **Web Server (for frontend & proxy):** Nginx

## Prerequisites

*   Docker Desktop (or Docker Engine + Docker Compose) installed on your system.

## Project Structure

```
student_tracker_app/
├── backend/            # Flask backend application, Dockerfile
│   ├── app.py          # Main Flask application file
│   ├── models.py       # SQLAlchemy database models
│   └── requirements.txt # Python dependencies
├── database/
│   └── init.sql        # MySQL schema initialization script
├── frontend/           # HTML, CSS, JavaScript static files
│   ├── css/
│   │   └── style.css
│   ├── js/             # JavaScript files for each management page
│   └── *.html          # HTML files for different sections
├── nginx/
│   └── nginx.conf      # Nginx configuration for frontend and API proxy
├── docker-compose.yml  # Docker Compose configuration
└── README.md           # This file
```

## Setup and Running the Application

1.  **Clone the Repository:**
    (You would have already cloned this repository to view this README.)
    If you haven't, use a command like:
    ```bash
    git clone <your-repository-url>
    cd student_tracker_app
    ```

2.  **Configure Environment Variables:**
    Critical environment variables are set in the `docker-compose.yml` file. The most important one to check and potentially change is the MySQL root password.

    *   **`MYSQL_ROOT_PASSWORD`**:
        *   Located in `docker-compose.yml` under both the `db` service's `environment` section and the `backend` service's `environment` section.
        *   The current placeholder is `changeme_mysql_password`.
        *   **It is strongly recommended to change `changeme_mysql_password` to a strong, unique password in BOTH places within the `docker-compose.yml` file before running the application for the first time, especially if your Docker host is accessible externally.**

3.  **Build and Run with Docker Compose:**
    Navigate to the project root directory (`student_tracker_app/`) where the `docker-compose.yml` file is located, and run:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Forces Docker Compose to build the images (e.g., for the backend service) before starting the containers.
    *   `-d`: Runs the containers in detached mode (in the background).

4.  **Accessing the Application:**
    Once the containers are up and running:
    *   **Frontend Application:** Open your web browser and navigate to `http://localhost:8080`
    *   **Backend API (Directly, for testing/development if needed):** The backend Flask API is running on port 5000 within the Docker network. Nginx proxies requests from `http://localhost:8080/api/` to this service. Direct access to the backend (e.g., `http://localhost:5000/api/...`) would also work if the port is mapped in `docker-compose.yml` for the backend service (which it is, for development convenience).

5.  **Database Initialization:**
    The `init.sql` script located in the `./database` directory is automatically executed when the `db` (MySQL) container starts for the first time. This script creates the `student_tracker` database and defines the schema for all necessary tables.

## Stopping the Application

To stop the application and all its services:
```bash
docker-compose down
```
This command stops and removes the containers defined in `docker-compose.yml`.

If you also want to remove the data volume associated with the MySQL database (which will delete all stored data), use:
```bash
docker-compose down -v
```
**Caution:** Using `-v` will delete all your student, subject, attendance, and grade data. Use this with care.

## Data Persistence

MySQL data (students, subjects, grades, etc.) is persisted in a Docker named volume called `mysql_data`. This volume is defined in the `docker-compose.yml` file.

*   Data will remain intact even if you stop and remove the containers using `docker-compose down`.
*   To delete the data, you must explicitly remove the volume. This can be done with `docker-compose down -v` or by manually removing the Docker volume (e.g., `docker volume rm student_tracker_app_mysql_data`).
