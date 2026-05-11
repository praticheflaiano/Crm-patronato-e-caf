export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Contatti Totali</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Pratiche Aperte</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Task in Scadenza</h3>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Pratiche Recenti</h2>
          <div className="text-gray-500 text-sm">Nessuna pratica recente.</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Prossimi Task</h2>
          <div className="text-gray-500 text-sm">Nessun task in scadenza.</div>
        </div>
      </div>
    </div>
  )
}
