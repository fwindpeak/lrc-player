<template>
  <div class="canvas-container">
    <canvas ref="canvasRef" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";
import type { LyricLine } from "../composables/useLyricParser";

const props = defineProps<{
  lyrics: LyricLine[];
  currentIndex: number;
  width?: number;
  height?: number;
}>();

interface LyricState {
  text: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  targetScale: number;
  alpha: number;
  targetAlpha: number;
  color: string;
  rotation: number;
  targetRotation: number;
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const lyricStates = ref<LyricState[]>([]);
const animationFrame = ref<number>();

// 默认尺寸
const width = props.width || 600;
const height = props.height || 400;

// 随机颜色生成
const getRandomColor = () => {
  const colors = [
    "#FF3366",
    "#FF6633",
    "#FFCC33",
    "#33CC33",
    "#3366FF",
    "#9933FF",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 生成随机位置（确保文字完整显示）
const getRandomPosition = (ctx: CanvasRenderingContext2D, text: string) => {
  ctx.font = "24px Arial";
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  return {
    x: Math.random() * (width - textWidth - 40) + 20,
    y: Math.random() * (height - 60) + 40, // 保留上下边距
  };
};

// 更新歌词状态
const updateLyricStates = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d")!;

  // 更新现有歌词的目标状态
  lyricStates.value.forEach((state, index) => {
    if (index === props.currentIndex) {
      // 当前歌词
      const { x, y } = getRandomPosition(ctx, state.text);
      state.targetX = x;
      state.targetY = y;
      state.targetScale = 1.2;
      state.targetAlpha = 1;
      state.targetRotation = 0;
      state.color = getRandomColor();
    } else if (index < props.currentIndex) {
      // 过去的歌词
      state.targetScale = 0.6;
      state.targetAlpha = 0.3;
      state.targetRotation = Math.random() * 0.1 - 0.05;
    } else {
      // 未来的歌词
      state.targetScale = 0;
      state.targetAlpha = 0;
      state.targetRotation = Math.random() * 0.2 - 0.1;
    }
  });

  // 添加新歌词
  while (lyricStates.value.length < props.lyrics.length) {
    const text = props.lyrics[lyricStates.value.length].text;
    const { x, y } = getRandomPosition(ctx, text);

    lyricStates.value.push({
      text,
      x: x,
      y: height + 50, // 从底部进入
      targetX: x,
      targetY: y,
      scale: 0,
      targetScale: 0,
      alpha: 0,
      targetAlpha: 0,
      color: getRandomColor(),
      rotation: Math.random() * Math.PI * 2,
      targetRotation: 0,
    });
  }
};

// 动画循环
const animate = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d")!;

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 更新和绘制每个歌词
  lyricStates.value.forEach((state) => {
    // 缓动动画
    state.x += (state.targetX - state.x) * 0.1;
    state.y += (state.targetY - state.y) * 0.1;
    state.scale += (state.targetScale - state.scale) * 0.1;
    state.alpha += (state.targetAlpha - state.alpha) * 0.1;
    state.rotation += (state.targetRotation - state.rotation) * 0.1;

    // 绘制歌词
    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate(state.rotation);
    ctx.scale(state.scale, state.scale);

    // 设置文字样式
    ctx.font = "24px Arial";
    ctx.fillStyle = state.color;
    ctx.globalAlpha = state.alpha;

    // 添加文字阴影
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 绘制文字
    ctx.fillText(state.text, 0, 0);
    ctx.restore();
  });

  animationFrame.value = requestAnimationFrame(animate);
};

// 监听当前歌词索引变化
watch(
  () => props.currentIndex,
  () => {
    updateLyricStates();
  }
);

// 监听歌词数组变化
watch(
  () => props.lyrics,
  () => {
    lyricStates.value = [];
    updateLyricStates();
  }
);

onMounted(() => {
  updateLyricStates();
  animate();
});

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
});
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 400px;
  background: linear-gradient(to bottom, #1a1a1a, #2d2d2d);
  border-radius: 8px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>
