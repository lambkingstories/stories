<template lang="pug">
  section.featured-b#buch
    .featured-b-inner(v-if="book")
      .featured-b-cover
        img(v-if="coverUrl", :src="coverUrl", :alt="title", loading="lazy")
        .featured-b-fallback(v-else) {{ title }}

      .featured-b-pitch
        .featured-b-eyebrow Das aktuelle Buch
        h2 {{ title }}
        .featured-b-tags
          span.tag(v-for="tag in tags", :key="tag") {{ tag }}
        p.featured-b-desc {{ description }}

        ul.featured-b-bullets
          li
            svg(viewBox="0 0 16 16", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              path(d="M3 8.5 L6.5 12 L13 5")
            | Hardcover, klimaneutral bei Gelato gedruckt
          li
            svg(viewBox="0 0 16 16", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              path(d="M3 8.5 L6.5 12 L13 5")
            | Lieferung in 5–8 Werktagen, EU-weit
          li
            svg(viewBox="0 0 16 16", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              path(d="M3 8.5 L6.5 12 L13 5")
            | Auch in der App zum Hören &amp; Ausmalen

        .featured-b-buy-row(v-if="isPurchasable")
          .price
            | {{ priceLabel }}
            small inkl. MwSt. &amp; Versand
          a.buy(:href="buyUrl", target="_blank", rel="noopener")
            | buy
            svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round")
              path(d="M3 7 H11 M8 4 L11 7 L8 10")

        a.featured-b-app-only(v-else, href="#app")
          svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
            rect(x="3", y="1.5", width="8", height="11", rx="1.5")
            circle(cx="7", cy="10", r="0.6", fill="currentColor", stroke="none")
          | Nur in der App verfügbar

        .featured-b-fineprint(v-if="isPurchasable")
          | Bezahlung &amp; Versand werden beim Händler abgewickelt.
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookDTO } from '@/types/book'
import { pickLocalizedImage } from '@/types/book'

const props = defineProps<{
  book: BookDTO | null
  buyUrl: string
}>()

const title = computed(() => props.book?.localizations?.de?.title ?? '')
const description = computed(() => props.book?.localizations?.de?.shortDescription ?? '')
const coverUrl = computed(() => pickLocalizedImage(props.book?.previewImage, 'de'))

const tags = computed<string[]>(() => {
  const websiteTags = Array.isArray(props.book?.websiteTags) ? props.book!.websiteTags! : []
  return [...websiteTags, 'Hardcover']
})

const isPurchasable = computed(
  () => Boolean((props.book?.websitePrice ?? '').trim()) && Boolean(props.buyUrl)
)

const priceLabel = computed(() => {
  const raw = (props.book?.websitePrice ?? '').trim()
  if (!raw) return 'Preis auf Anfrage'
  return /[€$£]/.test(raw) ? raw : `${raw} €`
})
</script>

<style scoped lang="scss">
.featured-b {
  padding: 88px 20px;
  background: var(--cream);
}

.featured-b-inner {
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 56px;
  align-items: center;
}

.featured-b-cover {
  width: 100%;
  max-width: 320px;
  aspect-ratio: 3 / 4;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(26, 31, 58, 0.18),
  0 24px 60px rgba(26, 31, 58, 0.18);
  background: var(--cream-dark);
  margin: 0 auto;
  transform: rotate(-2deg);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.featured-b-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Nunito', serif;
  font-size: 22px;
  color: var(--ink-soft);
  padding: 24px;
  text-align: center;
}

.featured-b-eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: var(--coral);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

h2 {
  font-family: 'Nunito', serif;
  font-size: 34px;
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
}

.featured-b-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;

  .tag {
    background: var(--paper);
    border: 1px solid var(--line);
    color: var(--ink-soft);
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
  }
}

.featured-b-desc {
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink-soft);
  margin-bottom: 22px;
}

.featured-b-bullets {
  list-style: none;
  padding: 0;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14.5px;
    color: var(--ink);
  }

  svg {
    width: 16px;
    height: 16px;
    color: var(--sage);
    flex-shrink: 0;
  }
}

.featured-b-buy-row {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.price {
  font-family: 'Nunito', serif;
  font-size: 28px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1;

  small {
    display: block;
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    color: var(--ink-soft);
    font-weight: 500;
    margin-top: 4px;
  }
}

.buy {
  background: var(--coral);
  color: #fff;
  padding: 14px 26px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s, transform 0.15s;
  box-shadow: 0 6px 18px rgba(232, 115, 90, 0.32);

  &:hover {
    background: var(--coral-dark);
    transform: translateY(-1px);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.featured-b-app-only {
  margin-top: 22px;
  padding: 14px 22px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--gold-soft);
  color: #7a5f1f;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  align-self: flex-start;
  transition: background 0.15s;

  &:hover {
    background: #ecdcb8;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.featured-b-fineprint {
  margin-top: 14px;
  font-size: 12px;
  color: var(--ink-ghost);
  width: 100%;
}

@media (max-width: 760px) {
  .featured-b {
    padding: 56px 18px;
  }
  .featured-b-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  h2 {
    font-size: 26px;
  }
  .featured-b-cover {
    max-width: 240px;
  }
}
</style>
