import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[var(--color-snow)] shadow-sm border-b">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[var(--color-old-rose)]">
            🍰 CakeCloud
          </Link>
          
          <div className="flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-[var(--color-old-rose)] transition">
              Início
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-[var(--color-old-rose)] transition">
              Produtos
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-[var(--color-old-rose)] transition">
              Pedidos
            </Link>
            <Link href="/customers" className="text-gray-700 hover:text-[var(--color-old-rose)] transition">
              Clientes
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
