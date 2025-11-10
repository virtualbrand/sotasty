export default function CustomersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <button className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition">
          + Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center py-8">
          Configure sua conexão com o Supabase para começar a gerenciar clientes.
        </p>
      </div>
    </div>
  )
}
