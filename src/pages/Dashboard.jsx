import { useEffect, useMemo, useState } from 'react'
import { getCampaigns } from '../services/budgetManagerApi'
import { getLandings, getLandingLeads } from '../services/landingCrmApi'

const sum = (items, key) => items.reduce((total, item) => total + (Number(item[key]) || 0), 0)
const formatMoney = value => `$${value.toLocaleString('es-AR')}`

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [landings, setLandings]   = useState([])
  const [client, setClient]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [campaignList, landingList] = await Promise.all([getCampaigns(), getLandings()])

        // leadCount de la API siempre vale 0: se cuentan los leads reales de cada landing
        const leadsPerLanding = await Promise.all(landingList.map(l => getLandingLeads(l.id)))

        setCampaigns(campaignList)
        setLandings(landingList.map((landing, i) => ({
          ...landing,
          leadCount: leadsPerLanding[i].length
        })))
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Empresas = clientes presentes en campañas y landings, sin repetir
  const clients = useMemo(() => {
    const names = [...campaigns, ...landings].map(item => item.client).filter(Boolean)
    return [...new Set(names)].sort()
  }, [campaigns, landings])

  const filteredCampaigns = client ? campaigns.filter(c => c.client === client) : campaigns
  const filteredLandings  = client ? landings.filter(l => l.client === client) : landings

  const totalCampaigns  = filteredCampaigns.length
  const activeCampaigns = filteredCampaigns.filter(c => String(c.status).toLowerCase() === 'active').length
  const totalBudget     = sum(filteredCampaigns, 'budget')
  const totalSpent      = sum(filteredCampaigns, 'spent')
  const totalLeads      = sum(filteredLandings, 'leadCount')

  if (loading) return <p className="state-msg">Cargando...</p>
  if (error)   return <p className="state-msg error">Error al conectar con las APIs: {error.message}</p>

  return (
    <main className="page">
      <h1>Dashboard</h1>

      <div className="client-filter">
        <label htmlFor="client-select">Empresa</label>
        <select
          id="client-select"
          value={client}
          onChange={e => setClient(e.target.value)}
        >
          <option value="">Todas las empresas</option>
          {clients.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <section>
        <h2>Campañas</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total de campañas</div>
            <div className="kpi-value">{totalCampaigns}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Campañas activas</div>
            <div className="kpi-value">{activeCampaigns}</div>
          </div>
        </div>
      </section>

      <section>
        <h2>Presupuesto y leads</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total de presupuesto</div>
            <div className="kpi-value">{formatMoney(totalBudget)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total gastado</div>
            <div className="kpi-value">{formatMoney(totalSpent)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total de leads</div>
            <div className="kpi-value">{totalLeads}</div>
          </div>
        </div>
      </section>
    </main>
  )
}