<template>
    <div>
        <h2>Game Host Screen</h2>
        <h3>Score: {{ gameState?.score.left }} - {{ gameState?.score.right }}</h3>
    <div class="gameContainer">
      <img
        ref="gameImage"
        :src="backgroundImage"
        alt="Game Background"
        class="backgroundGame"
      />
      <canvas
        ref="gameCanvas"
        width="800"
        height="400"
        alt="Game"
        class="canvasGame"
      />

        <h1 v-if="ending" class="endingGame">GAMEOVER :  {{ gameState?.score.left }} - {{ gameState?.score.right }}</h1>
    </div>
        <!-- <img ref="gameImage" width="800" height="400" :src="backgroundImage" alt="Game Bg" class= "backgroundGame"/> -->
        <!-- <canvas ref="gameCanvas" width="800" height="400" alt="Game" class="canvasGame"/> -->
        <div>
            <button @click="resetGame()">Reset Game</button>
        </div>
        <div>
            <button @click="setReady()">Start Game</button>
        </div>
    </div>
  </template>
  
  <script>
  import io from 'socket.io-client';
  import backgroundImage from '@/assets/background.jpg';
  export default {
    data() {
      return {
        socket: null,
        role: null,
        ready: false,
        gameState: null,
          ending : false,
        backgroundImage
      };
    },
      created(){
          this.socket = io('http://192.168.1.124:3000'); 
      },
    mounted() {
      // Handle role assignment
      this.socket.on('updateGameState', (state) => {
        if (this.ready) {
            this.gameState = state;
            this.drawGame();
        }
      });
        this.socket.on('endGame',()=>{this.ending=true; this.ready=false;});
    },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
    methods: {
      resetGame(){
          this.ending = false;
        this.socket.emit('resetGame');
        this.socket.emit('ready');
      },
      setReady() {
        this.socket.emit('ready');
      this.ending = false;
        this.ready = true;
      },
      drawGame() {
      const canvas = this.$refs.gameCanvas;
      const ctx = canvas.getContext('2d');
  
      // Check if the canvas is initialized
      if (!canvas || !ctx) {
        console.error('Canvas is not initialized or unavailable.');
        return;
      }
  
      // Clear the canvas completely
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Set a white background explicitly
     //  ctx.fillStyle = 'white';
     //  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Draw paddles
      ctx.fillStyle = 'blue';
      const paddleHeight = 80; // Height of paddles in pixels
      const paddleWidth = 10; // Width of paddles in pixels
      ctx.fillRect(50, this.gameState.paddles.left * 4, paddleWidth, paddleHeight); // Left paddle
      ctx.fillRect(740, this.gameState.paddles.right * 4, paddleWidth, paddleHeight); // Right paddle
  
      // Draw ball
      ctx.fillStyle = 'red';
      const ballRadius = 10; // Radius of the ball
      ctx.beginPath();
      ctx.arc(this.gameState.ball.x * 8, this.gameState.ball.y * 4, ballRadius, 0, Math.PI * 2);
      ctx.fill();
    
      }
    }
  };
  </script>
  
  
<style >
.gameContainer {
  position: relative; /* Establish stacking context */
  width: 800px; /* Match the dimensions of the canvas and image */
  height: 400px; /* Match the dimensions of the canvas and image */
}

.backgroundGame {
  position: absolute; /* Position within the container */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* Background layer */
}

.canvasGame {
  position: absolute; /* Overlay on top of the image */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Foreground layer */
}

.endingGame{
  position: absolute; /* Overlay on top of the image */
  top: 300px;
  left: 100px;
  z-index: 2; /* Foreground layer */
}
</style>
