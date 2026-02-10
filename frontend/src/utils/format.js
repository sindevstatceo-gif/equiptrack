export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR')
}

export const buildMediaUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(
    /\/api\/?$/,
    ''
  )
  return `${base}${path}`
}

export const unwrapResults = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export const toIsoDate = (value) => {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return date.toISOString()
}
