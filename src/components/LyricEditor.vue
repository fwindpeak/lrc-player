<template>
  <div class="input-section">
    <div class="file-actions">
      <div class="file-input-wrapper">
        <input type="file" accept=".lrc" @change="handleFileUpload" />
      </div>
      <button class="save-button" @click="saveToFile" :disabled="!modelValue">
        保存为LRC文件
      </button>
    </div>
    <div class="editor-container">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="onInput"
        @scroll="syncScroll"
        placeholder="请输入LRC格式歌词或拖拽LRC文件到这里"
        @drop.prevent="handleDrop"
        @dragover.prevent
      ></textarea>
      <div ref="previewRef" class="preview">
        <template v-for="(line, _index) in highlightedLines" :key="_index">
          <div class="line">
            <span v-if="line.timeTag" class="time-tag">{{ line.timeTag }}</span>
            <span>{{ line.text }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change"): void;
}>();

const textareaRef = ref<HTMLTextAreaElement>();
const previewRef = ref<HTMLDivElement>();

// 同步动
const syncScroll = () => {
  if (textareaRef.value && previewRef.value) {
    previewRef.value.scrollTop = textareaRef.value.scrollTop;
  }
};

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    emit("update:modelValue", e.target?.result as string);
    emit("change");
  };
  reader.readAsText(file);
};

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    emit("update:modelValue", e.target?.result as string);
    emit("change");
  };
  reader.readAsText(file);
};

const onInput = (e: Event) => {
  emit("update:modelValue", (e.target as HTMLTextAreaElement).value);
  emit("change");
};

interface HighlightedLine {
  timeTag: string | null;
  text: string;
}

const highlightedLines = computed<HighlightedLine[]>(() => {
  return props.modelValue.split("\n").map((line) => {
    const timeTagMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
    if (timeTagMatch) {
      const timeTag = timeTagMatch[0];
      const text = line.slice(timeTag.length);
      return { timeTag, text };
    }
    return { timeTag: null, text: line };
  });
});

// 加保存文件功能
const saveToFile = () => {
  // 创建 Blob 对象
  const blob = new Blob([props.modelValue], {
    type: "text/plain;charset=utf-8",
  });

  // 创建下载链接
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);

  // 设置文件名
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(
    2,
    "0"
  )}${String(now.getMinutes()).padStart(2, "0")}`;
  link.download = `lyrics_${timestamp}.lrc`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
</script>

<style scoped>
.input-section {
  width: 100%;
  margin-bottom: 20px;
}

.file-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.file-input-wrapper {
  flex: 1;
}

.save-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-button:hover {
  background-color: #45a049;
}

.save-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.editor-container {
  position: relative;
  height: 200px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
}

textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 10px;
  border: none;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
  background: transparent;
  resize: none;
  z-index: 1;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
}

.preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 10px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  pointer-events: none;
  overflow-y: auto;
  text-align: left;
  background: var(--editor-bg, #ffffff);
  z-index: 0;
  box-sizing: border-box;
}

.preview .line {
  white-space: pre;
  text-align: left;
}

.time-tag {
  color: #2196f3;
  font-weight: bold;
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  textarea {
    color: #ccc;
    background: #1a1a1a;
  }

  .preview {
    background: #1a1a1a;
  }

  .time-tag {
    color: #64b5f6;
  }
}
</style>
