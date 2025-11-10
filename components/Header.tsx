import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-pink-600">
            🍰 CakeCloud
          </Link>
          
          <div className="flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-pink-600 transition">
              Início
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-pink-600 transition">
              Produtos
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-pink-600 transition">
              Pedidos
            </Link>
            <Link href="/customers" className="text-gray-700 hover:text-pink-600 transition">
              Clientes
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
