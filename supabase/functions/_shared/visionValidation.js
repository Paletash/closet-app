const categories = ['superior', 'inferior', 'calzado', 'chamarra', 'accesorio']
const colors = ['negro', 'blanco', 'gris', 'beige', 'azul', 'azul_marino', 'rojo', 'verde', 'amarillo', 'naranja', 'rosa', 'morado', 'cafe', 'vino', 'olivo', 'coral']
const styles = ['casual', 'formal', 'urbano', 'deportivo']

export function validateClassification(value) {
  if (!value || !categories.includes(value.categoria)) throw new Error('No se detectó una prenda válida')
  return {
    categoria: value.categoria,
    subcategoria: typeof value.subcategoria === 'string' ? value.subcategoria.slice(0, 60) : null,
    color_principal: colors.includes(value.color_principal) ? value.color_principal : null,
    estilos: Array.isArray(value.estilos) ? [...new Set(value.estilos.filter(style => styles.includes(style)))] : [],
    confianza: typeof value.confianza === 'number' && Number.isFinite(value.confianza) ? Math.min(1, Math.max(0, value.confianza)) : null,
  }
}

export function validateInspiration(value) {
  if (!Array.isArray(value?.prendas_detectadas)) throw new Error('Resultado de inspiración inválido')
  return {
    prendas_detectadas: value.prendas_detectadas.filter(item => item && categories.includes(item.categoria)).slice(0, 20).map(item => ({
      categoria: item.categoria,
      color: colors.includes(item.color) ? item.color : null,
      estilo: styles.includes(item.estilo) ? item.estilo : null,
    })),
    estilo_general: styles.includes(value.estilo_general) ? value.estilo_general : null,
  }
}
