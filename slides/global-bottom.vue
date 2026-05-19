<script setup lang="ts">
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentSlideNo, total } = useNav()

const sections = [
  { label: 'Problem',      pages: [2, 3] },
  { label: 'Error Classes', pages: [4] },
  { label: 'Research',     pages: [5] },
  { label: 'Formula',      pages: [6, 7, 8, 9, 10, 11, 12] },
  { label: 'Color System', pages: [13] },
  { label: 'Tech Stack',   pages: [14] },
  { label: 'Demo',         pages: [15] },
]

const show = computed(() => currentSlideNo.value > 1 && currentSlideNo.value < 16)

const activeIndex = computed(() =>
  sections.findIndex(s => s.pages.includes(currentSlideNo.value))
)

// within Formula section, show which term (slide 6 = overview, 7-12 = terms 1-6)
const formulaProgress = computed(() => {
  const p = currentSlideNo.value
  if (p === 6) return '0 / 6'
  if (p >= 7 && p <= 12) return `${p - 6} / 6`
  return null
})
</script>

<template>
  <div v-if="show" class="rely-toc">
    <template v-for="(section, i) in sections" :key="section.label">
      <div :class="['toc-item', { active: i === activeIndex, past: i < activeIndex }]">
        <span class="toc-dot" />
        <span class="toc-label">{{ section.label }}</span>
        <span v-if="i === activeIndex && formulaProgress && section.label === 'Formula'" class="toc-sub">
          {{ formulaProgress }}
        </span>
      </div>
      <div v-if="i < sections.length - 1" class="toc-sep" />
    </template>
    <div class="page-num">{{ currentSlideNo }} / {{ total }}</div>
  </div>
  <div v-else-if="currentSlideNo > 1" class="page-num-float">{{ currentSlideNo }} / {{ total }}</div>
</template>

<style scoped>
.rely-toc {
  position:        fixed;
  bottom:          0;
  left:            0;
  right:           0;
  height:          30px;
  display:         flex;
  align-items:     center;
  justify-content: center;
  background:      rgba(16, 16, 16, 0.97);
  border-top:      1px solid rgba(255, 255, 255, 0.07);
  z-index:         1000;
  gap:             0;
  backdrop-filter: blur(4px);
}

.toc-item {
  display:     flex;
  align-items: center;
  gap:         6px;
  padding:     0 18px;
  font-family: 'Space Grotesk', sans-serif;
  font-size:   10px;
  font-weight: 500;
  color:       #3a3a3a;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  user-select: none;
  transition:  color 0.2s;
}

.toc-item.past {
  color: #565656;
}

.toc-item.active {
  color: #4060D0;
}

.toc-dot {
  width:         5px;
  height:        5px;
  border-radius: 50%;
  background:    #3a3a3a;
  transition:    background 0.2s, box-shadow 0.2s;
  flex-shrink:   0;
}

.toc-item.past .toc-dot {
  background: #565656;
}

.toc-item.active .toc-dot {
  background:  #4060D0;
  box-shadow:  0 0 6px rgba(64, 96, 208, 0.7);
}

.toc-sep {
  width:      1px;
  height:     12px;
  background: rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.toc-label {
  line-height: 1;
}

.toc-sub {
  font-family: 'Geist Mono', monospace;
  font-size:   9px;
  color:       rgba(64, 96, 208, 0.7);
  letter-spacing: 0.04em;
  margin-left: 2px;
}

.page-num {
  position:    absolute;
  right:       18px;
  font-family: 'Geist Mono', monospace;
  font-size:   9.5px;
  color:       #363636;
  letter-spacing: 0.06em;
  user-select: none;
}

.page-num-float {
  position:    fixed;
  bottom:      10px;
  right:       18px;
  font-family: 'Geist Mono', monospace;
  font-size:   9.5px;
  color:       #363636;
  letter-spacing: 0.06em;
  user-select: none;
  z-index:     999;
}
</style>
