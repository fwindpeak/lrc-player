<template>
  <div class="lyrics-display">
    <div
      v-for="(line, index) in lyrics"
      :key="index"
      :class="{ active: currentIndex === index }"
    >
      {{ line.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LyricLine } from "../composables/useLyricParser";

defineProps<{
  lyrics: LyricLine[];
  currentIndex: number;
}>();
</script>

<style scoped>
.lyrics-display {
  text-align: center;
  height: 300px;
  overflow-y: auto;
}

.lyrics-display div {
  padding: 5px 0;
  color: #666;
}

.lyrics-display div.active {
  color: #42b983;
  font-weight: bold;
}
</style>
