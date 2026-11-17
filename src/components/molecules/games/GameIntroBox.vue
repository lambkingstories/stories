<script setup lang="ts">
/**
 * The head of the menu of a big game, the same in all games: the title once, the Bible reference once and ONE box with what the game is
 * about and the task (nothing is said twice). It keeps the head short on a phone held upright, so that the levels begin on the first screen.
 */
withDefaults(
  defineProps<{
    /** The name of the game (one heading). */
    title: string
    /** The Bible place under the title (leave out when the box shows it). */
    sub?: string
    /** The small label over the text ("Worum es geht"). */
    label: string
    /** What the game is about (one or two short sentences). */
    story?: string
    /** The Bible place of the story, small, under the text. */
    storyRef?: string
    /** The task, with its label ("Deine Aufgabe: …"). */
    task?: string
    /** `data-test` of the box. */
    testId?: string
  }>(),
  { sub: '', story: '', storyRef: '', task: '', testId: 'game-intro' }
)
</script>

<template lang="pug">
  div(class="gib")
    h1(class="gib-title") {{ title }}
    p(v-if="sub" class="gib-sub") {{ sub }}
    div(class="gib-box" :data-test="testId")
      span(class="gib-label") {{ label }}
      p(v-if="story" class="gib-story") {{ story }}
      span(v-if="storyRef" class="gib-ref") {{ storyRef }}
      p(v-if="task" class="gib-task" :class="{ 'gib-task--alone': !story }") {{ task }}
</template>

<style scoped lang="sass">
.gib
  width: 100%
  display: flex
  flex-direction: column
  align-items: stretch
  gap: 6px
  text-align: center

.gib-title
  margin: 0
  font-size: 1.5rem
  font-weight: 800
  line-height: 1.15

.gib-sub
  margin: 0
  font-size: 0.95rem
  font-weight: 700
  color: var(--lk-muted, #7a6b4f)

// the one box: what the game is about and the task
.gib-box
  display: flex
  flex-direction: column
  gap: 3px
  padding: 9px 14px 10px
  border-radius: 16px
  border: 2px solid #d9a93a
  background: linear-gradient(180deg, #fff6d9, #fbeab8)
  text-align: left

.gib-label
  font-size: 0.72rem
  font-weight: 800
  letter-spacing: 0.08em
  text-transform: uppercase
  color: #8a5a12

.gib-story
  margin: 0
  font-size: 1rem
  line-height: 1.3
  color: #3a2c12

.gib-ref
  font-size: 0.75rem
  font-weight: 700
  font-style: italic
  color: #8a5a12

.gib-task
  margin: 2px 0 0
  padding-top: 5px
  border-top: 1px dashed #d9a93a
  font-size: 1rem
  font-weight: 800
  line-height: 1.25
  color: #2a2418

  &--alone
    margin: 0
    padding-top: 0
    border-top: 0

// a small phone held upright (and a short window): the head gets even smaller
@media (max-width: 360px), (max-height: 640px)
  .gib-title
    font-size: 1.3rem

  .gib-box
    padding: 7px 12px 8px

  .gib-story,
  .gib-task
    font-size: 0.92rem

// the phone on its side: very little height
@media (max-height: 450px)
  .gib
    gap: 4px

  .gib-title
    font-size: 1.2rem

  .gib-box
    padding: 6px 12px 7px

  // no room for the small label on a phone on its side: the box says the same without it
  .gib-label
    display: none

  .gib-story,
  .gib-task
    font-size: 0.9rem
    line-height: 1.25
</style>
