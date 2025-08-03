# Bluff Card Game

A real-time multiplayer card game built with React, Node.js, Socket.IO, and MongoDB.

## Features

- Real-time multiplayer gameplay
- Room-based game sessions
- Persistent game state with MongoDB
- Modern, responsive UI
- Cross-platform compatibility

## Tech Stack

### Frontend
- React 18
- Vite
- Socket.IO Client
- CSS3 with modern styling

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB with Mongoose
- CORS enabled

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bluff
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the config file
   cp config.env.example config.env
   
   # Edit config.env with your MongoDB connection string
   MONGODB_URI=mongodb://localhost:27017/bluff-game
   PORT=4000
   NODE_ENV=development
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the development servers**

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

## Database Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/bluff-game`

### MongoDB Atlas (Recommended for deployment)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `config.env` with your connection string

### Test Database Connection
```bash
cd backend
node setup.js
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Options

1. **Backend**: Deploy to Heroku, Railway, or Render
2. **Frontend**: Deploy to Vercel, Netlify, or GitHub Pages
3. **Database**: Use MongoDB Atlas (free tier available)

## Game Rules

Bluff is a card game where players try to get rid of all their cards by playing them face-down and claiming they are of a specific rank. Other players can call "bluff" if they suspect the claim is false.

### How to Play
1. Create or join a room
2. Wait for the leader to start the game
3. Play cards by selecting them and clicking "Place Cards"
4. Call bluff if you suspect another player is lying
5. The first player to get rid of all cards wins!

## API Endpoints

- `POST /create-room` - Create a new game room
- `POST /join-room` - Join an existing room
- `GET /room/:roomCode` - Get room information

## Socket.IO Events

### Client to Server
- `join-room` - Join a game room
- `start-game` - Start the game
- `place-card` - Place cards on the table
- `bluff-call` - Call another player's bluff
- `leave-room` - Leave the room

### Server to Client
- `player-joined` - New player joined
- `player-left` - Player left the room
- `game-started` - Game has started
- `update-game` - Game state update
- `bluff-called` - Bluff was called

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for troubleshooting
2. Verify your MongoDB connection
3. Check the browser console and server logs
4. Open an issue on GitHub
