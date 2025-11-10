'use client'

export default function StyleGuidePage() {
  const colorPalette = [
    { hex: '#FFFBFB', name: 'Snow', description: 'Branco neve suave' },
    { hex: '#FFEEEB', name: 'Lavender blush', description: 'Rosa lavanda claro' },
    { hex: '#EBC7C1', name: 'Pale Dogwood', description: 'Rosa pálido amadeirado' },
    { hex: '#BE9089', name: 'Rosy brown', description: 'Marrom rosado' },
    { hex: '#E79F9C', name: 'Melon', description: 'Melão coral' },
    { hex: '#B3736B', name: 'Old rose', description: 'Rosa antigo' },
    { hex: '#1B0F0E', name: 'Licorice', description: 'Preto alcaçuz' },
  ]

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Guia de Estilos CakeCloud</h1>
        <p className="text-gray-600 text-lg">Sistema de design completo</p>
      </div>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paleta de Cores</h2>
          <p className="text-gray-600">Cores da identidade visual</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {colorPalette.map((color) => (
            <div key={color.hex} className="group">
              <div 
                className="h-32 rounded-t-2xl shadow-md transition-transform group-hover:scale-105 border border-gray-200"
                style={{ backgroundColor: color.hex }}
              />
              <div className="bg-white p-4 rounded-b-2xl shadow-md border border-t-0 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-1">{color.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{color.description}</p>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{color.hex}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Botões</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200 space-y-6">
          <div>
            <h3 className="font-bold mb-3">Sólidos</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-info">Info</button>
              <button className="btn-success">Success</button>
              <button className="btn-warning">Warning</button>
              <button className="btn-danger">Danger</button>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-3">Outline</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-outline-info">Info</button>
              <button className="btn-outline-success">Success</button>
              <button className="btn-outline-warning">Warning</button>
              <button className="btn-outline-danger">Danger</button>
              <button className="btn-outline-grey">Cancelar</button>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-8 border-t border-gray-200">
        <p className="text-center text-sm text-gray-500">© 2025 CakeCloud v1.0</p>
      </div>
    </div>
  )
}
