'use client'

import { useState } from 'react'

export default function StyleGuidePage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopiedColor(hex)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  const baseColors = [
    { name: 'MILK', colors: [
      { hex: '#FFFFFF', shade: '50' },
      { hex: '#FEFEFE', shade: '100' },
      { hex: '#FCFCFC', shade: '200' },
      { hex: '#F9F9F9', shade: '300' },
      { hex: '#F5F5F5', shade: '400' },
      { hex: '#F0F0F0', shade: '500', base: true },
      { hex: '#E8E8E8', shade: '600' },
      { hex: '#D9D9D9', shade: '700' },
      { hex: '#C4C4C4', shade: '800' },
      { hex: '#A8A8A8', shade: '900' },
    ], description: 'Neutra Clara' },
    { name: 'STONE', colors: [
      { hex: '#F5F3F0', shade: '50' },
      { hex: '#EDE9E4', shade: '100' },
      { hex: '#E3DED7', shade: '200' },
      { hex: '#D9D2C9', shade: '300' },
      { hex: '#CFC6BA', shade: '400' },
      { hex: '#D0D2C2', shade: '500', base: true },
      { hex: '#B8BAA8', shade: '600' },
      { hex: '#9A9C8A', shade: '700' },
      { hex: '#7C7E6C', shade: '800' },
      { hex: '#5E5F4E', shade: '900' },
    ], description: 'Neutra Média' },
    { name: 'DESERT CLAY', colors: [
      { hex: '#FBF2EE', shade: '50' },
      { hex: '#F5E0D6', shade: '100' },
      { hex: '#EECCBB', shade: '200' },
      { hex: '#E5B49D', shade: '300' },
      { hex: '#DC9C7F', shade: '400' },
      { hex: '#B17467', shade: '500', base: true },
      { hex: '#9A5E51', shade: '600' },
      { hex: '#824D42', shade: '700' },
      { hex: '#6A3D34', shade: '800' },
      { hex: '#523027', shade: '900' },
    ], description: 'Principal/Brand' },
    { name: 'GRAPHITE', colors: [
      { hex: '#F5F5F6', shade: '50' },
      { hex: '#E8E9EB', shade: '100' },
      { hex: '#D1D3D7', shade: '200' },
      { hex: '#B4B7BD', shade: '300' },
      { hex: '#9096A0', shade: '400' },
      { hex: '#4A4D67', shade: '500', base: true },
      { hex: '#3D3F54', shade: '600' },
      { hex: '#313342', shade: '700' },
      { hex: '#252730', shade: '800' },
      { hex: '#1A1C23', shade: '900' },
    ], description: 'Neutra Escura' },
  ]

  const feedbackColors = [
    { name: 'INFO', colors: [
      { hex: '#EFF6F9', shade: '50' },
      { hex: '#D9EAF2', shade: '100' },
      { hex: '#B3D5E6', shade: '200' },
      { hex: '#85BAD6', shade: '300' },
      { hex: '#5B9FC7', shade: '400' },
      { hex: '#4A7C8C', shade: '500', base: true },
      { hex: '#3D6673', shade: '600' },
      { hex: '#31515C', shade: '700' },
      { hex: '#253D46', shade: '800' },
      { hex: '#1A2A31', shade: '900' },
    ], description: 'Azul' },
    { name: 'SUCCESS', colors: [
      { hex: '#F0F7F3', shade: '50' },
      { hex: '#DCEEE3', shade: '100' },
      { hex: '#B8DCC7', shade: '200' },
      { hex: '#8FC6A7', shade: '300' },
      { hex: '#6BB089', shade: '400' },
      { hex: '#52A675', shade: '500', base: true },
      { hex: '#428760', shade: '600' },
      { hex: '#34694C', shade: '700' },
      { hex: '#274D38', shade: '800' },
      { hex: '#1B3527', shade: '900' },
    ], description: 'Verde' },
    { name: 'WARNING', colors: [
      { hex: '#FDF6ED', shade: '50' },
      { hex: '#FAEAD4', shade: '100' },
      { hex: '#F5D4A8', shade: '200' },
      { hex: '#EFBC76', shade: '300' },
      { hex: '#E8A24A', shade: '400' },
      { hex: '#C9935A', shade: '500', base: true },
      { hex: '#A67747', shade: '600' },
      { hex: '#835E38', shade: '700' },
      { hex: '#61462A', shade: '800' },
      { hex: '#43301D', shade: '900' },
    ], description: 'Âmbar' },
    { name: 'DANGER', colors: [
      { hex: '#FDF2F3', shade: '50' },
      { hex: '#FAE0E3', shade: '100' },
      { hex: '#F5C1C7', shade: '200' },
      { hex: '#EE9BA5', shade: '300' },
      { hex: '#E67483', shade: '400' },
      { hex: '#C75D6A', shade: '500', base: true },
      { hex: '#A34C57', shade: '600' },
      { hex: '#7F3C45', shade: '700' },
      { hex: '#5D2D33', shade: '800' },
      { hex: '#3F1F23', shade: '900' },
    ], description: 'Vermelho' },
  ]

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto bg-[#FEFEFE]">
      <div>
        <h1 className="text-4xl font-bold text-[#1A1C23] mb-2">SoTasty Design System</h1>
        <p className="text-[#3D3F54] text-lg">Paleta de cores e componentes - Light Theme</p>
      </div>

      {/* Cores Base */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Cores Base do Sistema</h2>
          <p className="text-[#3D3F54]">Cores fundamentais para fundos, texto e elementos estruturais</p>
        </div>

        <div className="space-y-6">
          {baseColors.map((colorGroup) => (
            <div key={colorGroup.name} className="bg-white rounded-xl shadow-sm border border-[#D9D2C9] p-6">
              <div className="mb-4">
                <h3 className="font-bold text-[#1A1C23] text-lg">{colorGroup.name}</h3>
                <p className="text-sm text-[#3D3F54]">{colorGroup.description}</p>
              </div>
              <div className="flex gap-0 overflow-hidden rounded-lg border border-[#CFC6BA]">
                {colorGroup.colors.map((color) => (
                  <div 
                    key={color.shade} 
                    className="flex-1 group relative cursor-pointer hover:z-10"
                    onClick={() => copyToClipboard(color.hex)}
                    title={`${color.shade} - Click to copy ${color.hex}`}
                  >
                    <div 
                      className="h-24 relative transition-all group-hover:scale-105 group-hover:shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    >
                      {copiedColor === color.hex && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-white text-xs font-semibold">✓</span>
                        </div>
                      )}
                      {color.base && (
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                          BASE
                        </div>
                      )}
                    </div>
                    <div className="py-2 px-1 text-center bg-white border-t border-[#CFC6BA]">
                      <p className="text-xs font-mono text-[#4A4D67]">{color.shade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cores de Feedback */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Cores de Feedback</h2>
          <p className="text-[#3D3F54]">Cores para mensagens, alertas e estados do sistema</p>
        </div>

        <div className="space-y-6">
          {feedbackColors.map((colorGroup) => (
            <div key={colorGroup.name} className="bg-white rounded-xl shadow-sm border border-[#D9D2C9] p-6">
              <div className="mb-4">
                <h3 className="font-bold text-[#1A1C23]">{colorGroup.name}</h3>
                <p className="text-xs text-[#3D3F54]">{colorGroup.description}</p>
              </div>
              <div className="flex gap-0 overflow-hidden rounded-lg border border-[#CFC6BA]">
                {colorGroup.colors.map((color) => (
                  <div 
                    key={color.shade} 
                    className="flex-1 group relative cursor-pointer hover:z-10"
                    onClick={() => copyToClipboard(color.hex)}
                    title={`${color.shade} - Click to copy ${color.hex}`}
                  >
                    <div 
                      className="h-24 relative transition-all group-hover:scale-105 group-hover:shadow-lg"
                      style={{ backgroundColor: color.hex }}
                    >
                      {copiedColor === color.hex && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-white text-xs font-semibold">✓</span>
                        </div>
                      )}
                      {color.base && (
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                          BASE
                        </div>
                      )}
                    </div>
                    <div className="py-2 px-1 text-center bg-white border-t border-[#CFC6BA]">
                      <p className="text-xs font-mono text-[#4A4D67]">{color.shade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Botões Primary */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Botões Primary (Desert Clay)</h2>
          <p className="text-[#3D3F54]">Ações principais e de destaque</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-[#D9D2C9] space-y-8">
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Filled</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">Default</button>
              <button className="btn-primary" onMouseEnter={(e) => e.currentTarget.classList.add('hover')}>Hover</button>
              <button className="btn-primary" disabled>Disabled</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Outline</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary-outline">Default</button>
              <button className="btn-primary-outline" disabled>Disabled</button>
            </div>
          </div>
        </div>
      </section>

      {/* Botões Secondary */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Botões Secondary (Graphite)</h2>
          <p className="text-[#3D3F54]">Ações secundárias e navegação</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-[#D9D2C9] space-y-8">
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Filled</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-secondary">Default</button>
              <button className="btn-secondary" disabled>Disabled</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Outline</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-secondary-outline">Default</button>
              <button className="btn-secondary-outline" disabled>Disabled</button>
            </div>
          </div>
        </div>
      </section>

      {/* Botões de Feedback */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Botões de Feedback</h2>
          <p className="text-[#3D3F54]">Mensagens e ações contextuais</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-[#D9D2C9] space-y-8">
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Filled</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-info">Info</button>
              <button className="btn-success">Success</button>
              <button className="btn-warning">Warning</button>
              <button className="btn-danger">Danger</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Outline</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-outline-info">Info</button>
              <button className="btn-outline-success">Success</button>
              <button className="btn-outline-warning">Warning</button>
              <button className="btn-outline-danger">Danger</button>
            </div>
          </div>
        </div>
      </section>

      {/* Botões XS (Extra Small) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Botões XS (Extra Small)</h2>
          <p className="text-[#3D3F54]">Variantes compactas para ações em espaços reduzidos (padding: 4px 12px, font-size: 0.75rem)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-[#D9D2C9] space-y-8">
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Filled XS</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <button className="btn-primary-xs">Primary XS</button>
              <button className="btn-secondary-xs">Secondary XS</button>
              <button className="btn-info-xs">Info XS</button>
              <button className="btn-success-xs">Success XS</button>
              <button className="btn-warning-xs">Warning XS</button>
              <button className="btn-danger-xs">Danger XS</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-[#1A1C23] mb-4">Outline XS</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <button className="btn-outline-primary-xs">Primary XS</button>
              <button className="btn-outline-secondary-xs">Secondary XS</button>
              <button className="btn-outline-info-xs">Info XS</button>
              <button className="btn-outline-success-xs">Success XS</button>
              <button className="btn-outline-warning-xs">Warning XS</button>
              <button className="btn-outline-danger-xs">Danger XS</button>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Preview */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1C23] mb-2">Preview de Tema</h2>
          <p className="text-[#3D3F54]">Exemplo de card com estilos do Light Theme</p>
        </div>
        <div style={{ backgroundColor: '#FEFEFE' }} className="p-8 rounded-xl border border-[#D9D2C9]">
          <div style={{ backgroundColor: '#FFFFFF' }} className="rounded-xl shadow-sm border border-[#D9D2C9] p-6 max-w-md">
            <h3 className="text-xl font-bold text-[#1A1C23] mb-2">Exemplo de Card</h3>
            <p className="text-[#3D3F54] mb-4">Este é um card de exemplo usando as cores do Light Theme do SoTasty Design System.</p>
            <div className="flex gap-3">
              <button className="btn-primary">Ação Principal</button>
              <button className="btn-secondary-outline">Cancelar</button>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-8 border-t border-[#D9D2C9]">
        <p className="text-center text-sm text-[#9096A0]">© 2025 SoTasty Design System v1.0.0</p>
      </div>
    </div>
  )
}
