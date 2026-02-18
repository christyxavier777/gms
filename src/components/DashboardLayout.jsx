import React from 'react'

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-16 bg-white shadow flex items-center px-6">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
