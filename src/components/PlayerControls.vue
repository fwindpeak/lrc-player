<template>
  <div class="controls">
    <button @click="$emit('toggle-play')">
      {{ isPlaying ? "暂停" : "播放" }}
    </button>
    <button @click="$emit('reset')">重置</button>

    <div class="timeline">
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}
      </div>
      <input
        type="range"
        :min="0"
        :max="totalDuration"
        :value="currentTime"
        @input="handleTimeChange"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  disabled: boolean;
  formatTime: (seconds: number) => string;
}>();

const emit = defineEmits<{
  (e: "toggle-play"): void;
  (e: "reset"): void;
  (e: "time-change", time: number): void;
}>();

const handleTimeChange = (event: Event) => {
  const newTime = Number((event.target as HTMLInputElement).value);
  emit("time-change", newTime);
};
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.timeline {
  margin-top: 15px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.time-display {
  font-family: monospace;
  font-size: 14px;
  color: #666;
}

input[type="range"] {
  width: 100%;
  max-width: 400px;
}

button {
  min-width: 80px;
  margin-right: 10px;
  padding: 5px 15px;
}
</style>
