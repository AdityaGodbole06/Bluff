# 🃏 Bluff Card Game

A real-time multiplayer card game built with React, Node.js, Socket.IO, and MongoDB.

## 🎮 Play Now

**Live Game**: [https://bluff-mu.vercel.app](https://bluff-mu.vercel.app)

## ✨ Features

- Real-time multiplayer gameplay
- Room-based game sessions with unique codes
- Persistent game state with MongoDB Atlas
- Modern, responsive UI
- Real-time chat during gameplay
- 10-second timer when players have no cards
- Victory/Defeat screens with distinct styling

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Socket.IO Client
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (Frontend), Railway (Backend)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/AdityaGodbole06/Bluff.git
   cd bluff
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp config.env.example config.env
   # Edit config.env with your MongoDB Atlas connection string
   ```

4. **Start development servers**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend (in new terminal)
   cd frontend
   npm run dev
   ```

## 🎯 How to Play

1. **Create or join a room** - Enter your name and room code
2. **Wait for players** - Room creator starts the game
3. **Play cards** - Select cards and claim their rank
4. **Call bluff** - If you suspect someone is lying
5. **Win** - First player to get rid of all cards wins!

## 📡 API Endpoints

- `POST /create-room` - Create a new game room
- `POST /join-room` - Join an existing room
- `GET /room/:roomCode` - Get room information
- `GET /players/:roomCode` - Get players in a room

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License

---

**Happy gaming! 🃏**
