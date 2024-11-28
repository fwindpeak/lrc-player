<template>
  <div class="controls">
    <div class="buttons">
      <button class="control-btn" @click="$emit('toggle-play')">
        <svg v-if="isPlaying" class="icon" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span class="btn-text">{{ isPlaying ? "暂停" : "播放" }}</span>
      </button>
      <button class="control-btn" @click="$emit('reset')">
        <svg class="icon" viewBox="0 0 24 24">
          <path
            d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
          />
        </svg>
        <span class="btn-text">重置</span>
      </button>
    </div>

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
  gap: 15px;
  margin-bottom: 20px;
}

.buttons {
  display: flex;
  gap: 10px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 80px;
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.control-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.btn-text {
  font-size: 14px;
}

.timeline {
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

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .control-btn {
    background: #333;
    border-color: #666;
    color: #fff;
  }

  .control-btn:hover {
    background: #444;
    border-color: #888;
  }

  .time-display {
    color: #999;
  }
}
</style>
