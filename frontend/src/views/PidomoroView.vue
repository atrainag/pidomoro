<template>
  <div id="app" class="container">
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

      <!-- Start and Stop Buttons -->
      <div class="button-container">
        <button class="start-stop-button" @click="increaseMin">▲</button>
        <button class="start-stop-button" @click="startTimer">Start</button>
        <button class="start-stop-button" @click="stopTimer">Stop</button>
        <button class="start-stop-button" @click="decreaseMin">▼</button>
      </div>

      <!-- Settings Modal -->
      <div v-if="showSettings" class="settings-modal">
        <div class="modal-content">
          <h2>Settings</h2>

          <label>
            Work Duration (minutes): 
            <input type="number" v-model="workDuration" min="1" />
          </label>
          <label>
            Break Duration (minutes): 
            <input type="number" v-model="breakDuration" min="1" />
          </label>
          <!-- Timer Adjustment -->
          <div class="timer-adjustment">
            Min:
            <input type="number" v-model="inputMin"/>
            Sec:
            <input type="number" v-model="inputSecond"/>
          </div>
          <div class="button-container">
          <button @click="saveSettings">Save</button>
          <button @click="closeSettings">Close</button>
          </div>
        </div>
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
      inputSecond: 0,
      inputMin: 25,
      currState : "Start",
      showSettings: false,
      workDuration: 25,  // Default work session duration
      breakDuration: 5,  // Default break session duration
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
      this.showSettings = true;
    },
    closeSettings() {
      this.showSettings = false;
    },
    startTimer() {
      this.currState = "Start";
      this.socket.emit("start-timer", { timeLeft: this.timeLeft });
      
    },
    stopTimer() {
      this.currState = "Stop";
      this.socket.emit("stop-timer");
      console.log("Stopping timer");
    },
    updateTimer(data) {
      this.mode = data.mode;
      this.timeLeft = data.timeLeft;
      this.currState = data.currState;
    },
    increaseMin() {
      if(this.currState=="State")return;
      this.timeLeft = (Math.floor((this.timeLeft)/ 60) == 60 ) ? 0 : Math.floor((this.timeLeft+60)/ 60)*60 + this.timeLeft % 60 ;
      this.updateTime();
    },
    decreaseMin() {
      if(this.currState=="State")return;
      this.timeLeft = (Math.floor((this.timeLeft)/ 60)== 0 ) ? 3600 : Math.floor((this.timeLeft-60)/ 60)*60 + this.timeLeft % 60;
      this.updateTime();
    },
    updateTime() {
      this.socket.emit("update-timer", { timeLeft: this.timeLeft });
    },
  },
    created(){
    this.socket = io("http://192.168.1.124:3000");
    },
  mounted() {
    this.socket.on("timer-update", this.updateTimer);
    this.socket.on("start-timer", (data) => {
      console.log("Timer started", data); // Debugging line
    });
    this.socket.on("stop-timer", () => {
      console.log("Timer stopped"); // Debugging line
    });
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
  font-size: 72px;
  font-family: 'Courier New', monospace;
  color: rgb(0, 212, 106);
  text-shadow: 2px 2px 4px rgb(2, 126, 12);
  font-weight: bold;
}

.row-container {
  display: flex;
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
}

.indicator {
  font-size: 24px;
  color: rgb(0, 212, 106);
  text-shadow: 2px 2px 4px rgb(2, 126, 12);
  font-weight: bold;
}
.button-container button.start-stop-button {
  padding: 5px;
  font-size: 18px;
  margin: 10px;
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0);
  color: rgb(0, 212, 106);
  border: 3px solid rgb(0, 212, 106);
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
}
.button-container button.start-stop-button:hover {
  background-color: rgba(0, 0, 0, 0);
  col0or: rgb(2, 238, 120);
  transform: scale(1.1);
}
</style>
