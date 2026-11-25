import { isSplitPath, MEDIA_SPLIT_ON, splitUrl } from '@/utils/mediaSplit'

export const isProduction = import.meta.env.VITE_NODE_ENV === 'production'
export const isWeb = import.meta.env.VITE_PLATTFORM === 'web'

// Vite always defines `BASE_URL` for the active build target and always
// normalises it with a trailing slash: '/' for `pnpm dev` and the Tauri
// build, '/little-bible-stories/' for GH-Pages main, './' for the Electron
// renderer. It is the only input this helper needs.
//
// It deliberately does NOT key off `isProduction` any more: `.env*` is
// gitignored, so `VITE_NODE_ENV` is undefined inside the Pages workflow and
// esbuild folded the old ternary down to an identity function. Every path
// then stayed relative and was resolved against whatever context consumed it
// — the route URL for `<img src>`/inline styles, and the chunk stylesheet in
// `/assets/` for `url()` values handed to CSS custom properties, which is
// where `/little-bible-stories/assets/images/bg/…` 404s came from.
const baseURL = import.meta.env.BASE_URL || '/'

/**
 * The path in the app of a media file that is addressed on this device: the Android media server (`http://127.0.0.1:<port>/images/...`) or the iOS asset protocol
 * (`asset://...%2Fimages%2F...`), e.g. `/images/abenteuer/x/y.webp`. `null` for every other address. Such addresses change (the port; on iOS the folder of the
 * app with every update), so nothing that is kept may hold one (see `pageArtworkId`).
 */
export const localMediaPath = (url: string): string | null => {
  if (!/^(asset:|https?:\/\/(asset\.localhost|127\.0\.0\.1)[:/])/i.test(url)) return null
  let full = url
  try {
    full = decodeURIComponent(url)
  } catch {
    // not encoded: used as it is
  }
  const at = full.search(/\/(images|audio)\//)
  return at >= 0 ? full.slice(at).split(/[?#]/)[0]! : null
}

/**
 * The address of a file of the app. It may be called twice on the same value (a page hands a finished address to a component that calls it again): an address
 * with a scheme stays as it is, and an address of a media file on this device is built anew from its path. (Found on Anton's phone, 25.11.2026: the collection
 * card of "Das Volk in der Wüste" showed no picture, because the finished address of the media server was prefixed a second time.)
 */
export const prependBaseUrl = (url: string): string => {
  const local = localMediaPath(url)
  if (!local && /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return url
  const path = (local ?? url).replace(/^\/+/, '')
  // the media of an adventure that lies outside the program file (only in a build with `VITE_MEDIA_SPLIT`, see `mediaSplit.ts`)
  if (MEDIA_SPLIT_ON && isSplitPath(path)) {
    const away = splitUrl(path)
    if (away) return away
  }
  return `${baseURL}${path}`
}
export const repeat = (n: number, callback: (_: any, i: number) => string): string[] => [...new Array(n)].map(callback)
export const repeatPages = (n: number, callback: (_: any, i: number) => any): any[] => [...new Array(n)].map(callback)

export const mergeObjectsRecursive = (obj1: any, obj2: any) => {
  ;[...Object.keys(obj2)].forEach(key => {
    try {
      if (obj2[key].constructor == Object) {
        obj1[key] = mergeObjectsRecursive(obj1[key], obj2[key])
      } else {
        obj1[key] = obj2[key]
      }
    } catch (e) {
      // Property in destination object not set; create it and set its value.
      obj1[key] = obj2[key]
    }
  })

  return obj1
}

export const mobileCheck = () => {
  let check = false;
  (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
  })(navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '')
  return check
}