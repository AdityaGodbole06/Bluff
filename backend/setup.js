const connectDB = require('./database');
const RoomService = require('./roomService');

async function setup() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Testing database operations...');
    
    // Test creating a room
    const testRoom = await RoomService.createRoom('TEST123', 'TestPlayer');
    console.log('✅ Room created:', testRoom.roomCode);
    
    // Test joining a room
    const joinedRoom = await RoomService.joinRoom('TEST123', 'TestPlayer2');
    console.log('✅ Player joined room:', joinedRoom.players);
    
    // Test getting a room
    const retrievedRoom = await RoomService.getRoom('TEST123');
    console.log('✅ Room retrieved:', retrievedRoom.roomCode);
    
    // Test updating game state
    const gameState = {
      players: [
        { name: 'TestPlayer', hand: ['Ace of Spades', 'King of Hearts'] },
        { name: 'TestPlayer2', hand: ['Queen of Diamonds', 'Jack of Clubs'] }
      ],
      centerStack: ['10 of Spades'],
      currentTurnPlayer: 'TestPlayer',
      centerCard: '10 of Spades'
    };
    
    await RoomService.updateGameState('TEST123', gameState);
    console.log('✅ Game state updated');
    
    // Test removing a player
    const updatedRoom = await RoomService.removePlayer('TEST123', 'TestPlayer2');
    console.log('✅ Player removed:', updatedRoom.players);
    
    // Clean up test room
    await RoomService.removePlayer('TEST123', 'TestPlayer');
    console.log('✅ Test room cleaned up');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('Your application is ready for deployment.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup(); 