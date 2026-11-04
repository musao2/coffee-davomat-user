import { useCallback, useState } from 'react'

// Kamera kattalashtirish: 0.5x (keng) va 1x.
// Telefon kamerasi "zoom"ni qo'llasa (ko'p Android) — haqiqiy 0.5x linzaga o'tadi.
// Qo'llamasa (iPhone, ko'p old kameralar) — 0.5x kadrni kesmasdan to'liq ko'rsatadi (kengroq ko'rinish).
export function useCameraZoom(trackRef) {
  const [zoom, setZoomState] = useState(1)
  const [hardware, setHardware] = useState(false)

  // Oqim (stream) ishga tushgach chaqiriladi
  const detect = useCallback(() => {
    const caps = trackRef.current?.getCapabilities?.() || {}
    setHardware(!!caps.zoom && caps.zoom.min < 1)
    setZoomState(1)
  }, [trackRef])

  const setZoom = useCallback(async (z) => {
    setZoomState(z)
    const track = trackRef.current
    const caps = track?.getCapabilities?.() || {}
    if (caps.zoom && caps.zoom.min < 1) {
      const value = z < 1 ? Math.max(caps.zoom.min, z) : Math.min(caps.zoom.max, Math.max(caps.zoom.min, 1))
      try { await track.applyConstraints({ advanced: [{ zoom: value }] }) } catch { /* qo'llamasa — e'tiborsiz */ }
    }
  }, [trackRef])

  // Apparat zoom bo'lmasa — 0.5x da kadr to'liq (kesilmasdan) ko'rinadi
  const fitClass = !hardware && zoom < 1 ? 'object-contain' : 'object-cover'

  return { zoom, setZoom, detect, fitClass, hardware }
}

export function ZoomButtons({ zoom, onChange, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1 bg-black/50 backdrop-blur rounded-full p-1 ${className}`}>
      {[0.5, 1].map(z => (
        <button
          key={z}
          type="button"
          onClick={() => onChange(z)}
          className={`h-10 min-w-12 px-3 rounded-full text-base font-semibold transition-colors cursor-pointer ${
            zoom === z ? 'bg-white text-black' : 'text-white hover:bg-white/15'
          }`}
          aria-label={`${z}x`}
        >
          {z === 0.5 ? '.5' : '1'}x
        </button>
      ))}
    </div>
  )
}
