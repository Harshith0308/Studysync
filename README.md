# StudySync — Collaborative Learning Platform

A full-stack web application for student collaboration: study groups, real-time
chat, shared notes/file uploads, task management, an admin panel, and an
AI assistant (Gemini / OpenAI).

> The application lives in the [`studysync/`](studysync/) folder.

## Tech Stack
- **Frontend:** HTML, Tailwind CSS, Vanilla JS
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.io
- **Auth:** JWT, bcrypt
- **File Upload:** Multer
- **AI:** Gemini / OpenAI (configurable)

## Quick Start

### Prerequisites
- Node.js
- MongoDB running locally

### Backend
```bash
cd studysync/backend
npm install
cp .env.example .env   # then edit .env with your own values
npm run dev            # or: npm start
```

### Frontend
The frontend is static HTML/JS. Serve it with any static server:
```bash
cd studysync/frontend
python -m http.server 8000
```
Then open http://localhost:8000 (or use the VS Code "Live Server" extension).

See [`studysync/README.md`](studysync/README.md) for more detail.

## Configuration
All backend configuration is via environment variables. Copy
[`studysync/backend/.env.example`](studysync/backend/.env.example) to
`studysync/backend/.env` and fill in your own values. **Never commit the real
`.env` file** — it is already git-ignored.

## License
This project is licensed under the MIT License — see [LICENSE](LICENSE).
