<template>
  <div class="lyric-player">
    <div class="input-section">
      <textarea
        v-model="lrcInput"
        placeholder="请输入LRC格式歌词或拖拽LRC文件到这里"
        @drop.prevent="handleDrop"
        @dragover.prevent
      ></textarea>
      <input type="file" accept=".lrc" @change="handleFileUpload" />
    </div>

    <div class="controls">
      <button @click="isPlaying ? pause() : play()">
        {{ isPlaying ? "暂停" : "播放" }}
      </button>
      <button @click="reset">重置</button>

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
          :disabled="!parsedLyrics.length"
        />
      </div>
    </div>

    <div class="lyrics-display">
      <div
        v-for="(line, index) in parsedLyrics"
        :key="index"
        :class="{ active: currentIndex === index }"
      >
        {{ line.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";

interface LyricLine {
  time: number;
  text: string;
}

const lrcDefault = `[00:00.00] 歌曲名称
[00:01.00] 作词 : 林夕
[00:02.00] 作曲 : 陈小霞
[00:03.00] 编曲 : 陈辉阳
[00:08.00]第一句歌词
[00:12.00]第二句歌词
`;

const lrcInput = ref(lrcDefault);
const parsedLyrics = ref<LyricLine[]>([]);
const isPlaying = ref(false);
const currentIndex = ref(0);
const startTime = ref(0);
const timer = ref<number | null>(null);
const currentTime = ref(0);
const totalDuration = ref(0);

// 解析LRC格式的歌词
const parseLRC = (lrc: string) => {
  const lines = lrc.split("\n");
  const lyrics: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  lines.forEach((line) => {
    if (!line.trim()) return;

    const matches = [...line.matchAll(timeRegex)];
    if (matches.length === 0) return;

    matches.forEach((match) => {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);

      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, "").trim();

      lyrics.push({ time, text });
    });
  });

  const sortedLyrics = lyrics.sort((a, b) => a.time - b.time);
  totalDuration.value =
    sortedLyrics.length > 0
      ? sortedLyrics[sortedLyrics.length - 1].time + 5
      : 0;

  return sortedLyrics;
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    lrcInput.value = e.target?.result as string;
    parsedLyrics.value = parseLRC(lrcInput.value);
    reset();
  };
  reader.readAsText(file);
};

// 处理拖拽上传
const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    lrcInput.value = e.target?.result as string;
    parsedLyrics.value = parseLRC(lrcInput.value);
    reset();
  };
  reader.readAsText(file);
};

// 播放控制
const play = () => {
  if (parsedLyrics.value.length === 0) {
    parsedLyrics.value = parseLRC(lrcInput.value);
  }

  if (parsedLyrics.value.length === 0) return;

  isPlaying.value = true;
  startTime.value =
    Date.now() - (parsedLyrics.value[currentIndex.value]?.time || 0) * 1000;

  updateLyrics();
};

const pause = () => {
  isPlaying.value = false;
  if (timer.value) {
    cancelAnimationFrame(timer.value);
    timer.value = null;
  }
};

const reset = () => {
  pause();
  currentIndex.value = 0;
  startTime.value = 0;
  currentTime.value = 0;
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

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const handleTimeChange = (event: Event) => {
  const newTime = Number((event.target as HTMLInputElement).value);
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
</script>

<style scoped>
.lyric-player {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.input-section {
  margin-bottom: 20px;
}

textarea {
  width: 100%;
  height: 150px;
  padding: 10px;
  margin-bottom: 10px;
}

.controls {
  margin-bottom: 20px;
}

button {
  margin-right: 10px;
  padding: 5px 15px;
}

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

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.controls button {
  min-width: 80px;
}
</style>
