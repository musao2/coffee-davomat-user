import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Ilova ochilishi bilan joylashuv doim "jonli" kuzatiladi (watchPosition).
// Davomat paytida GPS allaqachon isigan bo'ladi — aniqroq va tezroq natija.
//
// status: 'starting' | 'live' | 'denied' | 'off' | 'unsupported'

const FRESH_MS = 20000 // shu vaqt ichidagi o'lchovlar "yangi" hisoblanadi

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [status, setStatus] = useState('starting')
  const [fix, setFix] = useState(null) // eng so'nggi o'lchov
  const watchRef = useRef(null)
  const historyRef = useRef([])        // so'nggi o'lchovlar (eng aniqini tanlash uchun)
  const waitersRef = useRef(new Set())

  const stop = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current)
    watchRef.current = null
  }, [])

  const start = useCallback(() => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    stop()
    setStatus(s => (s === 'live' ? s : 'starting'))
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        historyRef.current = [...historyRef.current.filter(p => now - p.at < FRESH_MS), { pos, at: now }]
        setFix(pos)
        setStatus('live')
        waitersRef.current.forEach(w => w())
      },
      (err) => {
        // 1 — ruxsat berilmagan, 2 — GPS o'chiq/topilmadi, 3 — vaqt tugadi (qayta urinadi)
        if (err.code === 1) { setStatus('denied'); stop() }
        else if (err.code === 2) setStatus('off')
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    )
  }, [stop])

  useEffect(() => {
    start()
    // Ruxsat o'zgarsa (sozlamadan yoqilsa) — qayta boshlaymiz
    let perm
    navigator.permissions?.query({ name: 'geolocation' }).then(p => {
      perm = p
      p.onchange = () => { if (p.state !== 'denied') start(); else setStatus('denied') }
    }).catch(() => {})
    // Telefon fon rejimidan qaytganda brauzer kuzatishni to'xtatgan bo'ladi
    const onVisible = () => { if (document.visibilityState === 'visible') start() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisible)
      if (perm) perm.onchange = null
    }
  }, [start, stop])

  // Davomat uchun eng aniq yangi o'lchovni beradi: kerakli aniqlikka yetguncha
  // yoki maxWaitMs tugaguncha kutadi
  const getFix = useCallback(({ maxWaitMs = 10000, goodEnoughM = 20 } = {}) => {
    return new Promise((resolve, reject) => {
      if (status === 'unsupported') return reject({ code: 'LOCATION_UNAVAILABLE' })
      if (status === 'denied') return reject({ code: 'LOCATION_DENIED' })
      if (watchRef.current == null) start()

      const pickBest = () => {
        const now = Date.now()
        const fresh = historyRef.current.filter(p => now - p.at < FRESH_MS)
        return fresh.reduce((b, p) => (!b || p.pos.coords.accuracy < b.coords.accuracy ? p.pos : b), null)
      }
      const best = pickBest()
      if (best && best.coords.accuracy <= goodEnoughM) return resolve(best)

      let timer
      const check = () => {
        const b = pickBest()
        if (b && b.coords.accuracy <= goodEnoughM) done(b)
      }
      const done = (b) => {
        waitersRef.current.delete(check)
        clearTimeout(timer)
        if (b) resolve(b)
        else reject({ code: 'LOCATION_UNAVAILABLE' })
      }
      waitersRef.current.add(check)
      timer = setTimeout(() => done(pickBest()), maxWaitMs)
    })
  }, [status, start])

  return (
    <LocationContext.Provider value={{ status, fix, getFix, restart: start }}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLiveLocation = () => useContext(LocationContext)
