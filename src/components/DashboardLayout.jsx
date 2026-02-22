import React from 'react'

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#1A1A1A] text-base text-white">
      <header className="flex h-16 items-center border-b border-[#E21A2C]/30 bg-[#111111] px-6">
        <h1 className="text-xl font-black uppercase tracking-[0.12em] md:text-2xl">{title}</h1>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
