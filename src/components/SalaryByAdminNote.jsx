import { LuInfo } from 'react-icons/lu'

// Oyligi belgilanmagan xodimga: pulni admin hisoblab aytadi
export default function SalaryByAdminNote({ className = '' }) {
  return (
    <div className={`flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 ${className}`}>
      <LuInfo size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-slate-900">Ish haqingizni admin hisoblab aytadi</p>
        <p className="text-xs text-slate-600 mt-0.5">
          Bu yerda faqat ishlagan vaqtingiz ko'rinadi. Oylik summasi admin tomonidan hisoblanadi.
        </p>
      </div>
    </div>
  )
}
