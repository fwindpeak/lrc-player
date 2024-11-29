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

// 修改字体常量配置
const FONT_FAMILY =
  "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif";
const CURRENT_LINE_FONT_SIZE = 32; // 调小当前行字号
const NORMAL_LINE_FONT_SIZE = 20; // 调小普通行字号

// 随机颜色生成
const getRandomColor = () => {
  const colors = [
    "#FF66B2", // 亮粉色
    "#66FF66", // 亮绿色
    "#66FFFF", // 亮青色
    "#FF99FF", // 亮紫色
    "#FFFF66", // 亮黄色
    "#FF9966", // 亮橙色
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 优化后的位置计算函数
const getRandomPosition = (
  ctx: CanvasRenderingContext2D,
  text: string,
  isCurrent: boolean
) => {
  const fontSize = isCurrent ? CURRENT_LINE_FONT_SIZE : NORMAL_LINE_FONT_SIZE;
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;

  // 计算文本尺寸
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  if (isCurrent) {
    // 为当前行计算合适的缩放比例和位置
    const maxWidth = width * 0.8; // 留出20%的边距
    const maxHeight = height * 0.8; // 留出20%的边距
    let scale = 1.0;

    // 计算水平和垂直方向需要的缩放比例
    const horizontalScale = maxWidth / textWidth;
    const verticalScale = maxHeight / textHeight;

    // 使用较小的缩放比例，确保文字完全显示
    scale = Math.min(horizontalScale, verticalScale, 1.0);

    // 确保最小缩放比例
    // scale = Math.max(scale, 0.3);

    // 计算安全的显示范围
    const safeWidth = width * 0.8;
    const safeHeight = height * 0.8;

    // 在安全范围内添加较小的随机偏移
    const maxOffset = Math.min(safeWidth, safeHeight) * 0.1;
    const randomOffsetX = (Math.random() - 0.5) * maxOffset;
    const randomOffsetY = (Math.random() - 0.5) * maxOffset;

    // 确保文字始终在可见区域内
    const x = width / 2 + randomOffsetX;
    const y = height / 2 + randomOffsetY;

    return { x, y, scale };
  } else {
    // 过去的歌词完全随机位置，允许被裁剪
    const x = Math.random() * width;
    const y = Math.random() * height;

    // 为过去的歌词添加更大的随机缩放
    const randomScale = 0.3 + Math.random() * 0.3;

    return {
      x,
      y,
      scale: randomScale,
    };
  }
};

// 更新歌词状态
const updateLyricStates = () => {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext("2d")!;

  lyricStates.value.forEach((state, index) => {
    if (index === props.currentIndex) {
      // 当前歌词 - 计算合适的位置和缩放
      const { x, y, scale } = getRandomPosition(ctx, state.text, true);
      state.targetX = x;
      state.targetY = y;
      state.targetScale = scale; // 保持放大效果，但考虑缩放比例
      state.targetAlpha = 1;
      state.targetRotation = Math.sin(Date.now() / 1000) * 0.05; // 减小摇摆幅度
      state.color = getRandomColor();
    } else if (index < props.currentIndex) {
      // 过去的歌词 - 更自由的运动
      const time = Date.now() / 2000;
      state.targetX += Math.sin(time + index * 1.5) * 3;
      state.targetY += Math.cos(time + index * 1.5) * 3;
      state.targetScale = 0.5;
      state.targetAlpha = 0.4; // 降低透明度
      state.targetRotation = Math.sin(time + index) * 0.3;

      // 让过去的歌词缓慢飘向屏幕边缘
      if (state.targetY > height + 50 || state.targetY < -50) {
        const { x, y } = getRandomPosition(ctx, state.text, false);
        state.targetX = x;
        state.targetY = y;
      }
    } else {
      // 未来的歌词
      state.targetScale = 0;
      state.targetAlpha = 0;
      state.targetRotation = 0;
    }
  });

  // 添加新歌词
  while (lyricStates.value.length < props.lyrics.length) {
    const text = props.lyrics[lyricStates.value.length].text;
    const { x, y } = getRandomPosition(ctx, text, false);

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

  ctx.clearRect(0, 0, width, height);

  // 先绘制过去的歌词
  lyricStates.value.forEach((state, index) => {
    if (index < props.currentIndex) {
      drawLyric(ctx, state);
    }
  });

  // 最后绘制当前歌词，确保它在最上层
  if (lyricStates.value[props.currentIndex]) {
    drawLyric(ctx, lyricStates.value[props.currentIndex]);
  }

  animationFrame.value = requestAnimationFrame(animate);
};

// 抽取绘制歌词的函数
const drawLyric = (ctx: CanvasRenderingContext2D, state: LyricState) => {
  const easing = state === lyricStates.value[props.currentIndex] ? 0.1 : 0.05;

  state.x += (state.targetX - state.x) * easing;
  state.y += (state.targetY - state.y) * easing;
  state.scale += (state.targetScale - state.scale) * easing;
  state.alpha += (state.targetAlpha - state.alpha) * easing;
  state.rotation += (state.targetRotation - state.rotation) * easing;

  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.rotate(state.rotation);
  ctx.scale(state.scale, state.scale);

  const isCurrent = state === lyricStates.value[props.currentIndex];
  const fontSize = isCurrent ? CURRENT_LINE_FONT_SIZE : NORMAL_LINE_FONT_SIZE;
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center"; // 添加文本对齐设置

  if (isCurrent) {
    // 当前歌词使用更强的发光效果
    ctx.shadowColor = state.color;
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 多层发光效果
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = state.alpha * (0.3 - i * 0.1);
      ctx.fillStyle = state.color;
      ctx.fillText(state.text, 0, 0);
    }

    // 主文本
    ctx.shadowBlur = 5;
    ctx.globalAlpha = state.alpha;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(state.text, 0, 0);
  } else {
    // 过去的歌词简化渲染
    ctx.shadowBlur = 3;
    ctx.globalAlpha = state.alpha;
    ctx.fillStyle = state.color;
    ctx.fillText(state.text, 0, 0);
  }

  ctx.restore();
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
  background: linear-gradient(to bottom, #111111, #1a1a1a);
  border-radius: 8px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>
