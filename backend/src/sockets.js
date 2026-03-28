// backend/src/sockets.js
'use strict';
let _io = null;

function init(server) {
  const { Server } = require('socket.io');
  _io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN
        ? [
            process.env.FRONTEND_ORIGIN,
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'null',
          ]
        : '*',
      methods: ['GET', 'POST'],
    },
  });

  _io.on('connection', (socket) => {
    console.log(`[Socket] client connected:    ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket] client disconnected: ${socket.id}`);
    });
  });

  return _io;
}

function emitStockUpdate(updates) {
  // updates = [{ productId, newStock }, ...]
  if (_io) _io.emit('stockUpdate', updates);
}

function emitNewOrder(order) {
  if (_io) _io.emit('newOrder', order);
}

module.exports = { init, emitStockUpdate, emitNewOrder };
