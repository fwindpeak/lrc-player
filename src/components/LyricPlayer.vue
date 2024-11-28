<template>
  <div class="lyric-player">
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

    <LyricDisplay :lyrics="parsedLyrics" :current-index="currentIndex" />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from "vue";
import { useLyricParser } from "../composables/useLyricParser";
import { useTimeControl } from "../composables/useTimeControl";
import LyricEditor from "./LyricEditor.vue";
import LyricDisplay from "./LyricDisplay.vue";
import PlayerControls from "./PlayerControls.vue";

const STORAGE_KEY = "lrc-editor-content";

const lrcDefault = `[00:00.00] 歌曲名称
[00:01.00] 作词 : 林夕
[00:02.00] 作曲 : 陈小霞
[00:03.00] 编曲 : 陈辉阳
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

  while (
    currentIndex.value < parsedLyrics.value.length &&
    parsedLyrics.value[currentIndex.value].time <= currentTime.value
  ) {
    currentIndex.value++;
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

  currentIndex.value =
    parsedLyrics.value.findIndex((lyric) => lyric.time > newTime) - 1;
  if (currentIndex.value < 0) currentIndex.value = 0;
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
</style>
