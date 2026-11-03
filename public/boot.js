// Runs before the app is loaded: puts the day or night look on the page, so that the first picture already has the right colour.
try {
  var v = localStorage.getItem('lk-theme')
  var night = v === 'night' || (v === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', night ? 'night' : 'day')
  var p = localStorage.getItem('lk-palette')
  document.documentElement.setAttribute('data-palette', p === 'beige' || p === 'creme' ? p : 'mint')
} catch (e) { /* private window: the day look stays */ }
