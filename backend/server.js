const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Enable CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (or specify the URL of your frontend)
    methods: ["GET", "POST"],
  },
});

// File path for storing timer state
const dataFilePath = path.join(__dirname, "data.json");

// Default timer state (in case the file doesn't exist)
let mode = "Work"; // "Work" or "Break"
let timeLeft = 1500; // Initial time in seconds (e.g., 25 minutes for work)
let currState = "Stop"; // Initial time in seconds (e.g., 25 minutes for work)
const workDuration = 1500; // 25 minutes
const breakDuration = 300; // 5 minutes

// Function to load timer state from the file
function loadTimerState() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, "utf-8");
    const state = JSON.parse(data);
    mode = state.mode || "Work";
    timeLeft = state.timeLeft || workDuration;
  }
}

// Function to save timer state to the file
function saveTimerState() {
  const state = { mode, timeLeft };
  fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), "utf-8");
}

// Function to handle timer logic
function stopTimer() {
  currState = "Stop";
}
function startTimer() {
  setInterval(() => {
    if (timeLeft > 0 && currState == "Start") {
      timeLeft--;
    } else {
      // Switch modes
      if (mode === "Work") {
        mode = "Break";
        timeLeft = breakDuration;
      } else {
        mode = "Work";
        timeLeft = workDuration;
      }
    }

    // Broadcast timer updates to all connected clients
    io.emit("timer-update", { mode, timeLeft });

    // Save the timer state to the file
    saveTimerState();
  }, 1000); // Update every second
  currState = "Start";
}

// Serve static files (if needed)
app.use(express.static("public"));

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send initial state to the connected client
  socket.emit("timer-update", { mode, timeLeft });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Load the timer state from the file before starting the timer
loadTimerState();

// Start the timer
startTimer();

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
