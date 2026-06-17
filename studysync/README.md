# StudySync - Collaborative Learning Platform

Full-stack web application for student collaboration.

## Tech Stack
- **Frontend:** HTML, Tailwind CSS, Vanilla JS
- **Backend:** Node.js, Express, MongoDB, Socket.io
- **Auth:** JWT, bcrypt
- **File Upload:** Multer

## Setup Instructions

### 1. Prerequisites
- Node.js installed
- MongoDB installed and running locally

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder (already created):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/studysync
JWT_SECRET=studysync_secret_key_change_this
```

Start the server:
```bash
npm start
# OR for development
npm run dev
```

### 3. Frontend Setup
The frontend is static HTML/JS. You can simply open the HTML files in your browser.
However, for better experience (and to avoid CORS issues if opening directly from file system), it is recommended to serve it using a live server.

If you have VS Code "Live Server" extension, right-click `frontend/index.html` and "Open with Live Server".

OR, you can use a simple python server:
```bash
cd frontend
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Features
- **Register/Login:** Create account (Student/Admin).
- **Dashboard:** View joined groups, create new groups, join via code.
- **Group:** Real-time chat, upload/download notes, manage tasks.
- **Admin:** View stats, manage users and groups (Role: admin).

## Default Admin
Register a new user and manually change their role to 'admin' in the database if needed, or use the registration form (it allows selecting role for demo purposes).
