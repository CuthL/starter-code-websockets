/**
 * ============================================
 * useSocket Hook - Socket.io Connection Manager
 * CSC 436 - WebSockets & Socket.io Lesson
 * ============================================
 * 
 * This hook handles:
 * - Creating the socket connection
 * - Tracking connection status
 * - Automatic cleanup on unmount
 * 
 * KEY CONCEPT: We create the socket once and reuse it!
 */

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Server URL - update this when deploying to production!
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection with options
    const newSocket = io(SERVER_URL, {
      // Automatically try to reconnect if connection drops
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ============================================
    // CONNECTION EVENT HANDLERS
    // ============================================
    
    newSocket.on('connect', () => {
      console.log('🔌 Connected to server:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      console.log('💡 Make sure the server is running on', SERVER_URL);
    });

    // Save socket to state
    setSocket(newSocket);

    // ============================================
    // CLEANUP: Disconnect when component unmounts
    // ============================================
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.close();
    };
  }, []); // Empty deps = run once on mount

  return { socket, isConnected };
}
