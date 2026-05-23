'use client'

import { useEffect } from 'react'

export function MobileMenu() {
  useEffect(() => {
    const menuBtn = document.getElementById('mobile-menu-btn')
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('mobile-overlay')

    const openMenu = () => {
      sidebar?.classList.remove('translate-x-[-100%]')
      overlay?.classList.remove('hidden')
      document.body.style.overflow = 'hidden'
    }

    const closeMenu = () => {
      sidebar?.classList.add('translate-x-[-100%]')
      overlay?.classList.add('hidden')
      document.body.style.overflow = ''
    }

    menuBtn?.addEventListener('click', openMenu)
    overlay?.addEventListener('click', closeMenu)

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      menuBtn?.removeEventListener('click', openMenu)
      overlay?.removeEventListener('click', closeMenu)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return null
}