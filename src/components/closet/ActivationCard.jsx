import { Link } from 'react-router-dom'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { useClothingStore } from '../../store/useClothingStore'
import { useOutfitStore } from '../../store/useOutfitStore'
import { eligibleClothes, missingCategories } from '../../lib/outfitValidation'

export default function ActivationCard() {
  const clothes = useClothingStore(state => state.clothes)
  const outfits = useOutfitStore(state => state.outfits)
  const available = eligibleClothes(clothes)
  const missing = missingCategories(available)
  if (outfits.length) return null
  const labels = { superior: 'una prenda superior', inferior: 'una prenda inferior', calzado: 'un par de zapatos' }
  return <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-6" aria-label="Tu primer outfit">
    <div className="flex gap-3 items-center mb-3"><Sparkles className="w-5 h-5 text-primary" /><h2 className="font-semibold text-text">Tu primer outfit, con tu propia ropa</h2></div>
    <p className="text-sm text-text-secondary mb-4">{missing.length ? `Para empezar, agrega ${missing.map(category => labels[category]).join(', ')}. Usa una foto por prenda.` : 'Ya tienes lo necesario. Elige una ocasión y descubre tu primera combinación.'}</p>
    <ol className="flex flex-wrap gap-3 text-xs text-text-secondary mb-5">
      {[['Sube tu ropa', missing.length === 0], ['Elige una ocasión', false], ['Guarda tu outfit', false]].map(([label, complete], index) => <li key={label} className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border">{complete ? <Check className="w-4 h-4 text-success" /> : index + 1}</span>{label}</li>)}
    </ol>
    <Link to={missing.length ? '/closet/add' : '/outfit/generate'} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
      {missing.length ? 'Agregar mis prendas' : 'Crear mi primer outfit'}<ArrowRight className="w-4 h-4" />
    </Link>
  </section>
}
