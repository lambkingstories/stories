<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import useAvatar, { onAvatarFallback } from '@/use/useAvatar'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', index: number): void
}>()

const { t } = useI18n({ useScope: 'global' })
const { avatarIndex, avatarOptions, setAvatarIndex } = useAvatar()

function close() {
  emit('close')
}

function pick(i: number) {
  setAvatarIndex(i)
  emit('select', i)
  close()
}

function onKey(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template lang="pug">
  Teleport(to="body")
    transition(name="avatar-modal")
      div(
        v-if="open"
        class="avatar-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center px-5"
        @click.self="close"
      )
        div(class="avatar-modal-panel relative w-full max-w-md")
          button(
            type="button"
            class="avatar-modal-close"
            :aria-label="t('app.bookDetail.attachmentClose') || 'Close'"
            @click="close"
          )
            svg(viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5")
              path(d="M18 6 6 18M6 6l12 12")

          h3(class="avatar-modal-title") {{ t('app.profile.chooseAvatar') }}

          div(class="avatar-modal-grid")
            button(
              v-for="opt in avatarOptions"
              :key="opt.index"
              type="button"
              :class="['avatar-option', { 'is-selected': opt.index === avatarIndex }]"
              :aria-label="`Avatar ${opt.index + 1}`"
              :aria-pressed="opt.index === avatarIndex"
              @click="pick(opt.index)"
            )
              img(
                :src="opt.src"
                :alt="`Avatar ${opt.index + 1}`"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="onAvatarFallback"
              )
              span(
                v-if="opt.index === avatarIndex"
                class="avatar-option-check"
              )
                svg(viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4")
                  path(d="M20 6 9 17l-5-5")
</template>

<style scoped lang="sass">
button
  -webkit-tap-highlight-color: transparent

.avatar-modal-backdrop
  background-color: rgba(20, 14, 6, 0.55)
  backdrop-filter: blur(4px)

.avatar-modal-panel
  background: linear-gradient(180deg, #fdf8ed 0%, #f3e6c4 100%)
  border: 1.5px solid #e6d6b5
  border-radius: 24px
  padding: 22px 18px 18px
  box-shadow: 0 18px 50px -12px rgba(58, 42, 18, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6)
  // Never exceed the viewport — the title sits pinned at the top and
  // the grid scrolls internally when there are more avatars than the
  // visible height can show (matters for landscape phones).
  display: flex
  flex-direction: column
  max-height: calc(100dvh - 24px)
  // Override Tailwind's `max-w-md` (28rem) so the panel grows with the
  // viewport on tablets and landscape phones — gives the auto-fit grid
  // enough room to add columns instead of stacking into a tall scroll.
  max-width: min(560px, 92vw) !important

.avatar-modal-close
  position: absolute
  top: 12px
  right: 12px
  width: 34px
  height: 34px
  border-radius: 999px
  display: inline-flex
  align-items: center
  justify-content: center
  background-color: rgba(255, 255, 255, 0.65)
  color: #1a2f4a
  border: 1px solid #e6d6b5
  cursor: pointer
  transition: transform 150ms ease-out, background-color 150ms ease-out
  // 34 px to look at, 44 px for a finger
  &::after
    content: ''
    position: absolute
    inset: -5px
    border-radius: 999px

  &:hover
    background-color: #ffffff
    transform: scale(1.05)

  &:active
    transform: scale(0.94)

.avatar-modal-title
  font-size: 18px
  font-weight: 700
  color: #1a2f4a
  text-align: center
  margin: 0 0 16px
  letter-spacing: 0.01em

.avatar-modal-grid
  display: grid
  // Auto-fit packs as many ~72px tiles per row as the panel can hold:
  // three columns on the narrowest phones (320px viewport, panel ~280px),
  // four+ on standard phones, five+ on tablets and landscape — every
  // tile flexes from 72px up to 1fr so they always fill the panel
  // width responsively.
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr))
  gap: 12px
  // Scrolls inside the panel when the row count exceeds what fits in
  // the (height-capped) panel.
  overflow-y: auto
  flex: 1 1 auto
  min-height: 0
  // Touch scrolling on iOS
  -webkit-overflow-scrolling: touch
  // A bit of padding so focus rings on the last row aren't clipped
  padding: 2px

// Short viewports — landscape phones, very small tablets. Tile floor
// drops so more options fit per row and the grid stays compact.
@media (max-height: 520px)
  .avatar-modal-grid
    grid-template-columns: repeat(auto-fit, minmax(64px, 1fr))
    gap: 8px

  .avatar-modal-title
    margin-bottom: 10px
    font-size: 16px

  // Override Tailwind `max-w-md` so the panel can stretch wider on
  // landscape phones — gives the grid room to lay out in more columns
  // instead of stacking into a tall scroll. `!important` because the
  // base rule above already needs it to win over Tailwind.
  .avatar-modal-panel
    padding: 14px 14px 12px
    max-height: calc(100dvh - 16px)
    max-width: min(720px, 92vw) !important

.avatar-option
  position: relative
  aspect-ratio: 1
  border-radius: 18px
  overflow: hidden
  background: linear-gradient(160deg, #f3e6c4 0%, #e8d29a 100%)
  border: 2.5px solid transparent
  cursor: pointer
  transition: transform 160ms ease-out, border-color 160ms ease-out, box-shadow 160ms ease-out

  &:hover
    transform: translateY(-2px)
    border-color: rgba(212, 168, 62, 0.4)
    box-shadow: 0 10px 24px -10px rgba(212, 168, 62, 0.55)

  &:active
    transform: translateY(1px) scale(0.97)

  &.is-selected
    border-color: #d4a83e
    box-shadow: 0 0 0 3px rgba(212, 168, 62, 0.35), 0 12px 28px -10px rgba(212, 168, 62, 0.6)

.avatar-option-check
  position: absolute
  bottom: 6px
  right: 6px
  width: 24px
  height: 24px
  border-radius: 999px
  background: linear-gradient(180deg, #21406a 0%, #142a47 100%)
  border: 1.5px solid #0a1a30
  display: inline-flex
  align-items: center
  justify-content: center
  box-shadow: 0 4px 10px -2px rgba(10, 26, 48, 0.5)

.avatar-modal-enter-active,
.avatar-modal-leave-active
  transition: opacity 200ms ease

.avatar-modal-enter-from,
.avatar-modal-leave-to
  opacity: 0

.avatar-modal-enter-active .avatar-modal-panel,
.avatar-modal-leave-active .avatar-modal-panel
  transition: transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)

.avatar-modal-enter-from .avatar-modal-panel
  transform: scale(0.85) translateY(20px)

.avatar-modal-leave-to .avatar-modal-panel
  transform: scale(0.92) translateY(10px)
</style>
