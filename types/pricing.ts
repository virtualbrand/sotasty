// Pricing Module Types

export type UnitType = 'gramas' | 'kg' | 'ml' | 'litros' | 'unidades'

export interface Ingredient {
  id: string
  name: string
  volume: number
  unit: UnitType
  unit_cost: number // custo médio por unidade
  unit_price: number // custo unitário (calculado)
  loss_factor: number // fator de perda em porcentagem
  created_at: string
  updated_at: string
}

export interface BaseRecipe {
  id: string
  name: string
  description?: string
  total_cost: number
  loss_factor: number
  base_recipe_items?: BaseRecipeItem[]
  created_at: string
  updated_at: string
}

export interface BaseRecipeItem {
  id: string
  base_recipe_id: string
  ingredient_id: string
  quantity: number
  ingredients?: {
    id: string
    name: string
    unit: UnitType
    unit_cost: number
  }
  created_at: string
}

export interface FinalProduct {
  id: string
  name: string
  description?: string
  category: string
  total_cost: number
  sale_price: number
  profit_margin: number
  loss_factor: number
  created_at: string
  updated_at: string
}

export interface FinalProductItem {
  id: string
  product_id: string
  item_type: 'ingredient' | 'base_recipe'
  item_id: string
  item_name: string
  quantity: number
  unit: UnitType
  unit_cost: number
  loss_factor: number
  total_cost: number
  created_at: string
}
