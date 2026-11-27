export default function ClientFilter({ clients, value, onChange }) {
  return (
    <div className="client-filter">
      <label htmlFor="client-select">Empresa</label>
      <select
        id="client-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Todas las empresas</option>
        {clients.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  )
}