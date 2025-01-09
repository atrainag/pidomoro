const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const { time } = require("console");
const cors = require("cors");
const corsOptions = {
  origin: ["*", "http://localhost:8080", "http://192.168.1.191:8080"], // Add all allowed origins
  credentials: true, // Allow cookies or authentication headers
  optionsSuccessStatus: 200,
};

const app = express();
const server = http.createServer(app);

// Enable CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["*", "http://localhost:8080", "http://192.168.1.191:8080"], // Allow all origins (or specify the URL of your frontend)
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors(corsOptions));
// Serve static files (if needed)
app.use(express.static("public"));

/*========================== PiDomoro ==========================*/
// File path for storing timer state
const dataFilePath = path.join(__dirname, "data.json");

let mode = "Work"; // "Work" or "Break"
let timeLeft = 1500; // Initial time in seconds (e.g., 25 minutes for work)
let currState = "Stop"; // Initial time in seconds (e.g., 25 minutes for work)
let intervalId = null;
let workDuration = 1500; // 25 minutes
let breakDuration = 300; // 5 minutes

function setupDataFromZero() {
  // Default timer state (in case the file doesn't exist)
  let mode = "Work"; // "Work" or "Break"
  let timeLeft = 1500; // Initial time in seconds (e.g., 25 minutes for work)
  let currState = "Stop"; // Initial time in seconds (e.g., 25 minutes for work)
  let intervalId = null;
  let workDuration = 1500; // 25 minutes
  let breakDuration = 300; // 5 minutes
}

// Function to load timer state from the file
function loadTimerState() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, "utf-8");
    const state = JSON.parse(data);
    mode = state.mode;
    timeLeft = state.timeLeft;
    currState = state.currState;
    intervalId = state.intervalId;
    workDuration = state.workDuration;
    breakDuration = state.breakDuration;
  }
}

// Function to save timer state to the file
function saveTimerState() {
  const state = { mode, timeLeft };
  fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), "utf-8");
}

// Function to handle timer logic
function stopTimer() {
  clearInterval(intervalId);
  currState = "Stop";
  io.emit("timer-update", { mode, timeLeft });
}
function startTimer() {
  if (intervalId) clearInterval(intervalId);
  currState = "Start";
  intervalId = setInterval(() => {
    if (timeLeft > 0 && currState === "Start") {
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

      gameState.pidomoroState = mode;
    }
    // Broadcast timer updates to all connected clients
    io.emit("timer-update", { mode, timeLeft });
    // Save the timer state to the file
    saveTimerState();
  }, 1000); // Update every second
  currState = "Start";
}

/*========================== Pong ==========================*/

// Game State
let gameState = {
  paddles: { left: 50, right: 50 }, // Paddle positions as percentages of canvas height
  ball: { x: 50, y: 50, dx: 0.5, dy: 0.5 }, // Ball position and direction
  score: { left: 0, right: 0 },
  pidomoroState: currState,
};

let roles = {
  host: null,
  controllers: [],
};
let readyStatus = { left: false, right: false };

setInterval(() => {
  updateGameState();
  if (roles.host) io.to(roles.host).emit("updateGameState", gameState);
}, 16); // Approx. 60fps

function updateGameState() {
  // Pause game updates when the PiDomoro is in "Work" mode
  if (mode === "Work") {
    return;
  }

  // Update ball position
  gameState.ball.x += gameState.ball.dx;
  gameState.ball.y += gameState.ball.dy;

  // Ball collision with top and bottom walls
  if (gameState.ball.y <= 0 || gameState.ball.y >= 100) {
    gameState.ball.dy *= -1; // Reverse vertical direction
  }

  // Ball collision with paddles
  const paddleWidth = 5; // Approximate paddle width in canvas percentage
  const paddleHeight = 20; // Approximate paddle height in canvas percentage
  if (
    gameState.ball.x <= paddleWidth &&
    gameState.ball.y >= gameState.paddles.left &&
    gameState.ball.y <= gameState.paddles.left + paddleHeight
  ) {
    gameState.ball.dx *= -1; // Reverse horizontal direction
  }
  if (
    gameState.ball.x >= 100 - paddleWidth &&
    gameState.ball.y >= gameState.paddles.right &&
    gameState.ball.y <= gameState.paddles.right + paddleHeight
  ) {
    gameState.ball.dx *= -1; // Reverse horizontal direction
  }

  // Ball misses a paddle
  if (gameState.ball.x < 0) {
    gameState.score.right += 1;
    resetBall();
  }
  if (gameState.ball.x > 100) {
    gameState.score.left += 1;
    resetBall();
  }
}

function resetBall() {
  gameState.ball = {
    x: 50,
    y: 50,
    dx: Math.random() > 0.5 ? 0.5 : -0.5,
    dy: 0.5,
  };
}

function resetScore() {
  gameState.score = { left: 0, right: 0 };
}

/*========================== io-Handler ==========================*/

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  /*============ PiDomoro ============*/
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("update-timer", (data) => {
    timeLeft = data.timeLeft;
  });

  socket.on("stop-timer", () => {
    console.log("Stopping timer");
    stopTimer();
  });

  socket.on("update-durations", (data) => {
    workDuration = data.workDuration;
    breakDuration = data.breakDuration;

    timeLeft = data.timeLeft;
    socket.emit("timer-update", { mode, timeLeft });
  });

  socket.on("start-timer", (data) => {
    console.log("Starting timer with data:", data);
    timeLeft = data.timeLeft;
    startTimer();
  });

  // Send initial state to the connected client
  socket.emit("timer-update", { mode, timeLeft });

  /*============ Pong ============*/

  // Handle role selection
  socket.on("selectRole", (role) => {
    if (role === "host" && !roles.host) {
      roles.host = socket.id;
      socket.emit("roleAssigned", "host");
    } else if (role === "controller" && roles.controllers.length < 2) {
      const side = roles.controllers.length === 0 ? "left" : "right";
      roles.controllers.push({ id: socket.id, side });
      socket.emit("roleAssigned", `controller:${side}`);
    } else {
      socket.emit("roleDenied", "Role unavailable");
    }
  });

  // Handle ready status
  socket.on("ready", (side) => {
    readyStatus[side] = true;

    // Check if both controllers are ready
    if (readyStatus.left && readyStatus.right) {
      io.emit("gameStart");
    }
  });

  // Handle paddle movement
  socket.on("controllerInput", (data) => {
    const paddleSpeed = 5; // Percentage of canvas height
    if (data.side === "left") {
      gameState.paddles.left = Math.max(
        0,
        Math.min(100, gameState.paddles.left + data.movement * paddleSpeed),
      );
    }
    if (data.side === "right") {
      gameState.paddles.right = Math.max(
        0,
        Math.min(100, gameState.paddles.right + data.movement * paddleSpeed),
      );
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    if (roles.host === socket.id) roles.host = null;
    roles.controllers = roles.controllers.filter((c) => c.id !== socket.id);
  });

  socket.on("resetGame", () => {
    resetScore();
    resetBall();
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
