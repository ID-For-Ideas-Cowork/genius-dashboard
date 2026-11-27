import { useEffect, useMemo, useState } from 'react'
import { getLandings } from '../services/landingCrmApi'
import ClientFilter from '../components/ClientFilter'

const LANDINGS_BASE_URL = 'http://localhost:5500'

const LANDING_ROUTES = [
  { match: 'black friday',    path: '/techstore/black-friday.html' },
  { match: 'summer tech',     path: '/techstore/summer-tech.html' },
  { match: 'economica',       path: '/suenosimple/economica-pro.html' },
  { match: 'dia de la madre', path: '/suenosimple/dia-de-la-madre.html' },
  { match: 'mundial',         path: '/suenosimple/mundial-2026/' },
  { match: 'cyber monday',    path: '/modalatam/cyber-monday.html' },
  { match: 'nueva coleccion', path: '/modalatam/nueva-coleccion.html' },
]

const CLIENT_FOLDER_MAP = {
  suenosimple: 'suenosimple',
  techstore:   'techstore',
  modalatam:   'modalatam',
}

function toSlug(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildFullUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${LANDINGS_BASE_URL}${cleanPath}`
}

function getLandingUrl(landing) {
  // 1. Si el CRM ya manda una URL o ruta directa, la usamos tal cual
  const directField =
    landing.url ??
    landing.landingUrl ??
    landing.path ??
    landing.filePath ??
    landing.file
  if (directField) {
    return buildFullUrl(directField)
  }

  const clientKey = toSlug(landing.client ?? '')
  const folder = CLIENT_FOLDER_MAP[clientKey]

  // 2. Si el CRM manda un slug (ej: "nueva-promo" o "suenosimple/nueva-promo.html")
  if (landing.slug) {
    if (landing.slug.includes('/') || landing.slug.endsWith('.html')) {
      return buildFullUrl(landing.slug)
    }
    if (folder) {
      const slugClean = landing.slug.endsWith('.html')
        ? landing.slug
        : `${toSlug(landing.slug)}.html`
      return `${LANDINGS_BASE_URL}/${folder}/${slugClean}`
    }
  }

  // 3. Coincidencia por nombre conocido
  const rawTitle = landing.name ?? landing.title ?? ''
  const normalizedTitle = toSlug(rawTitle).replace(/-/g, ' ')
  const matched = LANDING_ROUTES.find(item => normalizedTitle.includes(item.match))
  if (matched) {
    return `${LANDINGS_BASE_URL}${matched.path}`
  }

  // 4. Fallback al index.html de la carpeta del cliente si existe
  if (folder) {
    return `${LANDINGS_BASE_URL}/${folder}/index.html`
  }

  return null
}

const STATUS_BADGE = {
  activa:   'badge-active',
  inactiva: 'badge-closed',
  borrador: 'badge-draft',
}

export default function Landings() {
  const [landings, setLandings] = useState([])
  const [client, setClient]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getLandings()
      .then(setLandings)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const clients = useMemo(() => {
    const names = landings.map(item => item.client).filter(Boolean)
    return [...new Set(names)].sort()
  }, [landings])

  const filteredLandings = client
    ? landings.filter(l => l.client === client)
    : landings

  if (loading) return <p className="state-msg">Cargando landings...</p>
  if (error)   return <p className="state-msg error">Error: {error.message}</p>

  return (
    <main className="page">
      <h1>Landings</h1>

      {/* TODO GD-F03: agregar columna de conteo de leads por landing */}
      <ClientFilter clients={clients} value={client} onChange={setClient} />

      <div className="item-list">
        {filteredLandings.length === 0 && <p className="state-msg">No hay landings registradas.</p>}
        {filteredLandings.map(l => {
          const title = l.name ?? l.title
          const url = getLandingUrl(l)

          return (
            <div key={l.id} className="item-card">
              <div>
                <div className="item-name">
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="landing-link">
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                </div>
                <div className="item-meta">{l.client} · Template: {l.template}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${STATUS_BADGE[l.status] ?? 'badge-draft'}`}>
                  {l.status}
                </span>
                {/* TODO GD-F03: mostrar l.leadCount aquí */}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}