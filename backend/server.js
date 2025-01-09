const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const { time } = require("console");
const cors = require("cors");
const corsOptions = {
  origin: ["*"], // Add all allowed origins
  credentials: true, // Allow cookies or authentication headers
  optionsSuccessStatus: 200,
};

const app = express();
const server = http.createServer(app);

// Enable CORS for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
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

let mode, timeLeft, currState, intervalId, workDuration, breakDuration;

function initializeTimer() {
  // Default timer state (in case the file doesn't exist)
  mode = "Work"; // "Work" or "Break"
  timeLeft = 1500; // Initial time in seconds (e.g., 25 minutes for work)
  currState = "Stop"; // Initial time in seconds (e.g., 25 minutes for work)
  workDuration = 1500; // 25 minutes
  breakDuration = 300; // 5 minutes
}

// Function to load timer state from the file
function loadTimerState() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, "utf-8");
    const state = JSON.parse(data);
    mode = state.mode || "Work";
    timeLeft = state.timeLeft || workDuration;
    currState = state.currState || "NULL";
    workDuration = state.workDuration || 1500;
    breakDuration = state.breakDuration || 300;
  }
}

// Function to save timer state to the file
function saveTimerState() {
  const state = {
    mode,
    timeLeft,
    currState,
    workDuration,
    breakDuration,
  };
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
let gameState, paddles;

const DATA_FILE = path.join(__dirname, "data2.json");
const DATA_FILE2 = path.join(__dirname, "paddle.json");

// Load game state from the JSON file
function loadGameState() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      gameState = JSON.parse(data);
      // console.log("Game state loaded successfully.");
    } catch (err) {
      console.error("Error loading game state:", err);
    }
  } else {
    initializeDefaultGameState();
  }
  if (fs.existsSync(DATA_FILE2)) {
    try {
      const data = fs.readFileSync(DATA_FILE2, "utf-8");
      paddles = JSON.parse(data);
      gameState = { ...gameState, paddles: { ...paddles } };
      console.log("paddles loaded successfully.");
    } catch (err) {
      console.error("Error loading game state:", err);
    }
  } else {
    initializeDefaultGameState();
  }
}

function initializeDefaultGameState() {
  gameState = {
    ball: { x: 50, y: 50, dx: 0.5, dy: 0.5 },
    score: { left: 0, right: 0 },
    pidomoroState: "idle", // Default state for pidomoro
    paddles: { left: 50, right: 50 },
  };
  saveGameState(); // Save default state to the file
}

// Save game state to the JSON file
function saveGameState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(gameState, null, 2));
    // console.log("Game state saved successfully.");
  } catch (err) {
    console.error("Error saving game state:", err);
  }
}

let readyStatus = false;
let endGame = false;
loadGameState();
setInterval(() => {
  if (endGame) {
    io.emit("updateGameState", gameState);
    io.emit("endGame");
    readyStatus = false;
  }
  if (readyStatus) {
    loadGameState();
    updateGameState();
    saveGameState();
    io.emit("updateGameState", gameState);
  }
}, 16); // Approx. 60fps

// Function to convert degrees to radians
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Function to calculate the tangent of an angle in degrees
function sec(degrees) {
  const radians = degreesToRadians(degrees);
  return 1 / Math.cos(radians);
}
function tan(degrees) {
  const radians = degreesToRadians(degrees);
  return Math.tan(radians);
}
// Reset functions also save the state
function resetBall() {
  let deg = Math.random() * 360;
  let x = 0.8 / sec(deg);
  let y = x * tan(deg);
  gameState.ball = {
    x: 50,
    y: 50,
    dx: x,
    dy: y,
  };
  saveGameState();
}

function abs(x) {
  return x > 0 ? x : -1 * x;
}

function updateGameState() {
  // Update ball position
  console.log("BALLDX", gameState.ball.dx, "BALLLDY", gameState.ball.dy);
  gameState.ball.x += gameState.ball.dx;
  gameState.ball.y += gameState.ball.dy;

  // Ball collision with paddles
  const paddleWidth = 5; // Approximate paddle width in canvas percentage
  const paddleHeight = 40; // Approximate paddle height in canvas percentage

  const growth_factor = 1.1115;
  console.log("growth_factor", growth_factor);

  // Ball collision with top and bottom walls
  if (gameState.ball.y <= 0 || gameState.ball.y >= 100) {
    gameState.ball.dx *= growth_factor;
    gameState.ball.dy *= growth_factor;
    gameState.ball.dy *= -1; // Reverse vertical direction
  }

  if (
    gameState.ball.x <= paddleWidth &&
    gameState.ball.y >= gameState.paddles.left &&
    gameState.ball.y <= gameState.paddles.left + paddleHeight
  ) {
    gameState.ball.dx *= growth_factor;
    gameState.ball.dy *= growth_factor;
    gameState.ball.dx *= -1; // Reverse horizontal direction
  }
  if (
    gameState.ball.x >= 100 - paddleWidth &&
    gameState.ball.y >= gameState.paddles.right &&
    gameState.ball.y <= gameState.paddles.right + paddleHeight
  ) {
    gameState.ball.dx *= growth_factor;
    gameState.ball.dy *= growth_factor;
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

  if (gameState.score.left == 7 || gameState.score.right == 7) {
    endGame = true;
  }
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
    saveTimerState();
  });

  socket.on("stop-timer", () => {
    console.log("Stopping timer");
    stopTimer();
  });

  socket.on("update-durations", (data) => {
    workDuration = data.workDuration;
    breakDuration = data.breakDuration;
    timeLeft = data.timeLeft;
    saveTimerState();
    io.emit("timer-update", { mode, timeLeft });
  });

  socket.on("start-timer", (data) => {
    console.log("Starting timer with data:", data);
    timeLeft = data.timeLeft;
    startTimer();
    saveTimerState();
  });

  // Send initial state to the connected client
  socket.emit("timer-update", { mode, timeLeft });

  /*============ Pong ============*/

  socket.on("resetGame", () => {
    console.log("RESET");
    readyStatus = true;
    endGame = false;
    resetScore();
    resetBall();
  });

  socket.on("ready", () => {
    console.log("READY");
    endGame = false;
    readyStatus = true;
  });
});

initializeTimer();
saveTimerState();
// Load the timer state from the file before starting the timer
loadTimerState();

// Start the timer
startTimer();

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
