import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Centro Pratiche Flaiano CRM',
    short_name: 'CRM Flaiano',
    description:
      'Gestione pratiche CAF, Patronato e TARI — Centro Pratiche Flaiano',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#2563eb',
    lang: 'it',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
