import { useState } from 'react'

interface ProductSettings {
  showLossFactorIngredients: boolean
  showLossFactorBases: boolean
  showLossFactorProducts: boolean
  showProductPhoto: boolean
  showIngredientPhoto: boolean
  showBasePhoto: boolean
  measurementUnit: 'metric-large' | 'metric-small' // kg/L ou g/ml
}

const defaultSettings: ProductSettings = {
  showLossFactorIngredients: true,
  showLossFactorBases: true,
  showLossFactorProducts: true,
  showProductPhoto: true,
  showIngredientPhoto: true,
  showBasePhoto: true,
  measurementUnit: 'metric-small', // padrão g/ml
}

function getInitialSettings(): ProductSettings {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('productSettings')
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved)
        return { ...defaultSettings, ...parsedSettings }
      } catch (error) {
        console.error('Error parsing product settings:', error)
      }
    }
  }
  return defaultSettings
}

export function useProductSettings() {
  const [settings] = useState<ProductSettings>(getInitialSettings)
  return settings
}
