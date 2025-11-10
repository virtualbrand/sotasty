// Database Types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: 'cake' | 'cupcake' | 'cookie' | 'pie' | 'other'
  image_url?: string
  available: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
  total_amount: number
  delivery_date?: string
  delivery_address?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  customization?: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  created_at: string
}
