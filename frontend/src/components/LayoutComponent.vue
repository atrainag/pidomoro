<template class="temp">
  <header>
    <!-- Title -->
    <h1 v-show="page" class="title">Pimodoro Timer</h1>
    <h1 v-show="!page" class="title">Pong Game</h1>
    <!-- Settings Button -->
    <div class="wrapper">
      <nav>
        <RouterLink v-show="page" to="/pong" @click=swiPage() class="nav-link text-white">Pong</RouterLink>
        <RouterLink v-show="!page" to="/" @click=swiPage() class="nav-link text-white">Pidomoro</RouterLink>
        <!-- Settings Button -->
        <button class="settings-button" @click="openSettings">⚙</button>
      </nav>
    </div>
  </header>
   <main class="container">
    <div class="content-wrapper">
      <RouterView />
    </div>
  </main>
   <!-- Settings Modal -->
   <div v-if="showSettings" class="settings-modal">
      <div class="modal-content">
        <h2>Settings</h2>

        <label>
          <span>Work Duration [Min]:</span>
          <input type="number" v-model="workDuration" min="1" />
        </label>
        <label>
          <span>Break Duration [Min]:</span>
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
        <button class="settingbutton"@click="saveSettings">Save</button>
        <button class="settingbutton"@click="closeSettings">Close</button>
        </div>
      </div>
    </div>
</template>

<script>
import { io } from "socket.io-client";
export default {
  name: "Layout",
  data() {
    return {
      showSettings: false,
      workDuration: 25, // Default work session duration
      breakDuration: 5, // Default break session duration
      inputMin: 25,
      inputSecond: 0,
      page : true
    };
  },
  computed: {
    
  },
  methods: {
    swiPage() {
      if(this.page){
        this.page = false;
      }
      else
      {
        this.page = true;
      }

    },
    openSettings() {
      this.showSettings = true;
    },
    closeSettings() {
      this.showSettings = false;
    },
    saveSettings() {
      this.socket.emit("update-durations", {
        workDuration: this.workDuration * 60,  // Send duration in seconds
        breakDuration: this.breakDuration * 60,
        timeLeft: this.inputMin * 60 + this.inputSecond
      });
      this.closeSettings(); // Close the modal after saving
    },
  },
  created() {
    // Initialize socket connection
    this.socket = io("http://192.168.1.124:3000");
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
header {
  width: 100%;
  line-height: 1.8;
  background-color: rgb(0, 29, 5);
  display: flex;
  align-items: center; /* Center the items vertically */
  justify-content: space-between; /* Space between logo and nav */
  padding-right: calc(var(--section-gap) / 2);
}

header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
}

header .title {
  display: block;
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgb(2, 126, 12);
  color: rgb(0, 212, 106);
  margin-left: 20px; 
}

nav .nav-link {
  padding: 0 1rem;
  font-size: 24px;
  display: block;
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  color: rgb(0, 146, 73);
  display: inline-block;
  border-left: 1px solid var(--color-border);
  border: 0;
}

nav .nav-link:hover {
  background-color: transparent;
  text-shadow: 2px 2px 4px rgb(2, 126, 12);
  color: rgb(0, 212, 106);
  transform: scale(1.3);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;     
  min-height: 80vh;        
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center; 
  align-items: center;    
  width: 100%;
  padding: 20px;
  text-align: center;
}

header .settings-button {
  color: rgb(0, 146, 73);
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  padding: 8px 20px; /* Increased padding for a fatter look */
  font-size: 20px;
  border-radius: 8px; /* Optional: rounded corners */
  border: none; /* Ensure no border */
  cursor: pointer; /* Pointer cursor on hover */
}

header .settings-button:hover {
  background-color: transparent;
  text-shadow: 2px 2px 4px rgb(2, 126, 12);
  color: rgb(0, 212, 106);
  transform: scale(1.3);
}

.settings-button {
  background-color: rgba(0, 0, 0, 0) !important;
  transition: background-color 0.3s, transform 0.3s;
}

.settings-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 30px;
  background: rgb(0, 29, 5);
  border: 3px solid rgb(0, 212, 106);
  z-index: 1000;
  color: rgb(0, 212, 106);
  text-shadow: 2px 2px 4px rgb(2, 126, 12);
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  font-size: 20px;
}
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.settings-modal button {
  padding: 5px 10px;
  margin-top: 10px;
  color: black;
}
.settings-modal button.settingbutton {
  padding: 5px;
  font-size: 18px;
  margin-right: 20px;
  margin-top: 30px;
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0);
  color: rgb(0, 212, 106);
  border: 3px solid rgb(0, 212, 106);
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
}
.settings-modal button.settingbutton:hover {
  background-color: rgba(0, 0, 0, 0);
  color: rgb(2, 238, 120);
  transform: scale(1.1);
}

.settings-modal input[type="number"]::-webkit-outer-spin-button,
.settings-modal input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.settings-modal input[type="number"]:focus {
  outline: none;
}
.settings-modal input[type="number"] {
  -moz-appearance: textfield;
}
.settings-modal input[type="number"] {
  padding: 5px;
  font-size: 20px;
  font-family: 'Courier New', sans-serif;
  font-weight: bold;
  border: 3px solid rgb(0, 212, 106);
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0);
  color: rgb(0, 212, 106);
  width: 80px;
}.settings-modal label {
  display: flex;
  justify-content: space-between;  /* 使標籤和輸入框之間的空間分配均勻 */
  align-items: center;  /* 垂直居中 */
  margin-bottom: 15px; /* 設定底部間距 */
}

.settings-modal label span {
  margin-right: 10px;
}
</style>
