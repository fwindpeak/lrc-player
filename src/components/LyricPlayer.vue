<template>
  <div class="lyric-player">
    <div class="theme-switch">
      <button class="theme-btn" @click="toggleTheme">
        <svg v-if="isDarkTheme" class="icon" viewBox="0 0 24 24">
          <path
            d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"
          />
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24">
          <path
            d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"
          />
        </svg>
        {{ isDarkTheme ? "亮色" : "暗色" }}
      </button>
    </div>
    <LyricEditor v-model="lrcInput" @change="handleLyricChange" />

    <PlayerControls
      :is-playing="isPlaying"
      :current-time="currentTime"
      :total-duration="totalDuration"
      :disabled="!parsedLyrics.length"
      :format-time="formatTime"
      @toggle-play="isPlaying ? pause() : play()"
      @reset="reset"
      @time-change="handleTimeChange"
    />

    <div class="display-container">
      <div class="display-tabs">
        <button
          :class="{ active: displayMode === 'list' }"
          @click="displayMode = 'list'"
        >
          列表模式
        </button>
        <button
          :class="{ active: displayMode === 'canvas' }"
          @click="displayMode = 'canvas'"
        >
          动画模式
        </button>
      </div>

      <LyricDisplay
        v-if="displayMode === 'list'"
        :lyrics="parsedLyrics"
        :current-index="currentIndex"
      />
      <LyricCanvasDisplay
        v-else
        :lyrics="parsedLyrics"
        :current-index="currentIndex"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, onMounted } from "vue";
import { useLyricParser } from "../composables/useLyricParser";
import { useTimeControl } from "../composables/useTimeControl";
import LyricEditor from "./LyricEditor.vue";
import LyricDisplay from "./LyricDisplay.vue";
import PlayerControls from "./PlayerControls.vue";
import LyricCanvasDisplay from "./LyricCanvasDisplay.vue";

const STORAGE_KEY = "lrc-editor-content";

const lrcDefault = `[00:00.00] 歌曲名称
[00:01.00] 作词 : XX
[00:02.00] 作曲 : XX
[00:03.00] 编曲 : XX
[00:08.00]第一句歌词
[00:12.00]第二句歌词`;

const lrcInput = ref(localStorage.getItem(STORAGE_KEY) || lrcDefault);
const parsedLyrics = ref([]);
const currentIndex = ref(0);

const { parseLRC, totalDuration } = useLyricParser();
const {
  currentTime,
  isPlaying,
  startTime,
  timer,
  formatTime,
  pause,
  reset: resetTime,
} = useTimeControl();

// 添加显示模式状态
const displayMode = ref<"list" | "canvas">("list");

// 在 script setup 中添加
const isDarkTheme = ref(
  window.matchMedia("(prefers-color-scheme: dark)").matches
);

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  document.documentElement.classList.toggle("dark-theme");
};

// 监听系统主题变化
onMounted(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (e) => {
    isDarkTheme.value = e.matches;
    document.documentElement.classList.toggle("dark-theme", e.matches);
  });
});

// 监听 lrcInput 的变化
watch(lrcInput, (newValue) => {
  localStorage.setItem(STORAGE_KEY, newValue);
});

const handleLyricChange = () => {
  parsedLyrics.value = parseLRC(lrcInput.value);
  reset();
};

const play = () => {
  if (parsedLyrics.value.length === 0) {
    parsedLyrics.value = parseLRC(lrcInput.value);
  }

  if (parsedLyrics.value.length === 0) return;

  isPlaying.value = true;
  startTime.value = Date.now() - currentTime.value * 1000;

  updateLyrics();
};

const reset = () => {
  resetTime();
  currentIndex.value = 0;
};

const updateLyrics = () => {
  if (!isPlaying.value) return;

  currentTime.value = (Date.now() - startTime.value) / 1000;

  const newIndex =
    parsedLyrics.value.findIndex((lyric) => lyric.time > currentTime.value) - 1;

  if (newIndex !== currentIndex.value && newIndex >= -1) {
    currentIndex.value = Math.max(0, newIndex);
  }

  if (currentTime.value >= totalDuration.value) {
    pause();
    return;
  }

  timer.value = requestAnimationFrame(updateLyrics);
};

const handleTimeChange = (newTime: number) => {
  currentTime.value = newTime;
  startTime.value = Date.now() - newTime * 1000;

  const newIndex =
    parsedLyrics.value.findIndex((lyric) => lyric.time > newTime) - 1;
  currentIndex.value = Math.max(0, newIndex);
};

onUnmounted(() => {
  if (timer.value) {
    cancelAnimationFrame(timer.value);
  }
});

// 初始化歌词
handleLyricChange();
</script>

<style scoped>
.lyric-player {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.display-container {
  margin-top: 20px;
}

.display-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.display-tabs button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #eee;
  cursor: pointer;
  transition: all 0.3s;
}

.display-tabs button.active {
  background: #2196f3;
  color: white;
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .display-tabs button {
    background: #333;
    color: #ccc;
  }

  .display-tabs button.active {
    background: #2196f3;
    color: white;
  }
}

.theme-switch {
  position: absolute;
  top: 10px;
  right: 50%;
  transform: translateX(50%);
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #eee;
  cursor: pointer;
  transition: all 0.3s;
}

.theme-btn:hover {
  background: #ddd;
}

.theme-btn .icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* 暗色主题样式 */
:global(.dark-theme) .theme-btn {
  background: #333;
  color: #fff;
}

:global(.dark-theme) .theme-btn:hover {
  background: #444;
}
</style>
