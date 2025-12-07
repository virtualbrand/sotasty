'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Info } from 'lucide-react'
import { showToast } from '@/app/(dashboard)/layout'
import { ActivitySettings } from '@/lib/activityLogger'

export default function CustomersSettingsPage() {
  // Inicializar com valores do localStorage
  const [showCpfCnpj, setShowCpfCnpj] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customerSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showCpfCnpj ?? true
      }
    }
    return true
  })

  const [showPhoto, setShowPhoto] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customerSettings')
      if (saved) {
        const settings = JSON.parse(saved)
        return settings.showPhoto ?? true
      }
    }
    return true
  })

  // Salvar configurações no localStorage quando houver mudanças
  const updateSetting = (key: string, value: boolean) => {
    const currentSettings = localStorage.getItem('customerSettings')
    const settings = currentSettings ? JSON.parse(currentSettings) : {}
    settings[key] = value
    localStorage.setItem('customerSettings', JSON.stringify(settings))
  }

  const handleCpfCnpjToggle = async (checked: boolean) => {
    setShowCpfCnpj(checked)
    updateSetting('showCpfCnpj', checked)
    
    // Registrar atividade
    await ActivitySettings.customerCpfCnpjToggled(checked)
    
    showToast({
      title: checked ? 'Campo CPF/CNPJ ativado' : 'Campo CPF/CNPJ desativado',
      message: checked 
        ? 'O campo de CPF/CNPJ será exibido ao cadastrar clientes'
        : 'O campo de CPF/CNPJ foi ocultado no cadastro de clientes',
      variant: 'success',
      duration: 3000,
    })
  }

  const handlePhotoToggle = async (checked: boolean) => {
    setShowPhoto(checked)
    updateSetting('showPhoto', checked)
    
    // Registrar atividade
    await ActivitySettings.customerPhotoToggled(checked)
    
    showToast({
      title: checked ? 'Campo de foto ativado' : 'Campo de foto desativado',
      message: checked 
        ? 'O campo de foto será exibido ao cadastrar clientes'
        : 'O campo de foto foi ocultado no cadastro de clientes',
      variant: 'success',
      duration: 3000,
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Clientes</h2>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
            Configure a visibilidade dos campos no formulário de cadastro e edição de clientes.
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Campos do Formulário</h3>

        <div className="space-y-4">
          {/* CPF/CNPJ */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="show-cpf-cnpj" className="text-sm font-semibold text-gray-900 cursor-pointer">
                CPF/CNPJ
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Exibir campo de CPF/CNPJ ao cadastrar clientes
              </p>
            </div>
            <Switch
              id="show-cpf-cnpj"
              checked={showCpfCnpj}
              onCheckedChange={handleCpfCnpjToggle}
            />
          </div>

          {/* Foto */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label htmlFor="show-photo" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Foto do Cliente
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Exibir campo de foto ao cadastrar clientes
              </p>
            </div>
            <Switch
              id="show-photo"
              checked={showPhoto}
              onCheckedChange={handlePhotoToggle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
