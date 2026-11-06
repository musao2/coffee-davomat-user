import { supabase } from './supabase'

// ─── Sotuv bonusi (025_sales.sql) ─────────────────────────────────────────────

const missing = (error) => error?.code === 'PGRST202' || (error?.message || '').includes('Could not find the function')

// Bugungi holat: sotuv yoqilganmi, mahsulotlar, bugun tasdiqlanganmi
// { enabled, mode, percent, day, checked_in, products: [{id, name, unit_pay}], report }
export async function getMySalesStatus() {
  const { data, error } = await supabase.rpc('my_sales_status')
  if (error) {
    if (missing(error)) return { enabled: false }
    throw error
  }
  return data || { enabled: false }
}

// Bugungi sotuvni yozib tasdiqlash
export async function submitSalesReport({ items = [], salesTotal = 0, note = null }) {
  const { data, error } = await supabase.rpc('submit_sales_report', {
    p_items: items, p_sales_total: Number(salesTotal) || 0, p_note: note,
  })
  if (error) throw error
  return data
}

// Bonusni oldindan ko'rsatish uchun (haqiqiy hisob serverda)
export function previewBonus(status, qty, salesTotal) {
  if (status?.mode === 'percent') return Math.round((Number(salesTotal) || 0) * (Number(status.percent) || 0) / 100)
  return (status?.products || []).reduce((s, p) => s + (Number(qty[p.id]) || 0) * (Number(p.unit_pay) || 0), 0)
}

export const salesSummary = (r) => r?.mode === 'percent'
  ? `Sotuv summasi: ${Number(r.sales_total).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`
  : (r?.items || []).map(i => `${i.name} — ${i.qty} ta`).join(', ') || "Bugun sotuv yo'q"
