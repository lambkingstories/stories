<script setup lang="ts">
/**
 * Android: the pictures and sounds of the adventures are a Google Play pack that Google downloads right after the installation. As long as it is not complete the app
 * would show empty circles and silence; this screen says what is going on, shows the progress and starts the app again by itself when the pack is there
 * (the first test on a real phone, 24.11.2026, showed the empty look).
 */
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adventureWait, androidPackMissing, androidPackStatus, mediaSplitReport } from '@/utils/mediaSplit'

const { locale } = useI18n({ useScope: 'global' })
const missing = ref(androidPackMissing())
const percent = ref(mediaSplitReport.pack.percent)
const status = ref(mediaSplitReport.pack.status)
const later = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const TEXTS = {
  de: { title: 'Die Abenteuer werden geladen', sub: 'Bilder und Töne laden jetzt auf dein Gerät. Das passiert nur einmal und dauert ein paar Minuten.', wifi: 'Das Laden wartet auf WLAN.', failed: 'Das Laden hat einen Fehler gemeldet. Es wird weiter versucht.', later: 'Später', advTitle: 'Das Abenteuer wird geladen', advSub: 'Bilder und Töne kommen jetzt auf dein Gerät. Das dauert nur einen Moment.', cancel: 'Abbrechen' },
  en: { title: 'Loading the adventures', sub: 'Pictures and sounds are being loaded onto your device. This happens only once and takes a few minutes.', wifi: 'Loading is waiting for Wi-Fi.', failed: 'Loading reported a problem. It keeps trying.', later: 'Later', advTitle: 'Loading the adventure', advSub: 'Pictures and sounds are coming to your device. It only takes a moment.', cancel: 'Cancel' },
  es: { title: 'Cargando las aventuras', sub: 'Las imágenes y los sonidos se están cargando en tu dispositivo. Solo ocurre una vez y tarda unos minutos.', wifi: 'La carga espera a una red Wi-Fi.', failed: 'La carga ha informado de un problema. Sigue intentándolo.', later: 'Más tarde', advTitle: 'Cargando la aventura', advSub: 'Las imágenes y los sonidos llegan a tu dispositivo. Solo tarda un momento.', cancel: 'Cancelar' }
} as const
const text = () => TEXTS[(String(locale.value).slice(0, 2) as keyof typeof TEXTS) in TEXTS ? (String(locale.value).slice(0, 2) as keyof typeof TEXTS) : 'de']

async function check() {
  const s = await androidPackStatus()
  if (!s) return
  status.value = s.status
  percent.value = s.percent
  // the pack is there: start the app again, it then finds the media server
  if (s.status === 'ready') window.location.reload()
}

onMounted(() => {
  if (!missing.value) return
  void check()
  timer = setInterval(() => void check(), 2500)
})
onUnmounted(() => clearInterval(timer))
</script>

<template lang="pug">
  div(v-if="adventureWait.id" class="mpg" role="alertdialog" aria-live="polite" data-test="adventure-pack-gate")
    div(class="mpg-card")
      h2(class="mpg-title") {{ text().advTitle }}
      p(class="mpg-sub") {{ text().advSub }}
      div(class="mpg-bar" role="progressbar" :aria-valuenow="adventureWait.percent" aria-valuemin="0" aria-valuemax="100")
        div(class="mpg-fill" :style="{ width: Math.max(4, adventureWait.percent) + '%' }")
      p(class="mpg-pct") {{ adventureWait.percent }} %
      p(v-if="adventureWait.status === 'waiting_wifi'" class="mpg-note") {{ text().wifi }}
      p(v-else-if="adventureWait.status === 'failed' || adventureWait.status === 'error'" class="mpg-note") {{ text().failed }}
      button(type="button" class="lk-btn lk-btn--small lk-btn--outline mpg-later" @click="adventureWait.cancelled = true") {{ text().cancel }}
  div(v-else-if="missing && !later" class="mpg" role="alertdialog" aria-live="polite" data-test="media-pack-gate")
    div(class="mpg-card")
      h2(class="mpg-title") {{ text().title }}
      p(class="mpg-sub") {{ text().sub }}
      div(class="mpg-bar" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100")
        div(class="mpg-fill" :style="{ width: Math.max(4, percent) + '%' }")
      p(class="mpg-pct") {{ percent }} %
      p(v-if="status === 'waiting_wifi'" class="mpg-note") {{ text().wifi }}
      p(v-else-if="status === 'failed' || status === 'error'" class="mpg-note") {{ text().failed }}
      button(type="button" class="lk-btn lk-btn--small lk-btn--outline mpg-later" @click="later = true") {{ text().later }}
</template>

<style lang="sass">
.mpg
  position: fixed
  inset: 0
  z-index: 900
  display: flex
  align-items: center
  justify-content: center
  padding: 24px
  background: rgba(30, 26, 16, 0.55)
.mpg-card
  width: min(92vw, 420px)
  padding: 28px 24px
  border-radius: 24px
  background: #fffaf0
  text-align: center
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3)
.mpg-title
  font-size: 1.4rem
  font-weight: 800
  margin-bottom: 8px
.mpg-sub
  margin-bottom: 18px
  opacity: 0.8
.mpg-bar
  height: 14px
  border-radius: 7px
  background: #eadfc2
  overflow: hidden
.mpg-fill
  height: 100%
  border-radius: 7px
  background: linear-gradient(90deg, #ffe38a, #d4a83e)
  transition: width 0.6s ease
.mpg-pct
  margin-top: 8px
  font-weight: 700
.mpg-note
  margin-top: 8px
  font-size: 0.9rem
  opacity: 0.8
.mpg-later
  margin-top: 16px
</style>
