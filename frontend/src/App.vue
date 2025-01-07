<template>
  <div id="app" class="container">
    <!-- Title -->
    <h1 class="title">Pomodoro Timer</h1>
    
    <!-- Settings Button -->
    <button class="settings-button" @click="openSettings">Settings</button>

    <!-- Spacer -->
    <div class="spacer"></div>

    <div class="row-container">
      <!-- Timer -->
      <div class="timer">
        <h1>{{ formattedTime }}</h1>
      </div>

      <!-- Indicator -->
      <div class="indicator">
        <h2>{{ mode }}</h2>
      </div>

      <!-- Timer Adjustment -->
      <div class="timer-adjustment">
        <button @click="increaseTime">▲</button>
        <input type="number" v-model="inputTime" @input="updateTime" />
        <button @click="decreaseTime">▼</button>
      </div>

      <!-- Start and Stop Buttons -->
      <div class="button-container">
        <button class="start-button" @click="startTimer">Start</button>
        <button class="stop-button" @click="stopTimer">Stop</button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      mode: "Work", // Initial mode is "Work"
      timeLeft: 1500, // Initial time in seconds (e.g., 25 minutes)
      socket: null,
      inputTime: 25, // Default input time in minutes
     currState : "Start",
    };
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, "0");
      const seconds = (this.timeLeft % 60).toString().padStart(2, "0");
      return `${minutes}:${seconds}`;
    },
  },
  methods: {
    openSettings() {
      alert("Settings coming soon!");
    },
    startTimer() {
        this.currState = "Start";

      this.socket.emit("start-timer", { timeLeft: this.timeLeft });
    },
    stopTimer() {
        this.currState = "Stop";
      this.socket.emit("stop-timer");
    },
    updateTimer(data) {
      this.mode = data.mode;
      this.timeLeft = data.timeLeft;
      this.inputTime = Math.floor(data.timeLeft / 60); // Update input time in minutes
    },
    increaseTime() {
        if(this.currState=="State")return;
      this.inputTime = Math.min(this.inputTime + 5, 60); // Increase by 5 minutes, max 60
      this.updateTime();
    },
    decreaseTime() {
        if(this.currState=="State")return;
      this.inputTime = Math.max(this.inputTime - 5, 0); // Decrease by 5 minutes, min 1
      this.updateTime();
    },
    updateTime() {
      this.timeLeft = this.inputTime * 60; // Convert minutes to seconds
      this.socket.emit("update-timer", { timeLeft: this.timeLeft });
    },
  },
  mounted() {
    this.socket = io("http://192.168.1.150:3000");

    this.socket.on("timer-update", this.updateTimer);
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
.container {
  text-align: center;
  margin: 50px auto;
  font-family: Arial, sans-serif;
}

.title {
  font-size: 2em;
  font-weight: bold;
  position: absolute;
  top: 20px;
  left: 20px;
}

.settings-button {
  background-color: #2b9bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  position: absolute;
  top: 20px;
  right: 20px;
}

.spacer {
  height: 50px; /* Adjust the height as needed for spacing */
}

.timer {
  font-size: 3em;
  font-weight: bold;
}

.row-container {
  display: flex;
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
}

.indicator {
  margin: 20px 0;
  font-size: 1.5em;
  font-weight: bold;
}

</style>
