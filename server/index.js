/**
 * ============================================
 * SKRIBBL.IO CLONE - SERVER STARTER CODE
 * CSC 436 - WebSockets & Socket.io Lesson
 * ============================================
 * 
 * Welcome! This starter code sets up Express and Socket.io.
 * Follow along with the instructor to add real-time functionality!
 * 
 * SETUP INSTRUCTIONS:
 * 1. Run: npm install
 * 2. Run: npm run dev
 * 3. Server will start on http://localhost:3001
 */

import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';

const app = express();
const server = createServer(app);

// Get local network IP address for sharing with others
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Socket.io server with CORS configured for any origin (for local network play)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin for local network play
    methods: ["GET", "POST"]
  }
});

// ============================================
// IN-MEMORY STORAGE
// ============================================
// We store game rooms in a Map
// Key: roomId (string)
// Value: { players: Map, drawingHistory: [], currentDrawer: null }
const rooms = new Map();


// ============================================
// SOCKET.IO CONNECTION HANDLING
// ============================================

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // ----------------------------------------
  // TODO 1: Handle 'joinRoom' event
  // ----------------------------------------
  // When a client wants to join a room, they emit 'joinRoom' with:
  // { roomId: string, username: string }
  //
  // Your tasks:
  // 1. Use socket.join(roomId) to add them to the Socket.io room
  // 2. Store roomId and username on socket.data for later use
  // 3. Initialize the room in our Map if it doesn't exist
  // 4. Add the player to the room's players Map
  // 5. Notify OTHER players in the room with 'playerJoined' event
  // 6. Send current room state to the NEW player with 'roomState' event
  
  socket.on('joinRoom', ({ roomId, username }) => {
    // YOUR CODE HERE - Follow the steps above!
    
    // Step 1: Join the Socket.io room
    
    // Step 2: Store data on socket for later
    
    // Step 3: Initialize room if needed
    
    // Step 4: Add player to room
    
    // Step 5: Notify others (use socket.to(roomId).emit())
    
    // Step 6: Send state to new player (use socket.emit())
    
    console.log(`👤 ${username} joined room: ${roomId}`);
  });


  // ----------------------------------------
  // TODO 2: Handle 'draw' event
  // ----------------------------------------
  // When a client draws, they emit 'draw' with drawing data:
  // { x0, y0, x1, y1, color, lineWidth }
  //
  // Your tasks:
  // 1. Get the roomId from socket.data
  // 2. Save the drawing data to room.drawingHistory (for new joiners)
  // 3. Broadcast to all OTHER clients in the room
  //
  // IMPORTANT: Use socket.to(roomId).emit() NOT io.to(roomId).emit()
  // Why? The drawer already sees their own drawing!
  
  socket.on('draw', (data) => {
    // YOUR CODE HERE
    
  });


  // ----------------------------------------
  // TODO 3: Handle 'clearCanvas' event
  // ----------------------------------------
  // When someone clears the canvas:
  // 1. Clear room.drawingHistory array
  // 2. Broadcast 'clearCanvas' to all OTHER clients
  
  socket.on('clearCanvas', () => {
    // YOUR CODE HERE
    
  });


  // ----------------------------------------
  // DISCONNECT HANDLING (Already implemented!)
  // ----------------------------------------
  // This shows you the pattern for cleanup
  
  socket.on('disconnecting', () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      console.log(`👋 ${socket.data.username || 'Unknown'} left room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('playerLeft', socket.id);
      
      // Remove player from our room data
      const room = rooms.get(roomId);
      if (room) {
        room.players.delete(socket.id);
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted (empty)`);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});


// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           🎨 Skribbl Clone Server Started!               ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                          ║
║  📡 Socket.io ready for connections                      ║
╠══════════════════════════════════════════════════════════╣
║  🏠 Local:    http://localhost:${PORT}                      ║
║  🌐 Network:  http://${localIP}:${PORT}                      ║
╠══════════════════════════════════════════════════════════╣
║  🎮 Share the Network URL with others on your network!   ║
╚══════════════════════════════════════════════════════════╝
  `);
});
