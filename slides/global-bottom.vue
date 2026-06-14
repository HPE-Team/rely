<script setup lang="ts">
import { computed } from 'vue'
import { useNav } from '@slidev/client'

const { currentSlideNo, total } = useNav()

const sections = [
  { label: 'Problem',      pages: [2, 3] },
  { label: 'Error Classes', pages: [4] },
  { label: 'Data Gen',     pages: [5, 6, 7, 8] },
  { label: 'Research',     pages: [9, 10, 11] },
  { label: 'Formula',      pages: [12, 13, 14, 15, 16, 17, 18, 19, 20] },
  { label: 'Color System', pages: [21] },
  { label: 'Tech Stack',   pages: [22] },
  { label: 'Demo',         pages: [23] },
]

const show = computed(() => currentSlideNo.value > 1 && currentSlideNo.value < 24)

const activeIndex = computed(() =>
  sections.findIndex(s => s.pages.includes(currentSlideNo.value))
)

// position within the active section, shown only for multi-slide sections
const sectionProgress = computed(() => {
  const s = sections[activeIndex.value]
  if (!s || s.pages.length < 2) return null
  const pos = s.pages.indexOf(currentSlideNo.value) + 1
  return `${pos} / ${s.pages.length}`
})
</script>

<template>
  <div v-if="show" class="rely-toc">
    <template v-for="(section, i) in sections" :key="section.label">
      <div :class="['toc-item', { active: i === activeIndex, past: i < activeIndex }]">
        <span class="toc-dot" />
        <span class="toc-label">{{ section.label }}</span>
        <span v-if="i === activeIndex && sectionProgress" class="toc-sub">
          {{ sectionProgress }}
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
