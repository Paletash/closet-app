import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import Button from '../ui/Button'

export default function AccountDataPanel() {
  const { user, profile, signOut } = useAuthStore()
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const deletionEnabled = import.meta.env.VITE_ACCOUNT_DELETION_ENABLED === 'true'
  const exportData = async () => {
    if (busy) return
    setBusy(true)
    try {
      const exported = { exportado_en: new Date().toISOString(), perfil: profile, nota: 'Incluye datos y referencias de fotos; los archivos de imagen no se incluyen.' }
      for (const table of ['prendas', 'outfits', 'historial_usos', 'viajes', 'looks_del_dia', 'wishlist']) {
        const selection = table === 'outfits' ? '*,outfit_prendas(prenda_id)' : table === 'viajes' ? '*,viaje_prendas(prenda_id,empacado)' : '*'
        const rows = []
        for (let from = 0; ; from += 500) {
          const { data, error } = await supabase.from(table).select(selection).eq('user_id', user.id).order('id').range(from, from + 499)
          if (error) throw error
          rows.push(...data)
          if (data.length < 500) break
        }
        exported[table] = rows
      }
      if (useAuthStore.getState().user?.id !== user.id) return
      const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = 'outfitme-mis-datos.json'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { toast.error('No se pudo exportar. Inténtalo de nuevo.') }
    finally { setBusy(false) }
  }
  const deleteAccount = async () => {
    if (busy || !deletionEnabled || confirmation !== 'ELIMINAR') return
    setBusy(true)
    try {
      const { data, error } = await supabase.functions.invoke('eliminar-cuenta', { body: { confirmacion: confirmation }, timeout: 120000 })
      if (error || !data?.success) throw new Error('No se pudo completar la eliminación.')
      await signOut()
      window.location.assign('/login')
    } catch { toast.error('No se completó la eliminación. Puede haberse eliminado parte de tus fotos; vuelve a intentarlo para completar el proceso.') }
    finally { setBusy(false) }
  }
  return <section className="mt-6 rounded-2xl border border-border bg-surface p-5 space-y-4">
    <h2 className="font-semibold text-text">Tu cuenta y tus datos</h2>
    <p className="text-sm text-text-secondary">Descarga tus registros, preferencias y referencias de fotos. <Link to="/privacy" className="text-primary underline">Cómo se usan tus datos</Link></p>
    <Button variant="secondary" onClick={exportData} disabled={busy}>Descargar mis datos</Button>
    <div className="border-t border-border pt-4">
      <button onClick={() => setExpanded(!expanded)} disabled={busy || !deletionEnabled} className="text-sm text-error underline disabled:opacity-50">Eliminar mi cuenta</button>
      {!deletionEnabled && <p className="mt-2 text-xs text-text-muted">La eliminación de cuenta aún no está habilitada. Consulta el contacto de privacidad para solicitarla.</p>}
      {expanded && <div className="space-y-3 mt-3">
        <p className="text-sm text-text-secondary">Se eliminarán permanentemente tu cuenta, prendas, fotos, outfits y registros. Esta acción no se puede deshacer. Descarga tus datos antes si quieres conservarlos.</p>
        <label className="block text-sm text-text">Escribe ELIMINAR para confirmar
          <input value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" className="block mt-2 w-full p-3 bg-bg border border-border rounded-xl" />
        </label>
        <Button variant="danger" onClick={deleteAccount} loading={busy} disabled={confirmation !== 'ELIMINAR'}>Eliminar permanentemente</Button>
      </div>}
    </div>
  </section>
}
