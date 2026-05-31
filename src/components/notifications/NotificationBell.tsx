'use client'
import { useState } from 'react'
import NotificationDropdown from './NotificationDropdown'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <NotificationDropdown onViewAll={() => setShowPanel(true)} />
      {showPanel && (
        <NotificationPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  )
}