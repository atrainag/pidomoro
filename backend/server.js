const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let data = { tasks: [], loops: 0 };

app.use(express.json());

// Load saved data
try {
  const savedData = fs.readFileSync('data.json', 'utf-8');
  data = JSON.parse(savedData);
} catch (err) {
  console.log('No saved data found.');
}

// Save data periodically
setInterval(() => {
  fs.writeFileSync('data.json', JSON.stringify(data));
}, 10000);

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('sync-data', data);

  socket.on('update-task', (taskData) => {
    data.tasks.push(taskData);
    io.emit('sync-data', data);
  });

  socket.on('increment-loop', () => {
    data.loops += 1;
    io.emit('sync-data', data);
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
