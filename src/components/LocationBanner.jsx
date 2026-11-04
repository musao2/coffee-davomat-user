import { useState } from 'react'
import { LuMapPinOff, LuMapPin, LuChevronDown } from 'react-icons/lu'
import { useLiveLocation } from '../context/LocationContext'

// Joylashuv o'chiq yoki ruxsat berilmagan bo'lsa — tepada doim ko'rinib turadi
export default function LocationBanner() {
  const { status, fix, restart } = useLiveLocation()
  const [help, setHelp] = useState(false)

  if (status === 'live') {
    const acc = Math.round(fix?.coords.accuracy || 0)
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-green-700 bg-green-50 border-b border-green-100 py-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
        </span>
        Joylashuv yoniq{acc ? ` · ±${acc} m` : ''}
      </div>
    )
  }
  if (status === 'starting') {
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 bg-slate-50 border-b border-slate-100 py-1">
        <LuMapPin size={12} /> Joylashuv aniqlanmoqda...
      </div>
    )
  }

  const text = {
    denied: "Joylashuvga ruxsat berilmagan",
    off: "Telefonda joylashuv (GPS) o'chiq",
    unsupported: "Bu brauzer joylashuvni bera olmaydi",
  }[status]

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <LuMapPinOff size={20} className="text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">{text}</p>
          <p className="text-xs text-red-700">Davomat qilish uchun joylashuv doim yoniq bo'lishi kerak.</p>
        </div>
        <button onClick={restart} className="btn-primary h-9 px-3 text-sm flex-shrink-0">Yoqish</button>
      </div>
      <button onClick={() => setHelp(!help)} className="mt-2 inline-flex items-center gap-1 text-xs text-red-700 underline cursor-pointer">
        Qanday yoqiladi? <LuChevronDown size={12} className={help ? 'rotate-180' : ''} />
      </button>
      {help && (
        <div className="mt-2 text-xs text-slate-700 bg-white border border-red-100 rounded-lg p-3 space-y-1.5">
          <p><b>1. Telefonda GPS:</b> ekranni tepadan pastga torting → «Joylashuv» (Location) ni yoqing.</p>
          <p><b>2. Android Chrome:</b> manzil qatoridagi belgini bosing → Ruxsatlar → Joylashuv → «Ruxsat berish». Keyin «Yoqish» tugmasini bosing.</p>
          <p><b>3. iPhone:</b> Sozlamalar → Maxfiylik → Joylashuv xizmatlari → yoqing → Safari (yoki Chrome) → «Ilovadan foydalanganda» va «Aniq joylashuv» yoqilgan bo'lsin.</p>
          {status === 'denied' && <p className="text-red-700">Ruxsat bekor qilingan bo'lsa, sozlamada yoqib, sahifani yangilang.</p>}
        </div>
      )}
    </div>
  )
}
