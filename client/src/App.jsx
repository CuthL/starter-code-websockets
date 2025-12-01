/**
 * ============================================
 * SKRIBBL.IO CLONE - MAIN APP COMPONENT
 * CSC 436 - WebSockets & Socket.io Lesson
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { DrawingCanvas } from './components/DrawingCanvas';

function App() {
  const { socket, isConnected } = useSocket();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [players, setPlayers] = useState([]);

  // Set up socket listeners when socket is ready (BEFORE joining)
  // This ensures we don't miss any events from the server
  useEffect(() => {
    if (!socket) return;

    // Listen for room state updates
    const handleRoomState = ({ players: roomPlayers }) => {
      console.log('roomState received:', roomPlayers);
      setPlayers(roomPlayers.map(([id, data]) => ({
        id,
        username: data.username,
        score: data.score || 0
      })));
    };

    // Listen for new players joining
    const handlePlayerJoined = ({ id, username: playerUsername }) => {
      console.log('playerJoined:', playerUsername);
      setPlayers(prev => {
        // Avoid duplicates
        if (prev.some(p => p.id === id)) return prev;
        return [...prev, { id, username: playerUsername, score: 0 }];
      });
    };

    // Listen for players leaving
    const handlePlayerLeft = (id) => {
      setPlayers(prev => prev.filter(p => p.id !== id));
    };

    socket.on('roomState', handleRoomState);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);

    // Cleanup listeners when component unmounts
    return () => {
      socket.off('roomState', handleRoomState);
      socket.off('playerJoined', handlePlayerJoined);
      socket.off('playerLeft', handlePlayerLeft);
    };
  }, [socket]);

  // Handle joining a room
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!socket || !username.trim() || !roomId.trim()) return;

    // Emit joinRoom event to server
    console.log('Emitting joinRoom:', { roomId: roomId.trim(), username: username.trim() });
    socket.emit('joinRoom', {
      roomId: roomId.trim(),
      username: username.trim()
    });
    setHasJoined(true);
  };

  // ============================================
  // RENDER: Loading State
  // ============================================
  if (!isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🎨 Skribbl Clone</h1>
          <p style={styles.status}>Connecting to server...</p>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Join Room Form
  // ============================================
  if (!hasJoined) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🎨 Skribbl Clone</h1>
          <p style={styles.subtitle}>Real-time multiplayer drawing game</p>
          
          <form onSubmit={handleJoinRoom} style={styles.form}>
            <input
              type="text"
              placeholder="Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              maxLength={20}
            />
            <input
              type="text"
              placeholder="Room Code (e.g., game123)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={styles.input}
              maxLength={10}
            />
            <button type="submit" style={styles.button}>
              Join Game 🎮
            </button>
          </form>

          <p style={styles.hint}>
            💡 Share the room code with friends to play together!
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Game View
  // ============================================
  return (
    <div style={styles.gameContainer}>
      {/* Left Sidebar: Player List */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Players</h3>
        {players.map(player => (
          <div key={player.id} style={styles.playerCard}>
            <span>{player.username}</span>
            <span style={styles.score}>{player.score} pts</span>
          </div>
        ))}
        {players.length === 0 && (
          <p style={styles.noPlayers}>Waiting for players...</p>
        )}
        <div style={styles.roomInfo}>
          Room: <strong>{roomId}</strong>
        </div>
      </div>

      {/* Center: Canvas Area */}
      <div style={styles.canvasArea}>
        <DrawingCanvas socket={socket} canDraw={true} />
      </div>

      {/* Right Sidebar: Chat (Day 2) */}
      <div style={styles.chatArea}>
        <h3 style={styles.sidebarTitle}>Chat</h3>
        <div style={styles.chatMessages}>
          <p style={styles.systemMessage}>
            🚧 Game chat coming on Day 2!
          </p>
          <p style={styles.systemMessage}>
            For now, just draw and have fun!
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '8px',
    color: '#333'
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px'
  },
  status: {
    color: '#666',
    marginBottom: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '14px 24px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px'
  },
  hint: {
    marginTop: '20px',
    color: '#888',
    fontSize: '14px'
  },
  gameContainer: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    minHeight: '100vh'
  },
  sidebar: {
    width: '200px',
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    height: 'fit-content'
  },
  sidebarTitle: {
    marginBottom: '16px',
    color: '#333',
    borderBottom: '2px solid #667eea',
    paddingBottom: '8px'
  },
  playerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#f5f5f5',
    borderRadius: '6px',
    marginBottom: '8px'
  },
  score: {
    color: '#667eea',
    fontWeight: 'bold'
  },
  noPlayers: {
    color: '#999',
    fontStyle: 'italic',
    fontSize: '14px'
  },
  roomInfo: {
    marginTop: '20px',
    padding: '12px',
    background: '#f0f0f0',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center'
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  chatArea: {
    width: '250px',
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    height: 'fit-content'
  },
  chatMessages: {
    minHeight: '200px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '12px'
  },
  systemMessage: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: '10px',
    fontSize: '14px'
  }
};

export default App;
