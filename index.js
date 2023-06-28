const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(express.static('./app'));
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

// Store connected clients and their usernames
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // Handle login event
    if (data.event === 'login') {
      const { username } = data;

      // Store the WebSocket connection along with the username
      clients.set(ws, username);

      ws.send(JSON.stringify({ event: 'islogged', yes: true }));

      // Broadcast the updated chat list to all connected clients
      broadcastChatList();
    }

    // Handle logout event
    if (data.event === 'logout') {
      // Remove the WebSocket connection from the list
      clients.delete(ws);

      // Broadcast the updated chat list to all connected clients
      broadcastChatList();
    }

    // Handle message event
    if (data.event === 'message') {
      const { username, content } = data;

      // Broadcast the received message to all connected clients
      broadcastMessage(username, content);
    }
  });

  ws.on('close', () => {
    // Remove the WebSocket connection from the list
    clients.delete(ws);

    // Broadcast the updated chat list to all connected clients
    broadcastChatList();
  });
});

function broadcastChatList() {
  const chatList = Array.from(clients.values());
  const message = JSON.stringify({ event: 'chatList', chatList });

  // Broadcast the updated chat list to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastMessage(username, content) {
  const message = JSON.stringify({ event: 'message', username, content });

  // Broadcast the message to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(3000, () => {
  console.log('WebSocket server started on port 3000');
});
