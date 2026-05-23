import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useOutfitStore } from '../store/useOutfitStore'
import { useCalendarStore } from '../store/useCalendarStore'
import { CalendarDays, ChevronLeft, ChevronRight, Shirt, Sparkles, Check, X, Plus } from 'lucide-react'
import { CATEGORIAS, OCASIONES } from '../utils/categories'
import { formatDate } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { toast } from '../components/ui/Toast'

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0 ... Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const days = []

  // Leading blanks
  for (let i = 0; i < startDow; i++) {
    days.push(null)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  return days
}

function toISODate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const { outfits, fetchOutfits } = useOutfitStore()
  const { entries, loading, fetchEntries, logUsage, removeUsage } = useCalendarStore()

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetchEntries(user.id, year, month)
      fetchOutfits(user.id)
    }
  }, [user?.id, year, month, fetchEntries, fetchOutfits])

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month])

  // Map date string -> entries for quick lookup
  const entriesByDate = useMemo(() => {
    const map = {}
    for (const entry of entries) {
      if (!map[entry.fecha]) map[entry.fecha] = []
      map[entry.fecha].push(entry)
    }
    return map
  }, [entries])

  const todayStr = toISODate(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
    setSelectedDay(null)
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
    setSelectedDay(null)
  }

  const goToToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
    setSelectedDay(today.getDate())
  }

  const selectedDateStr = selectedDay ? toISODate(year, month, selectedDay) : null
  const selectedEntries = selectedDateStr ? (entriesByDate[selectedDateStr] || []) : []

  const handleLogOutfit = async (outfitId) => {
    if (!user?.id || !selectedDateStr) return
    setSaving(true)
    const res = await logUsage(user.id, outfitId, selectedDateStr)
    if (res?.error) {
      toast.error(res.error.message || 'Error al registrar')
    } else {
      toast.success('¡Outfit registrado!')
    }
    setSaving(false)
    setShowPicker(false)
  }

  const handleRemoveUsage = async (entryId) => {
    if (!user?.id) return
    const res = await removeUsage(entryId, user.id, year, month)
    if (res?.error) toast.error('Error al eliminar')
    else toast.success('Registro eliminado')
  }

  // Outfits not yet logged on the selected date
  const availableOutfits = useMemo(() => {
    const loggedIds = new Set(selectedEntries.map((e) => e.outfit_id))
    return outfits.filter((o) => !loggedIds.has(o.id))
  }, [outfits, selectedEntries])

  // Stats for the month
  const monthStats = useMemo(() => {
    const uniqueDays = new Set(entries.map((e) => e.fecha)).size
    const uniqueOutfits = new Set(entries.map((e) => e.outfit_id)).size
    return { totalUses: entries.length, uniqueDays, uniqueOutfits }
  }, [entries])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Calendario
          </h1>
          <p className="text-sm text-text-muted mt-1">Registra lo que usas cada día</p>
        </div>
        <button
          onClick={goToToday}
          className="text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          Hoy
        </button>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        {[
          { label: 'Usos', value: monthStats.totalUses, color: 'bg-primary/8 text-primary' },
          { label: 'Días', value: monthStats.uniqueDays, color: 'bg-accent-light text-accent' },
          { label: 'Outfits', value: monthStats.uniqueOutfits, color: 'bg-success-light text-success' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-2xl border border-border p-3 text-center">
            <div className={`text-xl font-bold ${color.split(' ')[1]}`}>{value}</div>
            <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">{label} este mes</div>
          </div>
        ))}
      </div>

      {/* Calendar Card */}
      <div className="bg-surface rounded-2xl border border-border p-5 mb-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-bg-alt transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-lg font-bold text-text">
            {MONTHS_ES[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-bg-alt transition-colors cursor-pointer">
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_ES.map((day) => (
            <div key={day} className="text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading && entries.length === 0 ? (
          <div className="py-12"><LoadingSpinner text="Cargando calendario..." /></div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="aspect-square" />
              }

              const dateStr = toISODate(year, month, day)
              const isToday = dateStr === todayStr
              const isSelected = day === selectedDay
              const dayEntries = entriesByDate[dateStr] || []
              const hasEntries = dayEntries.length > 0
              const isFuture = new Date(dateStr) > today

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  disabled={isFuture}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center relative
                    text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-alt active:scale-95'}
                    ${isSelected
                      ? 'bg-primary text-white shadow-md scale-105'
                      : isToday
                        ? 'bg-primary/10 text-primary font-bold ring-2 ring-primary/30'
                        : 'text-text'
                    }
                  `}
                >
                  <span className="text-xs md:text-sm">{day}</span>
                  {hasEntries && !isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEntries.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-primary' : 'bg-accent'}`} />
                      ))}
                    </div>
                  )}
                  {hasEntries && isSelected && (
                    <Check className="w-3 h-3 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">
              {selectedDay} de {MONTHS_ES[month - 1]}
            </h3>
            <Button
              onClick={() => setShowPicker(true)}
              icon={Plus}
              size="sm"
              disabled={availableOutfits.length === 0}
            >
              Registrar outfit
            </Button>
          </div>

          {selectedEntries.length > 0 ? (
            <div className="space-y-3 stagger-children">
              {selectedEntries.map((entry) => {
                const outfit = entry.outfit
                if (!outfit) return null
                const ocasionObj = OCASIONES.find((o) => o.value === outfit.ocasion)

                return (
                  <div key={entry.id} className="bg-surface rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {ocasionObj && (
                          <span className="px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-medium">
                            {ocasionObj.icon} {ocasionObj.label}
                          </span>
                        )}
                        {outfit.generado_por_ia && (
                          <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" /> IA
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveUsage(entry.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error-light transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                      {(outfit.prendas || []).slice(0, 5).map((prenda) => (
                        <div key={prenda.id} className="aspect-square rounded-xl overflow-hidden bg-bg-alt border border-border">
                          <img
                            src={prenda.foto_url}
                            alt={prenda.subcategoria || CATEGORIAS[prenda.categoria]?.label}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border border-dashed p-8 text-center">
              <Shirt className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">No registraste ningún outfit este día</p>
              <button
                onClick={() => setShowPicker(true)}
                className="text-sm text-primary font-medium hover:underline mt-2 cursor-pointer"
                disabled={availableOutfits.length === 0}
              >
                Registrar uno →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Outfit Picker Modal */}
      <Modal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title={`Registrar outfit — ${selectedDay} de ${MONTHS_ES[month - 1]}`}
        size="lg"
      >
        {availableOutfits.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {availableOutfits.map((outfit) => {
              const ocasionObj = OCASIONES.find((o) => o.value === outfit.ocasion)
              return (
                <button
                  key={outfit.id}
                  onClick={() => handleLogOutfit(outfit.id)}
                  disabled={saving}
                  className="w-full text-left bg-bg rounded-2xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {ocasionObj && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary text-[10px] font-medium">
                          {ocasionObj.icon} {ocasionObj.label}
                        </span>
                      )}
                      {outfit.generado_por_ia && (
                        <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> IA
                        </span>
                      )}
                      <span className="text-[10px] text-text-muted">
                        {formatDate(outfit.creado_en)}
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {(outfit.prendas || []).slice(0, 4).map((prenda) => (
                      <div key={prenda.id} className="aspect-square rounded-lg overflow-hidden bg-bg-alt border border-border">
                        <img
                          src={prenda.foto_url}
                          alt={prenda.subcategoria}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Sin outfits disponibles"
            description="Genera y guarda outfits primero para poder registrarlos en el calendario."
            actionLabel="Generar outfit"
            onAction={() => { setShowPicker(false); window.location.href = '/outfit/generate' }}
          />
        )}
      </Modal>
    </div>
  )
}
