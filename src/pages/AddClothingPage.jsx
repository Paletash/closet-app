import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import AddClothingForm from '../components/closet/AddClothingForm'

export default function AddClothingPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/closet" className="p-2 rounded-xl hover:bg-bg-alt transition-colors text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-text">Agregar prenda</h1>
      </div>
      <AddClothingForm />
    </div>
  )
}
