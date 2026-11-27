/**
 * Gets a file out of the app. The web views of the phone ignore `<a download>` (the tap does nothing; Anton, 27.11.2026), so there
 * the share sheet is used ("In Dateien sichern", print, send). A computer browser downloads the file.
 */
export async function loadFile(url: string, name: string, type: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return new File([await res.blob()], name, { type })
}

export type Delivery = 'shared' | 'cancelled' | 'downloaded' | 'failed'

export async function deliverFile(file: File, native: boolean = import.meta.env.VITE_APP_NATIVE === 'true'): Promise<Delivery> {
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      if ((error as Error).name === 'AbortError') return 'cancelled'
      console.warn('[file] sharing did not work', error)
      if (native) return 'failed'
    }
  } else if (native) {
    return 'failed'
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
