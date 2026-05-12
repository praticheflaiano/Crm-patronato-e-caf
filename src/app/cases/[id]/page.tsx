import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient()

  const { data: caseItemRaw, error } = await supabase
    .from('cases')
    .select(`
      *,
      contacts (*),
      documents (*),
      tasks (*)
    `)
    .eq('id', id)
    .single()

  if (error || !caseItemRaw) {
    notFound()
  }

  const caseItem = caseItemRaw as any /* eslint-disable-line @typescript-eslint/no-explicit-any */

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/cases" className="text-gray-500 hover:text-gray-700">
          &larr; Indietro alle Pratiche
        </Link>
        <h1 className="text-2xl font-bold">Dettaglio Pratica</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{caseItem.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Creata il: {new Date(caseItem.created_at!).toLocaleDateString('it-IT')}
                </p>
              </div>
              <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                {caseItem.status!.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Descrizione</h3>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {caseItem.description || 'Nessuna descrizione.'}
              </p>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Documenti Allegati</h2>
              {/* In a fully functional app, this would be an actual file input form */}
              <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                + Carica Documento
              </button>
            </div>

            {!caseItem.documents || caseItem.documents.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun documento caricato per questa pratica.</p>
            ) : (
              <ul className="divide-y divide-gray-200 border-t border-gray-200">
                {caseItem.documents.map((doc: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                  <li key={doc.id} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-medium">{doc.file_name}</span>
                    <a href="#" className="text-sm text-blue-600 hover:underline">Scarica</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Informazioni Contatto</h2>
            {caseItem.contacts ? (
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {caseItem.contacts.last_name} {caseItem.contacts.first_name}</p>
                <p><strong>CF:</strong> {caseItem.contacts.fiscal_code}</p>
                {caseItem.contacts.email && <p><strong>Email:</strong> {caseItem.contacts.email}</p>}
                {caseItem.contacts.phone && <p><strong>Telefono:</strong> {caseItem.contacts.phone}</p>}
                <Link href={`/contacts`} className="text-blue-600 hover:underline mt-2 inline-block">
                  Vedi profilo completo &rarr;
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessun contatto associato.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-lg font-medium">Task</h2>
               <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                + Aggiungi
              </button>
            </div>
            {!caseItem.tasks || caseItem.tasks.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun task per questa pratica.</p>
            ) : (
              <ul className="space-y-2">
                {caseItem.tasks.map((task: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                   <li key={task.id} className="flex items-center space-x-2 text-sm">
                     <input type="checkbox" defaultChecked={task.is_completed} disabled />
                     <span className={task.is_completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
                   </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
