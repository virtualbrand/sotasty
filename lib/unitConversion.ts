// Funções utilitárias para conversão de unidades

export type MeasurementUnit = 'metric-large' | 'metric-small'

// Converte de g/ml (banco) para a unidade de exibição escolhida
export function convertFromSmallUnit(value: number, unit: string, targetSystem: MeasurementUnit): number {
  if (targetSystem === 'metric-small') return value
  
  // Converter de g para kg ou ml para L
  if (unit === 'gramas' || unit === 'ml') {
    return value / 1000
  }
  
  return value // unidades não são convertidas
}

// Converte da unidade de exibição para g/ml (banco)
export function convertToSmallUnit(value: number, unit: string, currentSystem: MeasurementUnit): number {
  if (currentSystem === 'metric-small') return value
  
  // Converter de kg para g ou L para ml
  if (unit === 'kg' || unit === 'L') {
    return value * 1000
  }
  
  return value // unidades não são convertidas
}

// Retorna a unidade de exibição baseado no sistema escolhido
export function getDisplayUnit(baseUnit: string, measurementSystem: MeasurementUnit): string {
  if (measurementSystem === 'metric-small') {
    return baseUnit
  }
  
  // Converter para unidades grandes
  const unitMap: { [key: string]: string } = {
    'gramas': 'kg',
    'ml': 'L',
    'unidades': 'unidades'
  }
  
  return unitMap[baseUnit] || baseUnit
}

// Retorna as opções de unidade baseado no sistema escolhido
export function getUnitOptions(measurementSystem: MeasurementUnit): Array<{ value: string; label: string }> {
  if (measurementSystem === 'metric-small') {
    return [
      { value: 'gramas', label: 'Gramas (g)' },
      { value: 'ml', label: 'Mililitros (ml)' },
      { value: 'unidades', label: 'Unidades' }
    ]
  }
  
  return [
    { value: 'kg', label: 'Quilogramas (kg)' },
    { value: 'L', label: 'Litros (L)' },
    { value: 'unidades', label: 'Unidades' }
  ]
}

// Formata o valor com a unidade apropriada
export function formatQuantityWithUnit(
  value: number, 
  baseUnit: string, 
  measurementSystem: MeasurementUnit,
  decimals: number = 2
): string {
  const convertedValue = convertFromSmallUnit(value, baseUnit, measurementSystem)
  const displayUnit = getDisplayUnit(baseUnit, measurementSystem)
  
  return `${convertedValue.toFixed(decimals)} ${displayUnit}`
}

// Abreviação de unidades
export function getUnitAbbreviation(unit: string): string {
  const abbreviations: { [key: string]: string } = {
    'gramas': 'g',
    'kg': 'kg',
    'ml': 'ml',
    'L': 'L',
    'litros': 'L',
    'quilogramas': 'kg',
    'unidades': 'un'
  }
  return abbreviations[unit.toLowerCase()] || unit
}
