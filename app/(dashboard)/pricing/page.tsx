'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/Modal'

type Ingredient = {
  id: string
  name: string
  volume: number
  unit: string
  average_cost: number
  unit_cost: number
  loss_factor: number
}

type BaseRecipe = {
  id: string
  name: string
  description?: string
  loss_factor: number
  total_cost: number
  base_recipe_items?: any[]
}

type FinalProduct = {
  id: string
  name: string
  category: string
  description?: string
  loss_factor: number
  selling_price?: number
  profit_margin?: number
  total_cost: number
  final_product_items?: any[]
}

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'bases' | 'products'>('ingredients')

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Precificação</h1>
        <p className="text-gray-500 mt-1">Gerencie insumos, bases de preparo e produtos finais</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'ingredients'
                  ? 'border-b-2 border-pink-600 text-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📦 Insumos / Matérias-Primas
            </button>
            <button
              onClick={() => setActiveTab('bases')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'bases'
                  ? 'border-b-2 border-pink-600 text-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🥄 Bases de Preparo
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                activeTab === 'products'
                  ? 'border-b-2 border-pink-600 text-pink-600 bg-pink-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🍰 Produtos Finais
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'ingredients' && <IngredientsTab />}
          {activeTab === 'bases' && <BasesTab />}
          {activeTab === 'products' && <ProductsTab />}
        </div>
      </div>
    </div>
  )
}

function IngredientsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    volume: '',
    unit: 'gramas',
    average_cost: '',
    loss_factor: '2'
  })

  useEffect(() => {
    fetchIngredients()
  }, [])

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/pricing/ingredients')
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/pricing/ingredients?id=${editingId}`
        : '/api/pricing/ingredients'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedIngredient = await response.json()
        
        if (editingId) {
          setIngredients(ingredients.map(ing => 
            ing.id === editingId ? savedIngredient : ing
          ))
        } else {
          setIngredients([savedIngredient, ...ingredients])
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
          name: '',
          volume: '',
          unit: 'gramas',
          average_cost: '',
          loss_factor: '2'
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar insumo')
      }
    } catch (error) {
      console.error('Erro ao salvar insumo:', error)
      alert('Erro ao salvar insumo')
    }
  }

  const handleEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id)
    setFormData({
      name: ingredient.name,
      volume: ingredient.volume.toString(),
      unit: ingredient.unit,
      average_cost: ingredient.average_cost.toString(),
      loss_factor: ingredient.loss_factor.toString()
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      volume: '',
      unit: 'gramas',
      average_cost: '',
      loss_factor: '2'
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este insumo?')) return

    try {
      const response = await fetch(`/api/pricing/ingredients?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIngredients(ingredients.filter(ing => ing.id !== id))
      } else {
        alert('Erro ao excluir insumo')
      }
    } catch (error) {
      console.error('Erro ao excluir insumo:', error)
      alert('Erro ao excluir insumo')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Insumos / Matérias-Primas</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition font-semibold text-sm"
        >
          + Novo Insumo
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Insumo" : "Cadastrar Novo Insumo"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Insumo *</label>
              <input
                type="text"
                placeholder="Ex: Farinha de Trigo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
              <select 
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              >
                <option value="gramas">Gramas (g)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="litros">Litros (L)</option>
                <option value="unidades">Unidades</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.unit === 'unidades' ? 'Quantidade *' : 'Volume *'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={formData.unit === 'unidades' ? '12' : '5000'}
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Médio (R$) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="19.00"
                value={formData.average_cost}
                onChange={(e) => setFormData({ ...formData, average_cost: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="2"
                value={formData.loss_factor}
                onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition font-semibold text-sm"
            >
              {editingId ? 'Atualizar Insumo' : 'Salvar Insumo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum insumo cadastrado. Clique em "+ Novo Insumo" para começar.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Item (Matéria-Prima)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Volume</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Unidade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Custo Médio</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Custo Unitário</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Fator de Perda</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{ingredient.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{ingredient.volume}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{ingredient.unit}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">R$ {ingredient.average_cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 font-medium">R$ {ingredient.unit_cost.toFixed(5)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{ingredient.loss_factor}%</td>
                  <td className="py-3 px-4 text-sm">
                    <button 
                      className="text-blue-600 hover:text-blue-800 mr-3" 
                      onClick={() => handleEdit(ingredient)}
                    >
                      Editar
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800" 
                      onClick={() => handleDelete(ingredient.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function BasesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [bases, setBases] = useState<BaseRecipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    loss_factor: '2',
    items: [] as { ingredient_id: string; quantity: string }[]
  })
  const [newItem, setNewItem] = useState({ ingredient_id: '', quantity: '' })

  useEffect(() => {
    fetchBases()
    fetchIngredients()
  }, [])

  const fetchBases = async () => {
    try {
      const response = await fetch('/api/pricing/bases')
      if (response.ok) {
        const data = await response.json()
        setBases(data)
      }
    } catch (error) {
      console.error('Erro ao buscar bases:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/pricing/ingredients')
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error)
    }
  }

  const handleAddItem = () => {
    if (newItem.ingredient_id && newItem.quantity) {
      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      })
      setNewItem({ ingredient_id: '', quantity: '' })
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/pricing/bases?id=${editingId}`
        : '/api/pricing/bases'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedBase = await response.json()
        
        if (editingId) {
          setBases(bases.map(base => 
            base.id === editingId ? savedBase : base
          ))
        } else {
          setBases([savedBase, ...bases])
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
          name: '',
          description: '',
          loss_factor: '2',
          items: []
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar base')
      }
    } catch (error) {
      console.error('Erro ao salvar base:', error)
      alert('Erro ao salvar base')
    }
  }

  const handleEdit = (base: BaseRecipe) => {
    setEditingId(base.id)
    setFormData({
      name: base.name,
      description: base.description || '',
      loss_factor: base.loss_factor.toString(),
      items: (base.base_recipe_items || []).map(item => ({
        ingredient_id: item.ingredients?.id || item.ingredient_id,
        quantity: item.quantity.toString()
      }))
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      loss_factor: '2',
      items: []
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta base?')) return

    try {
      const response = await fetch(`/api/pricing/bases?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBases(bases.filter(base => base.id !== id))
      } else {
        alert('Erro ao excluir base')
      }
    } catch (error) {
      console.error('Erro ao excluir base:', error)
      alert('Erro ao excluir base')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bases de Preparo</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition font-semibold text-sm"
        >
          + Nova Base
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Base de Preparo" : "Cadastrar Nova Base de Preparo"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Base *</label>
              <input
                type="text"
                placeholder="Ex: Massa de Chocolate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="2"
                value={formData.loss_factor}
                onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descrição da base de preparo"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-300">
            <h4 className="font-medium text-gray-900 mb-3">Ingredientes da Base</h4>
            
            {/* Added items list */}
            {formData.items.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.items.map((item, index) => {
                  const ing = ingredients.find(i => i.id === item.ingredient_id)
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-900">{ing?.name} - {item.quantity} {ing?.unit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div className="md:col-span-2">
                <select 
                  value={newItem.ingredient_id}
                  onChange={(e) => setNewItem({ ...newItem, ingredient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900"
                >
                  <option value="">Selecione um insumo</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition font-semibold text-sm"
            >
              {editingId ? 'Atualizar Base' : 'Salvar Base'}
            </button>
          </div>
        </form>
      </Modal>

      {/* List of Bases */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : bases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma base cadastrada. Clique em "+ Nova Base" para começar.</div>
        ) : (
          bases.map((base) => (
            <div key={base.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{base.name}</h3>
                  <p className="text-sm text-gray-500">Fator de Perda: {base.loss_factor}%</p>
                  {base.description && <p className="text-sm text-gray-600 mt-1">{base.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">R$ {base.total_cost?.toFixed(2) || '0.00'}</p>
                  <p className="text-xs text-gray-500">Custo Total</p>
                </div>
              </div>
              {base.base_recipe_items && base.base_recipe_items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Item</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Qtde</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Unidade</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Custo Unit.</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {base.base_recipe_items.map((item: any) => {
                        const subtotal = item.quantity * (item.ingredients?.unit_cost || 0)
                        return (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-900">{item.ingredients?.name}</td>
                            <td className="py-2 px-2 text-gray-600">{item.quantity}</td>
                            <td className="py-2 px-2 text-gray-600">{item.ingredients?.unit}</td>
                            <td className="py-2 px-2 text-gray-600">R$ {item.ingredients?.unit_cost?.toFixed(5)}</td>
                            <td className="py-2 px-2 text-gray-900 font-medium">R$ {subtotal.toFixed(4)}</td>
                          </tr>
                        )
                      })}
                      {/* Linha de Subtotal */}
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={4} className="py-2 px-2 text-right font-medium text-gray-700">Subtotal dos Ingredientes:</td>
                        <td className="py-2 px-2 text-gray-900 font-semibold">
                          R$ {base.base_recipe_items.reduce((sum: number, item: any) => 
                            sum + (item.quantity * (item.ingredients?.unit_cost || 0)), 0
                          ).toFixed(4)}
                        </td>
                      </tr>
                      {/* Linha do Fator de Perda */}
                      <tr className="bg-yellow-50">
                        <td colSpan={4} className="py-2 px-2 text-right font-medium text-gray-700">
                          Fator de Perda ({base.loss_factor}%):
                        </td>
                        <td className="py-2 px-2 text-orange-600 font-semibold">
                          + R$ {(base.base_recipe_items.reduce((sum: number, item: any) => 
                            sum + (item.quantity * (item.ingredients?.unit_cost || 0)), 0
                          ) * (base.loss_factor / 100)).toFixed(4)}
                        </td>
                      </tr>
                      {/* Linha de Total Final */}
                      <tr className="bg-gray-100 border-t-2 border-gray-300">
                        <td colSpan={4} className="py-2 px-2 text-right font-bold text-gray-900">Custo Total:</td>
                        <td className="py-2 px-2 text-pink-600 font-bold text-base">
                          R$ {base.total_cost?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-3">
                <button 
                  onClick={() => handleEdit(base)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(base.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ProductsTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<FinalProduct[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [bases, setBases] = useState<BaseRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    loss_factor: '2',
    selling_price: '',
    profit_margin: '',
    items: [] as { item_type: string; item_id: string; quantity: string }[]
  })
  const [newItem, setNewItem] = useState({ item_type: 'ingredient', item_id: '', quantity: '' })

  useEffect(() => {
    fetchProducts()
    fetchIngredients()
    fetchBases()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/pricing/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/pricing/ingredients')
      if (response.ok) {
        const data = await response.json()
        setIngredients(data)
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error)
    }
  }

  const fetchBases = async () => {
    try {
      const response = await fetch('/api/pricing/bases')
      if (response.ok) {
        const data = await response.json()
        setBases(data)
      }
    } catch (error) {
      console.error('Erro ao buscar bases:', error)
    }
  }

  const handleAddItem = () => {
    if (newItem.item_id && newItem.quantity) {
      setFormData({
        ...formData,
        items: [...formData.items, newItem]
      })
      setNewItem({ item_type: 'ingredient', item_id: '', quantity: '' })
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/pricing/products?id=${editingId}`
        : '/api/pricing/products'
      
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const savedProduct = await response.json()
        
        if (editingId) {
          setProducts(products.map(prod => 
            prod.id === editingId ? savedProduct : prod
          ))
        } else {
          setProducts([savedProduct, ...products])
        }
        
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({
          name: '',
          category: '',
          description: '',
          loss_factor: '2',
          selling_price: '',
          profit_margin: '',
          items: []
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar produto')
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      alert('Erro ao salvar produto')
    }
  }

  const handleEdit = (product: FinalProduct) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || '',
      loss_factor: product.loss_factor.toString(),
      selling_price: product.selling_price?.toString() || '',
      profit_margin: product.profit_margin?.toString() || '',
      items: (product.final_product_items || []).map(item => ({
        item_type: item.item_type,
        item_id: item.item_type === 'ingredient' ? item.ingredient_id : item.base_recipe_id,
        quantity: item.quantity.toString()
      }))
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      category: '',
      description: '',
      loss_factor: '2',
      selling_price: '',
      profit_margin: '',
      items: []
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return

    try {
      const response = await fetch(`/api/pricing/products?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(products.filter(prod => prod.id !== id))
      } else {
        alert('Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }

  const getItemName = (item: any) => {
    if (item.item_type === 'ingredient') {
      const ing = ingredients.find(i => i.id === item.item_id)
      return ing?.name || 'Item não encontrado'
    } else {
      const base = bases.find(b => b.id === item.item_id)
      return base?.name || 'Item não encontrado'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Produtos Finais</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition font-semibold text-sm"
        >
          + Novo Produto
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Editar Produto Final" : "Cadastrar Novo Produto Final"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
              <input
                type="text"
                placeholder="Ex: Bolo de Chocolate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
              >
                <option value="">Selecione</option>
                <option value="cake">Bolo</option>
                <option value="cupcake">Cupcake</option>
                <option value="cookie">Cookie</option>
                <option value="pie">Torta</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fator de Perda (%) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="2"
                value={formData.loss_factor}
                onChange={(e) => setFormData({ ...formData, loss_factor: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="80.00"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margem de Lucro (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="60"
                value={formData.profit_margin}
                onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              rows={2}
              placeholder="Descrição do produto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="pt-4 border-t border-gray-300">
            <h4 className="font-medium text-gray-900 mb-3">Composição do Produto</h4>
            
            {/* Added items list */}
            {formData.items.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-900">
                      {item.item_type === 'ingredient' ? '📦 Insumo' : '🥄 Base'}: {getItemName(item)} - {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              <div>
                <select 
                  value={newItem.item_type}
                  onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value, item_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900"
                >
                  <option value="ingredient">Insumo</option>
                  <option value="base_recipe">Base</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select 
                  value={newItem.item_id}
                  onChange={(e) => setNewItem({ ...newItem, item_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900"
                >
                  <option value="">Selecione</option>
                  {newItem.item_type === 'ingredient' 
                    ? ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))
                    : bases.map((base) => (
                        <option key={base.id} value={base.id}>{base.name}</option>
                      ))
                  }
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Quantidade"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition font-semibold text-sm"
            >
              {editingId ? 'Atualizar Produto' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Products List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum produto cadastrado. Clique em "+ Novo Produto" para começar.</div>
        ) : (
          products.map((product) => {
            const profit = product.selling_price && product.total_cost 
              ? product.selling_price - product.total_cost 
              : 0
            const margin = product.selling_price && product.total_cost
              ? ((profit / product.selling_price) * 100)
              : 0

            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      Categoria: {product.category} | Perda: {product.loss_factor}%
                    </p>
                    {product.description && <p className="text-sm text-gray-600 mt-1">{product.description}</p>}
                  </div>
                  <div className="text-right">
                    {product.selling_price ? (
                      <>
                        <p className="text-lg font-bold text-pink-600">R$ {product.selling_price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Preço de Venda</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">Sem preço definido</p>
                    )}
                  </div>
                </div>
                {product.selling_price && (
                  <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Custo Total</p>
                      <p className="font-semibold text-gray-900">R$ {product.total_cost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lucro</p>
                      <p className="font-semibold text-green-600">R$ {profit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Margem</p>
                      <p className="font-semibold text-blue-600">{margin.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
                {product.final_product_items && product.final_product_items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Tipo</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Item</th>
                          <th className="text-left py-2 px-2 font-medium text-gray-700 text-xs">Qtde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.final_product_items.map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-600">
                              {item.item_type === 'ingredient' ? 'Insumo' : 'Base'}
                            </td>
                            <td className="py-2 px-2 text-gray-900">
                              {item.item_type === 'ingredient' 
                                ? item.ingredients?.name 
                                : item.base_recipes?.name}
                            </td>
                            <td className="py-2 px-2 text-gray-600">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-3">
                  <button 
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
