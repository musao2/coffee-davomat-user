import { useState } from 'react'
import { LuShoppingBag, LuMinus, LuPlus, LuCircleAlert, LuCircleCheck } from 'react-icons/lu'
import { formatMoney } from '../lib/supabase'
import { submitSalesReport, previewBonus } from '../lib/sales'

/**
 * Ishdan ketishdan oldin: bugun nima sotdingiz? → Tasdiqlash.
 * status — my_sales_status() natijasi. Avval tasdiqlangan bo'lsa — qiymatlar to'ldirilgan holda ochiladi.
 */
export default function SalesReportForm({ status, onDone, onCancel, title = 'Bugun nima sotdingiz?' }) {
  const prev = status.report
  const [qty, setQty] = useState(() => Object.fromEntries(
    (prev?.items || []).map(i => [i.product_id, String(i.qty)])
  ))
  const [total, setTotal] = useState(prev?.mode === 'percent' && Number(prev.sales_total) ? String(Number(prev.sales_total)) : '')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const perItem = status.mode === 'per_item'
  const bonus = previewBonus(status, qty, total)
  const nothing = perItem ? !Object.values(qty).some(v => Number(v) > 0) : !(Number(total) > 0)

  const step = (id, d) => setQty(q => ({ ...q, [id]: String(Math.max(0, (Number(q[id]) || 0) + d)) }))

  const submit = async () => {
    setError('')
    if (!confirmed) return setError("Pastdagi «To'g'ri yozdim» belgisini qo'ying")
    setBusy(true)
    try {
      const report = await submitSalesReport(perItem
        ? { items: status.products.map(p => ({ product_id: p.id, qty: Number(qty[p.id]) || 0 })) }
        : { salesTotal: Number(total) || 0 })
      onDone(report)
    } catch (e) {
      setError(e.message?.includes('SALES_DISABLED') ? "Admin sizga sotuvni o'chirib qo'ygan" : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full text-left space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
          <LuShoppingBag size={30} />
        </div>
        <p className="text-xl font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">Ishdan ketishdan oldin bugungi sotuvingizni yozib tasdiqlang.</p>
      </div>

      {perItem ? (
        status.products.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            Admin hali mahsulotlarni kiritmagan. Pastdagi tugma bilan «sotuv yo'q» deb tasdiqlang va adminga ayting.
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {status.products.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">1 tasi uchun {formatMoney(p.unit_pay)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => step(p.id, -1)} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 active:bg-slate-100" aria-label="Kamaytirish">
                    <LuMinus size={16} />
                  </button>
                  <input
                    type="number" inputMode="numeric" min="0"
                    value={qty[p.id] ?? ''}
                    onChange={e => setQty(q => ({ ...q, [p.id]: e.target.value }))}
                    className="input-field w-16 text-center px-1"
                    placeholder="0"
                  />
                  <button type="button" onClick={() => step(p.id, 1)} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 active:bg-slate-100" aria-label="Ko'paytirish">
                    <LuPlus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <label className="label">Bugun jami qancha sotdingiz? (so'm)</label>
          <input
            type="number" inputMode="numeric" min="0"
            value={total}
            onChange={e => setTotal(e.target.value)}
            className="input-field text-lg"
            placeholder="Masalan: 2500000"
          />
          <p className="text-xs text-slate-500 mt-1">Sizga sotuvdan {Number(status.percent)}% bonus beriladi.</p>
        </div>
      )}

      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
        <span className="text-sm text-slate-700">Bugungi bonusingiz</span>
        <span className="text-lg font-bold text-emerald-700">+{formatMoney(bonus)}</span>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="w-5 h-5 mt-0.5 accent-[#FCA914]" />
        <span className="text-sm text-slate-700">
          To'g'ri yozdim. {nothing ? "Bugun hech narsa sotmadim." : 'Admin tekshirishi mumkinligini bilaman.'}
        </span>
      </label>

      {error && (
        <p className="text-sm text-red-600 flex gap-1.5"><LuCircleAlert size={16} className="flex-shrink-0 mt-0.5" /> {error}</p>
      )}

      <button onClick={submit} disabled={busy} className="btn-primary w-full h-12">
        <LuCircleCheck size={18} /> {busy ? 'Saqlanmoqda...' : 'Tasdiqlash'}
      </button>
      {onCancel && (
        <button onClick={onCancel} disabled={busy} className="btn-secondary w-full">Orqaga</button>
      )}
    </div>
  )
}
