const axios = require('axios');

const API_URL = 'http://localhost:4000';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test creating a public room
    console.log('1. Creating a public room...');
    const publicRoomResponse = await axios.post(`${API_URL}/create-room`, {
      playerName: 'TestPlayer1',
      isPrivate: false
    });
    console.log('Public room created:', publicRoomResponse.data);
    const publicRoomCode = publicRoomResponse.data.roomCode;

    // Test creating a private room
    console.log('\n2. Creating a private room...');
    const privateRoomResponse = await axios.post(`${API_URL}/create-room`, {
      playerName: 'TestPlayer2',
      isPrivate: true
    });
    console.log('Private room created:', privateRoomResponse.data);

    // Test getting public rooms
    console.log('\n3. Getting public rooms...');
    const publicRoomsResponse = await axios.get(`${API_URL}/public-rooms`);
    console.log('Public rooms:', publicRoomsResponse.data);

    // Test joining a room
    console.log('\n4. Joining the public room...');
    const joinResponse = await axios.post(`${API_URL}/join-room`, {
      playerName: 'TestPlayer3',
      roomCode: publicRoomCode
    });
    console.log('Join response:', joinResponse.data);

    // Test getting room info
    console.log('\n5. Getting room info...');
    const roomInfoResponse = await axios.get(`${API_URL}/room/${publicRoomCode}`);
    console.log('Room info:', roomInfoResponse.data);

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();
