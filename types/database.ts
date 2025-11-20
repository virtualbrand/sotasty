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

// Menu System Types
export interface ProfileSettings {
  id: string
  user_id: string
  business_name?: string
  custom_url_slug?: string // Ex: "conto-atelier"
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  description?: string
  whatsapp_number?: string
  instagram_handle?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Menu {
  id: string
  user_id: string
  name: string
  description?: string
  url_slug: string // Ex: "cardapio-bolos"
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  menu_id: string
  product_id?: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  display_order: number
  available: boolean
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  menu_id: string
  name: string
  description?: string
  display_order: number
  created_at: string
}

export interface MenuView {
  id: string
  menu_id: string
  viewed_at: string
  ip_address?: string
  user_agent?: string
  referrer?: string
}

// Public Menu Response
export interface PublicMenuData {
  menu: {
    id: string
    name: string
    description?: string
    active: boolean
  }
  business: {
    name?: string
    description?: string
    logo_url?: string
    whatsapp_number?: string
    instagram_handle?: string
    primary_color?: string
    secondary_color?: string
  }
  items: MenuItem[]
  categories?: MenuCategory[]
}
