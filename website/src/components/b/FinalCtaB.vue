<template lang="pug">
  section.final-b
    .final-b-inner
      h2 Dein nächstes Vorlese-Buch.
      p {{ isPurchasable ? 'Klimaneutral bei Gelato gedruckt, in 5–8 Tagen bei dir.' : 'Diese Geschichte gibt es aktuell exklusiv in der SenfkornGeschichten-App.' }}
      a.cta(v-if="isPurchasable", :href="buyUrl", target="_blank", rel="noopener")
        | Jetzt bestellen — {{ priceLabel }}
        svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round")
          path(d="M3 7 H11 M8 4 L11 7 L8 10")
      a.cta.app-only(v-else, href="#app")
        svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
          rect(x="3", y="1.5", width="8", height="11", rx="1.5")
          circle(cx="7", cy="10", r="0.6", fill="currentColor", stroke="none")
        | Nur in der App verfügbar
      .micro(v-if="isPurchasable") Bezahlung &amp; Versand beim Händler
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookDTO } from '@/types/book'

const props = defineProps<{
  book: BookDTO | null
  buyUrl: string
}>()

const priceRaw = computed(() => (props.book?.websitePrice ?? '').trim())

const isPurchasable = computed(() => Boolean(priceRaw.value) && Boolean(props.buyUrl))

const priceLabel = computed(() => {
  if (!priceRaw.value) return ''
  return /[€$£]/.test(priceRaw.value) ? priceRaw.value : `${priceRaw.value} €`
})
</script>

<style scoped lang="scss">
.final-b {
  padding: 96px 20px 120px;
  text-align: center;
  background: radial-gradient(ellipse at 30% 50%, var(--coral-soft) 0%, transparent 55%),
  radial-gradient(ellipse at 70% 50%, var(--gold-soft) 0%, transparent 55%);
}

.final-b-inner {
  max-width: 640px;
  margin: 0 auto;
}

h2 {
  font-family: 'Nunito', serif;
  font-size: 44px;
  line-height: 1.05;
  font-weight: 500;
  letter-spacing: -0.025em;
  margin-bottom: 14px;
}

p {
  font-size: 17px;
  color: var(--ink-soft);
  margin-bottom: 32px;
}

.cta {
  background: var(--coral);
  color: #fff;
  padding: 18px 32px;
  border-radius: 999px;
  font-size: 17px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s, transform 0.15s;
  box-shadow: 0 8px 22px rgba(232, 115, 90, 0.32);

  &:hover:not(.disabled) {
    background: var(--coral-dark);
    transform: translateY(-1px);
  }

  &.app-only {
    background: var(--gold-soft);
    color: #7a5f1f;
    box-shadow: none;

    &:hover {
      background: #ecdcb8;
    }
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.micro {
  margin-top: 18px;
  font-size: 12.5px;
  color: var(--ink-ghost);
}

@media (max-width: 540px) {
  .final-b {
    padding: 64px 18px 96px;
  }
  h2 {
    font-size: 30px;
  }
  .cta {
    width: 100%;
    justify-content: center;
  }
}
</style>
