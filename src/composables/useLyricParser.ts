import { ref } from 'vue'

export interface LyricLine {
  time: number
  text: string
}

export function useLyricParser() {
  const totalDuration = ref(0)

  const parseLRC = (lrc: string) => {
    const lines = lrc.split("\n")
    const lyrics: LyricLine[] = []
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

    lines.forEach((line) => {
      if (!line.trim()) return

      const matches = [...line.matchAll(timeRegex)]
      if (matches.length === 0) return

      matches.forEach((match) => {
        const minutes = parseInt(match[1])
        const seconds = parseInt(match[2])
        const milliseconds = parseInt(match[3])

        const time = minutes * 60 + seconds + milliseconds / 1000
        const text = line.replace(timeRegex, "").trim()

        lyrics.push({ time, text })
      })
    })

    const sortedLyrics = lyrics.sort((a, b) => a.time - b.time)
    totalDuration.value = sortedLyrics.length > 0
      ? sortedLyrics[sortedLyrics.length - 1].time + 5
      : 0

    return sortedLyrics
  }

  return {
    parseLRC,
    totalDuration
  }
} 