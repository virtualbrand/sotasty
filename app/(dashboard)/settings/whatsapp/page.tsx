'use client';

import { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, XCircle, RefreshCw, LogOut, X, Info } from 'lucide-react';
import { showToast } from '@/app/(dashboard)/layout';

export default function WhatsAppSettings() {
  const [instanceName, setInstanceName] = useState('sotasty-whatsapp');
  const [qrCode, setQrCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [instanceCreated, setInstanceCreated] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [authMethod, setAuthMethod] = useState<'evolution' | 'official'>('evolution');
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  
  // Credenciais da API Oficial
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');

  console.log('Instance name:', instanceName, 'Loading:', loading);

  // Verificar status da conexão ao carregar
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        checkConnectionStatus(),
        loadSavedCredentials()
      ]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpar interval quando componente desmontar
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  const loadSavedCredentials = async () => {
    try {
      console.log('Carregando credenciais salvas...');
      const response = await fetch('/api/whatsapp/official/config');
      if (response.ok) {
        const data = await response.json();
        console.log('Config carregada:', data);
        
        if (data.config) {
          const config = data.config;
          setAuthMethod(config.auth_method || 'evolution');
          
          if (config.auth_method === 'official') {
            setPhoneNumberId(config.phone_number_id || '');
            setAccessToken(config.access_token || '');
            setBusinessAccountId(config.business_account_id || '');
            
            if (config.connected) {
              console.log('API Oficial já conectada');
              setConnectionStatus('connected');
              setInstanceCreated(true);
            }
          } else if (config.auth_method === 'evolution') {
            setInstanceName(config.instance_name || 'sotasty-whatsapp');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais salvas:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      console.log('Checking connection status for:', instanceName);
      
      // Primeiro, verificar se tem config da API Oficial
      const configResponse = await fetch('/api/whatsapp/official/config');
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.config && configData.config.auth_method === 'official' && configData.config.connected) {
          console.log('Conexão API Oficial encontrada');
          setConnectionStatus('connected');
          setInstanceCreated(true);
          setAuthMethod('official');
          return;
        }
      }
      
      // Se não tem API Oficial, verifica Evolution API
      const response = await fetch(`/api/whatsapp/status?instance=${instanceName}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.connected) {
        setConnectionStatus('connected');
        setInstanceCreated(true);
        setAuthMethod('evolution');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const createInstance = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/whatsapp/instance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar instância');
      }

      setInstanceCreated(true);
      
      showToast({
        title: '✨ Instância Criada',
        message: 'Agora escaneie o QR Code para conectar seu WhatsApp.',
        variant: 'success',
        duration: 4000,
      });
      
      // Buscar QR Code automaticamente
      await fetchQRCode();
      setShowQRModal(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      showToast({
        title: '❌ Erro ao Criar Instância',
        message: errorMessage,
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQRCode = async () => {
    // Limpa o QR code anterior para forçar regeneração
    setQrCode('');
    setConnectionStatus('disconnected');
    
    if (!instanceCreated) {
      await createInstance();
    } else {
      await fetchQRCode();
      setShowQRModal(true);
    }
  };

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      setConnectionStatus('connecting');

      const response = await fetch(`/api/whatsapp/instance/qrcode?instance=${instanceName}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar QR Code');
      }

      if (data.qrcode) {
        setQrCode(data.qrcode);
        
        // Limpar interval anterior se existir
        if (checkInterval) {
          clearInterval(checkInterval);
        }
        
        // Verificar conexão periodicamente
        const interval = setInterval(async () => {
          console.log('Verificando conexão para instância:', instanceName);
          try {
            const statusResponse = await fetch(`/api/whatsapp/status?instance=${instanceName}`);
            
            // Se der erro 404, a instância ainda não existe ou foi removida
            if (statusResponse.status === 404) {
              console.log('Instância não encontrada (404)');
              return;
            }
            
            const statusData = await statusResponse.json();
            console.log('Evolution API response:', statusData);
            
            // Verificar se está conectado (state === 'open')
            // A resposta vem como { connected: boolean, state: string, instance: {...} }
            const isOpen = statusData.state === 'open' || 
                          statusData.connected === true ||
                          (statusData.instance && statusData.instance.state === 'open');
            
            if (isOpen) {
              console.log('✅ WhatsApp conectado com sucesso!');
              
              // Limpar interval primeiro
              clearInterval(interval);
              setCheckInterval(null);
              
              // Atualizar estados
              setConnectionStatus('connected');
              setShowQRModal(false);
              setQrCode('');
              
              // Mensagem de sucesso com toast bonito
              showToast({
                title: '🎉 WhatsApp Conectado!',
                message: 'Agora você pode enviar e receber mensagens dos seus clientes.',
                variant: 'success',
                duration: 5000,
              });
              
              // Recarregar status
              await checkConnectionStatus();
            }
          } catch (err) {
            console.error('Erro ao verificar status:', err);
          }
        }, 2000); // Verificar a cada 2 segundos

        setCheckInterval(interval);

        // Limpar interval após 2 minutos
        setTimeout(() => {
          clearInterval(interval);
          setCheckInterval(null);
          if (connectionStatus === 'connecting') {
            setError('QR Code expirou. Gere um novo.');
            setConnectionStatus('disconnected');
          }
        }, 120000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      setConnectionStatus('disconnected');
      
      showToast({
        title: '❌ Erro ao Gerar QR Code',
        message: errorMessage,
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setLoading(true);
      setError('');

      if (authMethod === 'official') {
        // Desconectar API Oficial
        const response = await fetch('/api/whatsapp/official/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao desconectar');
        }
      } else {
        // Desconectar Evolution API
        const response = await fetch('/api/whatsapp/instance/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceName }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao desconectar');
        }
      }

      setConnectionStatus('disconnected');
      setQrCode('');
      setInstanceCreated(false);
      setShowQRModal(false);
      setShowDisconnectDialog(false);
      
      // Limpar credenciais da API Oficial
      if (authMethod === 'official') {
        setPhoneNumberId('');
        setAccessToken('');
        setBusinessAccountId('');
      }
      
      showToast({
        title: '👋 WhatsApp Desconectado',
        message: 'Sua conta foi desconectada com sucesso.',
        variant: 'default',
        duration: 3000,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      showToast({
        title: '❌ Erro ao Desconectar',
        message: errorMessage,
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectDialog(true);
  };

  const connectOfficialAPI = async () => {
    try {
      setLoading(true);
      setError('');

      // Validar campos
      if (!phoneNumberId.trim() || !accessToken.trim() || !businessAccountId.trim()) {
        throw new Error('Por favor, preencha todos os campos');
      }

      // Salvar credenciais no Supabase (ou localStorage temporariamente)
      const response = await fetch('/api/whatsapp/official/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId,
          accessToken,
          businessAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao conectar com API Oficial');
      }

      setConnectionStatus('connected');
      
      showToast({
        title: '🎉 API Oficial Conectada!',
        message: 'Suas credenciais foram salvas e validadas com sucesso.',
        variant: 'success',
        duration: 5000,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      showToast({
        title: '❌ Erro ao Conectar',
        message: errorMessage,
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status de Conexão - Sempre visível */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Configuração WhatsApp</h2>
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-[330px] bg-white text-[var(--color-licorice)] text-sm rounded-lg shadow-lg z-50 border border-gray-200" style={{ padding: '25px 15px 30px 20px' }}>
              Conecte seu WhatsApp para enviar e receber mensagens diretamente pela plataforma. Escolha entre Evolution API (auto-hospedado) ou API Oficial do WhatsApp (Meta).
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLoadingStatus ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Status da Conexão</h3>
                  <p className="text-sm text-gray-600 mt-1">Carregando...</p>
                </div>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check w-8 h-8 text-green-500" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Status da Conexão</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {connectionStatus === 'connected' && (
                      <span className="flex items-center gap-2">
                        <span className="text-green-600 font-medium">✓ WhatsApp conectado</span>
                        <span className="badge-status btn-outline-info text-xs px-2 py-0" style={{ fontSize: '0.6rem', padding: '2px 12px', lineHeight: '13px', cursor: 'default', pointerEvents: 'none' }}>
                          {authMethod === 'evolution' ? 'Evolution API' : 'API Oficial'}
                        </span>
                      </span>
                    )}
                    {connectionStatus === 'connecting' && 'Aguardando conexão...'}
                    {connectionStatus === 'disconnected' && 'WhatsApp não conectado'}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLoadingStatus && (
              <>
                {connectionStatus === 'connected' && (
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="btn-outline-danger px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Desconectar</span>
                      </>
                    )}
                  </button>
                )}
                {connectionStatus === 'connecting' && (
                  <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
                )}
                {connectionStatus === 'disconnected' && (
                  <XCircle className="w-6 h-6 text-gray-400" />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Se já está conectado, não mostrar formulários de conexão */}
      {connectionStatus === 'connected' ? null : (
        /* Se não está conectado, mostrar opções de conexão */
        <div className="relative">
          {/* Loading Overlay */}
          {isLoadingConfig && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-[var(--color-clay-500)] animate-spin" />
                <p className="text-sm text-gray-600 font-medium">Carregando configurações...</p>
              </div>
            </div>
          )}
          
          {/* Método de Autenticação */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Escolha o Método de Conexão</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecione como deseja conectar seu WhatsApp ao sistema.
            </p>
        
            <div className="space-y-3">
          {/* Evolution API */}
          <div
            onClick={() => setAuthMethod('evolution')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer border-2 transition-all ${
              authMethod === 'evolution'
                ? 'bg-pink-50 border-[var(--color-clay-500)]'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Evolution API</div>
              <p className="text-xs text-gray-500 mt-1">
                Open source, auto-hospedado, mais controle sobre seus dados
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                authMethod === 'evolution'
                  ? 'border-[var(--color-clay-500)] bg-[var(--color-clay-500)]'
                  : 'border-gray-300'
              }`}
            >
              {authMethod === 'evolution' && (
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>

          {/* API Oficial */}
          <div
            onClick={() => setAuthMethod('official')}
            className={`flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer border-2 transition-all ${
              authMethod === 'official'
                ? 'bg-pink-50 border-[var(--color-clay-500)]'
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">API Oficial do WhatsApp</div>
              <p className="text-xs text-gray-500 mt-1">
                API oficial da Meta, maior estabilidade e suporte empresarial
              </p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                authMethod === 'official'
                  ? 'border-[var(--color-clay-500)] bg-[var(--color-clay-500)]'
                  : 'border-gray-300'
              }`}
            >
              {authMethod === 'official' && (
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
              )}
            </div>
          </div>
        </div>

            {/* Informação adicional baseada na seleção */}
            {authMethod === 'official' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-2">ℹ️ API Oficial do WhatsApp</p>
                <p className="text-xs text-blue-700">
                  Para usar a API Oficial, você precisará de uma conta Meta Business, um número de telefone dedicado e aprovação da Meta. 
                  Este método é recomendado para empresas que precisam de alta confiabilidade e suporte oficial.
                </p>
              </div>
            )}
          </div>

          {/* Configuração de Instância */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {authMethod === 'evolution' ? 'Conectar via Evolution API' : 'Conectar via API Oficial'}
          </h2>
          
          {authMethod === 'evolution' ? (
            /* Evolution API - QR Code */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--old-rose)] focus:border-transparent"
                  placeholder="Ex: sotasty-whatsapp"
                  disabled={loading}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use apenas letras minúsculas, números e hífen
                </p>
              </div>

              <button
                onClick={handleGenerateQRCode}
                disabled={loading || !instanceName.trim()}
                className="w-full bg-[var(--color-clay-500)] text-white px-6 py-3 rounded-full hover:bg-[var(--color-clay-600)] transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {instanceCreated ? 'Gerando QR Code...' : 'Criando instância...'}
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Gerar QR Code para Conectar
                  </>
                )}
              </button>
            </div>
          ) : (
            /* API Oficial - Credenciais */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--old-rose)] focus:border-transparent"
                  placeholder="Ex: 123456789012345"
                  disabled={loading}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Encontre no Meta Business Manager, em API do WhatsApp
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--old-rose)] focus:border-transparent"
                  placeholder="Digite seu token de acesso"
                  disabled={loading}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token permanente gerado no Meta Business Manager
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Business Account ID
                </label>
                <input
                  type="text"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--old-rose)] focus:border-transparent"
                  placeholder="Ex: 123456789012345"
                  disabled={loading}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ID da sua conta comercial do WhatsApp
                </p>
              </div>

              <button
                onClick={connectOfficialAPI}
                disabled={loading || !phoneNumberId.trim() || !accessToken.trim() || !businessAccountId.trim()}
                className="w-full bg-[var(--color-clay-500)] text-white px-6 py-3 rounded-full hover:bg-[var(--color-clay-600)] transition-colors font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verificando credenciais...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Salvar e Conectar
                  </>
                )}
              </button>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium mb-2">📝 Como obter as credenciais:</p>
                <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Acesse <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">Meta Business Manager</a></li>
                  <li>Vá em &quot;API do WhatsApp&quot; no menu lateral</li>
                  <li>Configure seu número de telefone</li>
                  <li>Gere um token de acesso permanente</li>
                  <li>Copie o Phone Number ID e o Access Token</li>
                </ol>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrCode && showQRModal && connectionStatus === 'connecting' && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6 relative shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--lavender-blush)] rounded-full mb-2">
                <QrCode className="w-6 h-6 text-[var(--old-rose)]" />
              </div>
              
              <h2 className="text-xl font-semibold">Escaneie o QR Code</h2>
              <p className="text-sm text-[var(--slate-gray)]">
                Abra o WhatsApp no seu celular e escaneie este código
              </p>
              
              <div className="flex justify-center py-4">
                <div className="p-4 bg-white border-2 border-[var(--old-rose)] rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64"
                  />
                </div>
              </div>

              <div className="text-xs text-[var(--slate-gray)] space-y-1.5 bg-[var(--lavender-blush)] p-4 rounded-lg text-left">
                <p className="font-semibold text-sm mb-2">Como conectar:</p>
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em <strong>Configurações</strong> ou <strong>Mais opções</strong></p>
                <p>3. Toque em <strong>Dispositivos conectados</strong></p>
                <p>4. Toque em <strong>Conectar dispositivo</strong></p>
                <p>5. Aponte seu celular para este QR Code</p>
              </div>

              {/* Indicador de verificação */}
              <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-700 font-medium">
                  Aguardando conexão... Escaneie o QR Code no celular
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={async () => {
                    // Forçar verificação e fechar modal
                    setShowQRModal(false);
                    setConnectionStatus('connected');
                    if (checkInterval) {
                      clearInterval(checkInterval);
                      setCheckInterval(null);
                    }
                    
                    showToast({
                      title: '✅ Verificando Conexão',
                      message: 'Aguarde enquanto verificamos o status do WhatsApp...',
                      variant: 'default',
                      duration: 3000,
                    });
                    
                    await checkConnectionStatus();
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Já Conectei
                </button>
                
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setQrCode('');
                    setConnectionStatus('disconnected');
                    if (checkInterval) {
                      clearInterval(checkInterval);
                      setCheckInterval(null);
                    }
                  }}
                  className="bg-gray-500 text-white px-6 py-3 rounded-full hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>

              <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                ⏱️ O QR Code expira em 2 minutos
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Alert Dialog para Desconectar */}
      {showDisconnectDialog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDisconnectDialog(false)}
        >
          <div 
            role="alertdialog"
            aria-labelledby="disconnect-dialog-title"
            aria-describedby="disconnect-dialog-description"
            data-state="open"
            className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100%-4rem)] w-full -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto border bg-background p-6 shadow-lg shadow-black/5 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:max-w-[400px] sm:rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex flex-col space-y-1 text-center sm:text-left">
              <h2 id="disconnect-dialog-title" className="text-lg font-semibold">
                Desconectar WhatsApp
              </h2>
              <p id="disconnect-dialog-description" className="text-sm text-muted-foreground">
                Tem certeza que deseja desconectar o WhatsApp? Você precisará reconectar para enviar mensagens novamente.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
              <button
                type="button"
                onClick={() => setShowDisconnectDialog(false)}
                disabled={loading}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mt-2 sm:mt-0 btn-secondary-outline"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={disconnect}
                disabled={loading}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 btn-danger"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Desconectando...
                  </>
                ) : (
                  'Desconectar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
