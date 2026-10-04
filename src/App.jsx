import React from 'react'
import { Heart, Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-rose-50 via-slate-50 to-wedding-gold-50 text-slate-800">
      <header className="border-b border-wedding-rose-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-wedding-rose-100 flex items-center justify-center text-wedding-rose-600 shadow-inner">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-serif-wedding text-slate-900 tracking-tight flex items-center gap-2">
                Mas & Cece Wedding Saving
                <Sparkles className="w-4 h-4 text-wedding-gold-500 inline" />
              </h1>
              <p className="text-xs text-slate-500">Menuju Hari Bahagia & Target Tabungan Bersama</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-wedding-rose-50 text-wedding-rose-700 border border-wedding-rose-200">
              Target: Rp 100.000.000
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 border border-wedding-rose-100 shadow-sm text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Selamat Datang di Portal Tabungan Pernikahan</h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm">
            Aplikasi pengelolaan dan pencatatan tabungan pernikahan Mas & Cece. Pantau progress, catat setoran, dan proyeksikan waktu impian tercapai.
          </p>
        </div>
      </main>
    </div>
  )
}
