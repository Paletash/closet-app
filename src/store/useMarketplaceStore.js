import { create } from 'zustand'
import { useClothingStore } from './useClothingStore'
import { toast } from '../lib/toast'

export const useMarketplaceStore = create((set) => ({
  loading: false,

  markForSale: async (prendaId, precio, plataforma) => {
    set({ loading: true })
    const { updateClothing } = useClothingStore.getState()
    
    // Asumimos que la columna estado, precio_venta y plataforma_venta existen
    const { error } = await updateClothing(prendaId, {
      estado: 'en_venta',
      precio_venta: parseFloat(precio) || 0,
      plataforma_venta: plataforma
    })

    set({ loading: false })
    if (error) {
      toast.error('Error al poner en venta: ' + error.message)
      return false
    }
    
    toast.success('Prenda marcada para la venta')
    return true
  },

  markForDonation: async (prendaId) => {
    set({ loading: true })
    const { updateClothing } = useClothingStore.getState()
    
    const { error } = await updateClothing(prendaId, {
      estado: 'donada'
    })

    set({ loading: false })
    if (error) {
      toast.error('Error al donar prenda: ' + error.message)
      return false
    }
    
    toast.success('Prenda marcada como donada/archivada')
    return true
  },

  unmark: async (prendaId) => {
    set({ loading: true })
    const { updateClothing } = useClothingStore.getState()
    
    const { error } = await updateClothing(prendaId, {
      estado: 'activa',
      precio_venta: null,
      plataforma_venta: null
    })

    set({ loading: false })
    if (error) {
      toast.error('Error al restaurar prenda: ' + error.message)
      return false
    }
    
    toast.success('Prenda devuelta al clóset activo')
    return true
  },

  generateListing: (prenda) => {
    // Genera un texto para copiar y pegar en Vinted, Marketplace, etc.
    const titulo = `${prenda.categoria || 'Prenda'} ${prenda.color_principal || ''} ${prenda.marca || ''}`.trim()
    const precio = prenda.precio_venta ? `$${prenda.precio_venta}` : 'Precio a tratar'
    
    let texto = `¡Hola! Estoy vendiendo este/esta ${titulo}.\n\n`
    texto += `Detalles:\n`
    if (prenda.marca) texto += `- Marca: ${prenda.marca}\n`
    if (prenda.color_principal) texto += `- Color: ${prenda.color_principal}\n`
    if (prenda.estilos && prenda.estilos.length > 0) texto += `- Estilo: ${prenda.estilos.join(', ')}\n`
    if (prenda.notas) texto += `- Notas: ${prenda.notas}\n`
    
    texto += `\n💰 ${precio}\n\n`
    texto += `Cualquier duda, mándame mensaje directo.`
    
    return texto
  }
}))
