import { PantsIcon, JacketIcon } from '../components/ui/ClothingIcons'
import { 
  Shirt, 
  Footprints, 
  Glasses, 
  Smile, 
  Briefcase, 
  PartyPopper, 
  Heart, 
  Flame,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  Infinity as InfinityIcon,
  Compass,
  Activity
} from 'lucide-react'

export const CATEGORIAS = {
  superior: { 
    label: 'Superior', 
    icon: <Shirt className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  inferior: { 
    label: 'Inferior', 
    icon: <PantsIcon className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  calzado: { 
    label: 'Calzado', 
    icon: <Footprints className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  chamarra: { 
    label: 'Chamarra', 
    icon: <JacketIcon className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  accesorio: { 
    label: 'Accesorio', 
    icon: <Glasses className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
}

export const SUBCATEGORIAS = {
  superior: ['Playera', 'Camisa', 'Polo', 'Blusa', 'Hoodie', 'Tank top'],
  inferior: ['Pantalón', 'Jeans', 'Jogger', 'Short', 'Falda', 'Bermuda'],
  calzado: ['Tenis', 'Zapatos', 'Botas', 'Sandalias', 'Mocasines'],
  chamarra: ['Chamarra', 'Abrigo', 'Chaleco', 'Blazer', 'Sudadera', 'Sueter'],
  accesorio: ['Gorra', 'Reloj', 'Lentes', 'Bufanda', 'Cinturón', 'Bolsa', 'Mochila'],
}

export const ESTILOS = [
  { 
    value: 'casual', 
    label: 'Casual', 
    icon: <Smile className="w-4.5 h-4.5 inline-block mr-1.5 align-text-bottom shrink-0 text-primary" /> 
  },
  { 
    value: 'formal', 
    label: 'Formal', 
    icon: <Briefcase className="w-4.5 h-4.5 inline-block mr-1.5 align-text-bottom shrink-0 text-primary" /> 
  },
  { 
    value: 'urbano', 
    label: 'Urbano', 
    icon: <Compass className="w-4.5 h-4.5 inline-block mr-1.5 align-text-bottom shrink-0 text-primary" /> 
  },
  { 
    value: 'deportivo', 
    label: 'Deportivo', 
    icon: <Activity className="w-4.5 h-4.5 inline-block mr-1.5 align-text-bottom shrink-0 text-primary" /> 
  },
]

export const TEMPORADAS = [
  { 
    value: 'primavera', 
    label: 'Primavera', 
    icon: <Flower2 className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-accent" /> 
  },
  { 
    value: 'verano', 
    label: 'Verano', 
    icon: <Sun className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-accent" /> 
  },
  { 
    value: 'otoño', 
    label: 'Otoño', 
    icon: <Leaf className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-accent" /> 
  },
  { 
    value: 'invierno', 
    label: 'Invierno', 
    icon: <Snowflake className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-accent" /> 
  },
  { 
    value: 'todas', 
    label: 'Todas', 
    icon: <InfinityIcon className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-accent" /> 
  },
]

export const OCASIONES = [
  { 
    value: 'casual', 
    label: 'Casual', 
    icon: <Smile className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  { 
    value: 'trabajo', 
    label: 'Trabajo', 
    icon: <Briefcase className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  { 
    value: 'fiesta', 
    label: 'Fiesta', 
    icon: <PartyPopper className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0" /> 
  },
  { 
    value: 'cita', 
    label: 'Cita', 
    icon: <Heart className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-error" /> 
  },
  { 
    value: 'deporte', 
    label: 'Deporte', 
    icon: <Flame className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-warning" /> 
  },
]

export const COLORES = [
  { value: 'negro', label: 'Negro', hex: '#1a1a1a' },
  { value: 'blanco', label: 'Blanco', hex: '#f5f5f5' },
  { value: 'gris', label: 'Gris', hex: '#9ca3af' },
  { value: 'beige', label: 'Beige', hex: '#d4b896' },
  { value: 'azul', label: 'Azul', hex: '#3b82f6' },
  { value: 'azul_marino', label: 'Azul Marino', hex: '#1e3a5f' },
  { value: 'rojo', label: 'Rojo', hex: '#ef4444' },
  { value: 'verde', label: 'Verde', hex: '#22c55e' },
  { value: 'amarillo', label: 'Amarillo', hex: '#eab308' },
  { value: 'naranja', label: 'Naranja', hex: '#f97316' },
  { value: 'rosa', label: 'Rosa', hex: '#ec4899' },
  { value: 'morado', label: 'Morado', hex: '#a855f7' },
  { value: 'cafe', label: 'Café', hex: '#92400e' },
  { value: 'vino', label: 'Vino', hex: '#881337' },
  { value: 'olivo', label: 'Olivo', hex: '#65a30d' },
  { value: 'coral', label: 'Coral', hex: '#fb7185' },
]
