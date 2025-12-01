/**
 * ============================================
 * DrawingCanvas Component - STARTER CODE
 * CSC 436 - WebSockets & Socket.io Lesson
 * ============================================
 * 
 * This component handles:
 * - Canvas setup with high-DPI support
 * - Mouse event handling for drawing
 * - Real-time sync via Socket.io (TODO!)
 * 
 * KEY CONCEPT: We use useRef instead of useState for drawing state.
 * Why? useState causes re-renders, which would make drawing laggy!
 */

import { useRef, useEffect, useCallback, useState } from 'react';

export function DrawingCanvas({ socket, canDraw, width = 800, height = 600 }) {
  // ============================================
  // REFS - Direct access without re-renders
  // ============================================
  const canvasRef = useRef(null);      // Reference to <canvas> element
  const ctxRef = useRef(null);         // Reference to 2D drawing context
  const isDrawingRef = useRef(false);  // Are we currently drawing?
  const lastPosRef = useRef(null);     // Last mouse position

  // ============================================
  // STATE - These CAN be state (don't change during drawing)
  // ============================================
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);

  // ============================================
  // CANVAS INITIALIZATION
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High-DPI support for crisp lines on retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Get 2D drawing context
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Scale for high-DPI and set initial canvas state
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = 'round';    // Smooth line endings
    ctx.lineJoin = 'round';   // Smooth line corners

    // Save context reference for later use
    ctxRef.current = ctx;
  }, [width, height]);

  // ============================================
  // DRAWING FUNCTION
  // ============================================
  /**
   * Draw a line segment on the canvas.
   * Called for BOTH local drawing AND remote drawing from other clients.
   */
  const drawLine = useCallback((data) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);    // Start point
    ctx.lineTo(data.x1, data.y1);    // End point
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.lineWidth;
    ctx.stroke();
  }, []);

  // ============================================
  // HELPER: Convert mouse event to canvas coordinates
  // ============================================
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // getBoundingClientRect gives us the canvas position on the page
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // ============================================
  // HELPER: Clear the canvas
  // ============================================
  const clearCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  // ============================================
  // MOUSE EVENT HANDLERS
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse DOWN - Start drawing
    const onMouseDown = (e) => {
      if (!canDraw) return;
      isDrawingRef.current = true;
      lastPosRef.current = getCanvasPos(e);
    };

    // Mouse MOVE - Draw if mouse is down
    const onMouseMove = (e) => {
      if (!isDrawingRef.current || !canDraw) return;

      const newPos = getCanvasPos(e);
      if (!lastPosRef.current || !newPos) return;

      // Create draw data object
      const drawData = {
        x0: lastPosRef.current.x,
        y0: lastPosRef.current.y,
        x1: newPos.x,
        y1: newPos.y,
        color,
        lineWidth
      };

      // Draw locally (immediate feedback)
      drawLine(drawData);

      // ============================================
      // TODO: Send drawing data to server!
      // ============================================
      // Use socket.emit('draw', drawData) to broadcast
      // to other clients in the room
      
      if (socket) {
        // YOUR CODE HERE: emit 'draw' event
        socket.emit('draw', drawData);
      }

      // Update last position for next segment
      lastPosRef.current = newPos;
    };

    // Mouse UP or LEAVE - Stop drawing
    const onMouseUp = () => {
      isDrawingRef.current = false;
      lastPosRef.current = null;
    };

    // Attach event listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);

    // Cleanup on unmount
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
    };
  }, [canDraw, color, lineWidth, socket, drawLine, getCanvasPos]);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================
  useEffect(() => {
    if (!socket) return;

    // Listen for drawing data from OTHER clients
    socket.on('draw', drawLine);

    // Listen for clear canvas events
    socket.on('clearCanvas', clearCanvas);

    // When joining a room, replay the drawing history
    socket.on('roomState', ({ drawingHistory }) => {
      if (drawingHistory) {
        drawingHistory.forEach(data => drawLine(data));
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('draw');
      socket.off('clearCanvas');
      socket.off('roomState');
    };
  }, [socket, drawLine, clearCanvas]);

  // ============================================
  // HANDLE CLEAR BUTTON
  // ============================================
  const handleClear = () => {
    clearCanvas();
    
    // TODO: Emit clearCanvas event to server
    if (socket) {
      socket.emit('clearCanvas');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center',
        padding: '12px 20px',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        {/* Color Picker */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Color:</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: '40px', height: '30px', cursor: 'pointer' }}
          />
        </label>

        {/* Brush Size */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ 
            width: `${lineWidth}px`, 
            height: `${lineWidth}px`, 
            background: color,
            borderRadius: '50%',
            display: 'inline-block'
          }}></span>
        </label>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          style={{
            padding: '8px 16px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Clear 🗑️
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          border: '3px solid #333',
          borderRadius: '8px',
          cursor: canDraw ? 'crosshair' : 'not-allowed',
          touchAction: 'none'  // Prevents touch scrolling
        }}
      />

      {/* Help Text */}
      {!canDraw && (
        <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
          ⏳ Wait for your turn to draw!
        </p>
      )}
    </div>
  );
}
