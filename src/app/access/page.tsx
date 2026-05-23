import { createAdminClient } from '@/utils/supabase/server'

const ADMIN_EMAIL = 'praticheflaiano@gmail.com'

export default async function AccessPage() {
  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: ADMIN_EMAIL,
  })

  const errorMsg = error?.message ?? (!data?.properties?.action_link ? 'No link generated' : null)

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="bg-white rounded-lg border p-8 text-center max-w-md w-full">
        {errorMsg ? (
          <>
            <h1 className="text-xl font-bold text-red-600">Errore</h1>
            <p className="mt-2 text-slate-600">{errorMsg}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-950">Login in corso...</h1>
            <p className="mt-2 text-sm text-slate-500">Stiamo autenticando il tuo account. Non chiudere questa pagina.</p>
          </>
        )}
        <p className="mt-4 text-xs text-slate-400">Centro Pratiche Flaiano CRM</p>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (!token) throw new Error('No token in URL');
            import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({createClient}) => {
              const supabase = createClient(
                'https://xjchklrrmyavizozhtpb.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqY2hrbHJteW12aW96aHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzYzMDcsImV4cCI6MjA5NDE1MjMwN30.-jwzje0VXfmysMIff5yV_iYbpd7ndw1YEtM4Les30ok'
              );
              supabase.auth.verifyOtp({ email: 'praticheflaiano@gmail.com', token: token, type: 'magiclink' })
                .then(({error}) => { if (error) throw error; window.location.href = '/'; })
                .catch(err => { document.querySelector('p').textContent = 'Errore: ' + err.message; });
            });
          } catch(err) {
            document.querySelector('p').textContent = 'Errore: ' + err.message;
          }
        ` }} />
      </div>
    </main>
  )
}