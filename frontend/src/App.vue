<template>
  <div>
    <h1>Pomodoro Timer</h1>
    <p>Loops Completed: {{ loops }}</p>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      loops: 0,
    };
  },
  created() {
    const socket = io('http://localhost:3000');
    socket.on('sync-data', (data) => {
      this.loops = data.loops;
    });
  },
};
</script>
