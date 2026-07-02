<h1 align="center">StudySync — Collaborative Learning Platform</h1>

<p align="center">
  A full-stack web app where students form study groups, chat in real time,
  share notes &amp; files, track tasks, and get help from a built-in AI study assistant.
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white">
  <img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-realtime-010101?logo=socket.io&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-frontend-38B2AC?logo=tailwindcss&logoColor=white">
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg">
</p>

> The application lives in the [`studysync/`](studysync/) folder.

---

## Overview

StudySync turns scattered group study into one organized space. A student signs up,
creates a **study group** (or joins one with a 6-character invite code), and instantly
gets a shared room with **live chat, a shared file library, a task checklist, and an
AI assistant** that knows the group's context. Admins get a dedicated panel to manage
all users and groups on the platform.

It's built as a classic three-tier app: a **vanilla HTML/JS + Tailwind** frontend,
a **Node.js / Express REST API** with **Socket.io** for real-time messaging, and
**MongoDB** for storage — with **JWT** auth and role-based access (student / admin).

---

## Screenshots

### Register &amp; Login
Create an account as a student or admin, then sign in. Auth is handled with JWT + bcrypt.

| Register | Login |
| :---: | :---: |
| ![Register screen](studysync/docs/images/register.png) | ![Login screen](studysync/docs/images/login.png) |

### Dashboard — your study groups
See every group you've joined as a card, create a new group, or join one with an invite code.

![Dashboard](studysync/docs/images/dashboard.png)

### Group Room — real-time chat
Each group has a live chat (Socket.io), a member list, and a shared task checklist in the sidebar.

![Group chat](studysync/docs/images/group_chat.png)

### AI Study Assistant
Ask for explanations, summaries, and study tips — the assistant answers in the context of the group.

![AI assistant](studysync/docs/images/group_ai.png)

### Admin Panel
Admins see platform-wide stats and can manage all users and groups.

![Admin panel](studysync/docs/images/admin.png)

---

## Architecture

```mermaid
flowchart LR
    subgraph Client["Browser (static frontend)"]
        UI["HTML + Tailwind + Vanilla JS"]
    end
    subgraph Server["Node.js backend"]
        API["Express REST API"]
        WS["Socket.io (real-time chat)"]
        AUTH["JWT auth + bcrypt"]
        UP["Multer file uploads"]
        AI["AI assistant (Gemini / OpenAI)"]
    end
    DB[("MongoDB (Mongoose)")]

    UI -- "REST (fetch)" --> API
    UI <-- "WebSocket" --> WS
    API --> AUTH
    API --> UP
    API --> AI
    API --> DB
    WS --> DB
```

---

## Features

- **Authentication** — register/login with JWT, bcrypt-hashed passwords, role-based access (student / admin).
- **Study Groups** — create groups, join via a 6-character invite code, approve/reject join requests.
- **Real-time Chat** — instant group messaging powered by Socket.io.
- **Notes &amp; Files** — upload and download shared documents (PDF/DOC) per group via Multer.
- **Tasks** — lightweight per-group to-do list with deadlines and completion tracking.
- **AI Assistant** — ask questions and get study help (Gemini / OpenAI, configurable).
- **Admin Panel** — view total users/groups and manage (delete) any user or group.
- **Light &amp; Dark theme** — built-in theme toggle.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | HTML, Tailwind CSS, Vanilla JavaScript |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT, bcrypt |
| **File Upload** | Multer |
| **AI** | Gemini / OpenAI (configurable) |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally

### 1. Backend
```bash
cd studysync/backend
npm install
cp .env.example .env   # then edit .env with your own values
npm run dev            # or: npm start
```

### 2. Frontend
The frontend is static HTML/JS. Serve it with any static server:
```bash
cd studysync/frontend
python -m http.server 8000
```
Then open <http://localhost:8000> (or use the VS Code **Live Server** extension).

See [`studysync/README.md`](studysync/README.md) for more detail.

---

## Configuration

All backend configuration is via environment variables. Copy
[`studysync/backend/.env.example`](studysync/backend/.env.example) to
`studysync/backend/.env` and fill in your own values. **Never commit the real
`.env` file** — it is already git-ignored.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE).
