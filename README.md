# Camera to Telegram Demo

A simple web application that captures a photo from the user's camera and sends it to a Telegram bot.

## Project Structure
- `backend/`: Node.js Express server.
- `frontend/`: HTML/CSS/JS client.

## Setup & Run

### 1. Backend
The backend handles the Telegram API communication.
```bash
cd backend
npm install
npm start
```
*Server runs on `http://localhost:3000`*

### 2. Frontend
Open `frontend/index.html` in your browser.
- Enter your Telegram Chat ID.
- Click "Take Photo".

## Notes
- Ensure port 3000 is free.
- The Telegram Bot Token is hardcoded for this demo.
