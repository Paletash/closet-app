export function providerRequest(config, prompt) {
  if (config.geminiKey) return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel || 'gemini-2.5-flash')}:generateContent`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiKey },
    body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } },
    provider: 'gemini',
  }
  if (config.openrouterKey) return {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openrouterKey}` },
    body: { model: config.openrouterModel || 'openrouter/free', messages: [{ role: 'user', content: prompt }], temperature: 0.4, max_tokens: 700 },
    provider: 'openrouter',
  }
  return null
}
export function parseProviderResult(data, provider, available) {
  const content = provider === 'gemini' ? data.candidates?.[0]?.content?.parts?.[0]?.text : data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('Respuesta vacía')
  const result = JSON.parse(content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim())
  const ids = result.prendas_seleccionadas
  if (!Array.isArray(ids) || ids.length < 3 || ids.length > 5 || new Set(ids).size !== ids.length) throw new Error('Selección inválida')
  const selected = ids.map(id => available.find(item => item.id === id))
  if (selected.some(item => !item || item.sucia || (item.estado || 'activa') !== 'activa')) throw new Error('Prenda no disponible')
  for (const category of ['superior', 'inferior', 'calzado']) {
    if (selected.filter(item => item.categoria === category).length !== 1) throw new Error('Outfit incompleto')
  }
  if (selected.filter(item => item.categoria === 'chamarra').length > 1) throw new Error('Capas duplicadas')
  return { prendas_seleccionadas: ids, razon: typeof result.razon === 'string' ? result.razon.slice(0, 800) : '', tip_estilo: typeof result.tip_estilo === 'string' ? result.tip_estilo.slice(0, 400) : '' }
}
