import React from 'react'
import { 
  Shirt, 
  Footprints, 
  Glasses, 
  Layers, 
  Smile, 
  Briefcase, 
  PartyPopper, 
  Heart, 
  Flame,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  Infinity,
  Sparkles,
  Compass,
  Activity
} from 'lucide-react'

// Custom SVGs for a super premium look
export const PantsIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3h12l1.5 18H14.5l-2.5-9-2.5 9H4.5Z" />
  </svg>
)

export const JacketIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.38 3.43L12 1.5 3.62 3.43A2 2 0 0 0 2 5.38v11.75a2 2 0 0 0 .54 1.34L6 22h12l3.46-3.53a2 2 0 0 0 .54-1.34V5.38a2 2 0 0 0-1.62-1.95z" />
    <path d="M12 1.5v20.5" />
    <path d="M3.62 3.43L12 8.5l8.38-5.07" />
  </svg>
)

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
  superior: ['Playera', 'Camisa', 'Polo', 'Blusa', 'Sweater', 'Hoodie', 'Tank top'],
  inferior: ['Pantalón', 'Jeans', 'Jogger', 'Short', 'Falda', 'Bermuda'],
  calzado: ['Tenis', 'Zapatos', 'Botas', 'Sandalias', 'Mocasines'],
  chamarra: ['Chamarra', 'Abrigo', 'Chaleco', 'Blazer', 'Sudadera'],
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
    icon: <Infinity className="w-4 h-4 inline-block mr-1.5 align-text-bottom shrink-0 text-accent" /> 
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
