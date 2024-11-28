import { ref } from 'vue'

export function useTimeControl() {
  const currentTime = ref(0)
  const isPlaying = ref(false)
  const startTime = ref(0)
  const timer = ref<number | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const pause = () => {
    isPlaying.value = false
    if (timer.value) {
      cancelAnimationFrame(timer.value)
      timer.value = null
    }
  }

  const reset = () => {
    pause()
    currentTime.value = 0
    startTime.value = 0
  }

  return {
    currentTime,
    isPlaying,
    startTime,
    timer,
    formatTime,
    pause,
    reset
  }
} 