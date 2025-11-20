'use client';

import { useState, useEffect } from 'react';
import { QrCode, Smartphone, CheckCircle2, XCircle, RefreshCw, LogOut, X } from 'lucide-react';
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

  console.log('Instance name:', instanceName, 'Loading:', loading);

  // Verificar status da conexão ao carregar
  useEffect(() => {
    checkConnectionStatus();
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

  const checkConnectionStatus = async () => {
    try {
      console.log('Checking connection status for:', instanceName);
      const response = await fetch(`/api/whatsapp/status?instance=${instanceName}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.connected) {
        setConnectionStatus('connected');
        setInstanceCreated(true);
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setConnectionStatus('disconnected');
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

      const response = await fetch('/api/whatsapp/instance/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desconectar');
      }

      setConnectionStatus('disconnected');
      setQrCode('');
      setInstanceCreated(false);
      setShowQRModal(false);
      
      showToast({
        title: '👋 WhatsApp Desconectado',
        message: 'Sua conta foi desconectada com sucesso.',
        variant: 'default',
        duration: 3000,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async () => {
    if (!confirm('Tem certeza que deseja deletar a instância do WhatsApp? Você precisará reconectar depois.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Primeiro tenta desconectar se estiver conectado
      if (connectionStatus === 'connected') {
        console.log('Desconectando antes de deletar...');
        try {
          await fetch('/api/whatsapp/instance/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instanceName }),
          });
          // Aguardar 1 segundo para garantir que desconectou
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.log('Erro ao desconectar (continuando com delete):', err);
        }
      }

      console.log('Deletando instância:', instanceName);
      const response = await fetch('/api/whatsapp/instance/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      });

      const data = await response.json();
      console.log('Response delete:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar instância');
      }

      // Resetar todos os estados
      setConnectionStatus('disconnected');
      setQrCode('');
      setInstanceCreated(false);
      setShowQRModal(false);
      
      showToast({
        title: '🗑️ Instância Deletada',
        message: 'A instância do WhatsApp foi removida. Você pode conectar novamente quando quiser.',
        variant: 'success',
        duration: 4000,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      showToast({
        title: '❌ Erro ao Deletar',
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
      <div>
        <h1 className="text-3xl font-bold">Configuração WhatsApp</h1>
        <p className="text-[var(--slate-gray)] mt-2">
          Conecte seu WhatsApp para enviar e receber mensagens
        </p>
      </div>

      {/* Status de Conexão */}
      <div className="bg-white rounded-lg border border-[var(--lavender-blush)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-[var(--old-rose)]" />
            <div>
              <h2 className="text-lg font-semibold">Status da Conexão</h2>
              <p className="text-sm text-[var(--slate-gray)]">
                {connectionStatus === 'connected' && 'WhatsApp conectado e pronto'}
                {connectionStatus === 'connecting' && 'Aguardando conexão...'}
                {connectionStatus === 'disconnected' && 'WhatsApp não conectado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
            {connectionStatus === 'connecting' && (
              <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
            )}
            {connectionStatus === 'disconnected' && (
              <button
                onClick={deleteInstance}
                disabled={loading}
                className="p-2 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                title="Deletar instância"
              >
                <XCircle className="w-6 h-6 text-red-500 hover:text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuração de Instância */}
      {connectionStatus !== 'connected' && (
        <div className="bg-white rounded-lg border border-[var(--lavender-blush)] p-6">
          <h2 className="text-lg font-semibold mb-4">Conectar WhatsApp</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome da Instância
              </label>
              <input
                type="text"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--lavender-blush)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--old-rose)]"
                placeholder="Ex: sotasty-whatsapp"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-[var(--slate-gray)] mt-1">
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

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
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

      {/* Conectado - Opções */}
      {connectionStatus === 'connected' && (
        <div className="bg-white rounded-lg border border-[var(--lavender-blush)] p-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            
            <div>
              <h2 className="text-lg font-semibold">WhatsApp Conectado!</h2>
              <p className="text-sm text-[var(--slate-gray)]">
                Instância: <strong>{instanceName}</strong>
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={disconnect}
                disabled={loading}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    Desconectar WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
