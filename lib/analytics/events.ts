import { trackEvent } from './posthog'

// Eventos de autenticação
export const trackSignup = (userId: string, plan: string) => {
  trackEvent('user_signed_up', { userId, plan })
}

export const trackLogin = (userId: string) => {
  trackEvent('user_logged_in', { userId })
}

export const trackLogout = () => {
  trackEvent('user_logged_out')
}

// Eventos de produto
export const trackProductCreated = (productId: string, category: string) => {
  trackEvent('product_created', { productId, category })
}

export const trackProductViewed = (productId: string) => {
  trackEvent('product_viewed', { productId })
}

export const trackProductEdited = (productId: string) => {
  trackEvent('product_edited', { productId })
}

export const trackProductDeleted = (productId: string) => {
  trackEvent('product_deleted', { productId })
}

// Eventos de pedidos
export const trackOrderCreated = (orderId: string, value: number, customerId: string) => {
  trackEvent('order_created', { orderId, value, customerId })
}

export const trackOrderStatusChanged = (orderId: string, oldStatus: string, newStatus: string) => {
  trackEvent('order_status_changed', { orderId, oldStatus, newStatus })
}

// Eventos de clientes
export const trackCustomerCreated = (customerId: string) => {
  trackEvent('customer_created', { customerId })
}

export const trackCustomerViewed = (customerId: string) => {
  trackEvent('customer_viewed', { customerId })
}

// Eventos de navegação
export const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
  trackEvent('page_viewed', { pageName, ...properties })
}

export const trackFeatureUsed = (featureName: string, properties?: Record<string, unknown>) => {
  trackEvent('feature_used', { featureName, ...properties })
}

// Eventos de assinatura
export const trackSubscriptionStarted = (plan: string, userId: string) => {
  trackEvent('subscription_started', { plan, userId })
}

export const trackSubscriptionCanceled = (plan: string, reason?: string) => {
  trackEvent('subscription_canceled', { plan, reason })
}

export const trackSubscriptionUpgraded = (oldPlan: string, newPlan: string) => {
  trackEvent('subscription_upgraded', { oldPlan, newPlan })
}

// Eventos de engajamento
export const trackWhatsAppMessageSent = (customerId: string) => {
  trackEvent('whatsapp_message_sent', { customerId })
}

export const trackReportGenerated = (reportType: string) => {
  trackEvent('report_generated', { reportType })
}

export const trackSettingsChanged = (settingName: string, newValue: unknown) => {
  trackEvent('settings_changed', { settingName, newValue })
}
