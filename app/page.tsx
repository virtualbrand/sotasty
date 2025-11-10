import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Bem-vindo ao CakeCloud 🍰
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema completo de gestão para sua confeitaria
        </p>
        <Link
          href="/products"
          className="inline-block bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 transition font-semibold"
        >
          Começar Agora
        </Link>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 mt-16">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">Gestão de Produtos</h3>
          <p className="text-gray-600">
            Cadastre e gerencie todos os seus produtos, bolos, doces e encomendas especiais.
          </p>
          <Link href="/products" className="text-pink-600 hover:text-pink-700 mt-4 inline-block">
            Ver Produtos →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">Controle de Pedidos</h3>
          <p className="text-gray-600">
            Acompanhe todos os pedidos do início ao fim, com status e datas de entrega.
          </p>
          <Link href="/orders" className="text-pink-600 hover:text-pink-700 mt-4 inline-block">
            Ver Pedidos →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">Cadastro de Clientes</h3>
          <p className="text-gray-600">
            Mantenha um registro completo de seus clientes e histórico de compras.
          </p>
          <Link href="/customers" className="text-pink-600 hover:text-pink-700 mt-4 inline-block">
            Ver Clientes →
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mt-16 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Por que usar o CakeCloud?</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-pink-600">100%</div>
            <div className="text-gray-700 mt-2">Gratuito e Open Source</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-pink-600">☁️</div>
            <div className="text-gray-700 mt-2">Cloud-based</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-pink-600">🚀</div>
            <div className="text-gray-700 mt-2">Fácil de Usar</div>
          </div>
        </div>
      </section>
    </div>
  );
}
