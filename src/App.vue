<template>
  <div>
    <h1>LRC歌词播放器</h1>
    <LyricPlayer />
  </div>
</template>

<script setup lang="ts">
import LyricPlayer from "./components/LyricPlayer.vue";
</script>

<style>
#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
</style>
