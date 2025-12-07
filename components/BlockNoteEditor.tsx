'use client'

import { useEffect, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { pt } from '@blocknote/core/locales'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'

interface BlockNoteEditorProps {
  value: string
  onChange: (value: string) => void
  onEscapePress?: () => void
}

export function BlockNoteEditorComponent({ value, onChange, onEscapePress }: BlockNoteEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Criar editor com tradução pt-BR
  const editor = useCreateBlockNote({
    dictionary: pt,
  })

  // Montar componente (evitar SSR issues)
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Carregar conteúdo inicial
  useEffect(() => {
    if (editor && value && isMounted) {
      try {
        // Tentar parsear como JSON primeiro
        const blocks = JSON.parse(value)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor.replaceBlocks(editor.document, blocks as any)
      } catch {
        // Se não for JSON, tratar como texto simples
        if (value.trim()) {
          const lines = value.split('\n')
          const blocks = lines.map(line => ({
            type: 'paragraph' as const,
            content: line ? [{ type: 'text' as const, text: line, styles: {} }] : []
          }))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          editor.replaceBlocks(editor.document, blocks as any)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, isMounted])

  // Atualizar quando o editor muda
  const handleChange = () => {
    const blocks = editor.document
    // Salvar como JSON para preservar toda a formatação
    const json = JSON.stringify(blocks, null, 2)
    onChange(json)
  }

  // Handler para ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapePress) {
        onEscapePress()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscapePress])

  // Ocultar itens indesejados do dropdown dinamicamente com JavaScript
  useEffect(() => {
    const hideUnwantedItems = () => {
      // Itens para ocultar do dropdown slash command (em português)
      const itemsToHide = [
        'Toggle List',
        'Check List', 
        'Heading 6',
        'Toggle Heading 1',
        'Toggle Heading 2',
        'Toggle Heading 3',
        'Quote',
        // Versões em português
        'Título 5',
        'Título 6',
        'Título Expansível',
        'Lista expansível',
        'Lista de verificação',
        'Citação'
      ]
      
      // Ocultar itens do menu
      const menuItems = document.querySelectorAll('.mantine-Menu-item')
      menuItems.forEach((item) => {
        const label = item.querySelector('.mantine-Menu-itemLabel')
        const labelText = label?.textContent?.trim() || ''
        
        if (itemsToHide.some(hideText => labelText.includes(hideText))) {
          (item as HTMLElement).style.display = 'none'
        }
      })

      // Ocultar botão "Create Link" da toolbar flutuante
      const allButtons = document.querySelectorAll('button[role="menuitem"], button[aria-label]')
      allButtons.forEach((btn) => {
        const ariaLabel = btn.getAttribute('aria-label') || ''
        const textContent = btn.textContent || ''
        
        // Itens da toolbar para ocultar
        const toolbarItemsToHide = [
          'Create Link',
          'Criar link',
          'Link',
          'Riscado',
          'Strike',
          'Alinhar',
          'Align',
          'Aninhar',
          'Nest',
          'Unnest',
          'Desaninhar',
          'Cores',
          'Colors',
          'Color',
          'Cor'
        ]
        
        if (toolbarItemsToHide.some(hideText => 
          ariaLabel.includes(hideText) || textContent.includes(hideText)
        )) {
          (btn as HTMLElement).style.display = 'none'
        }
      })
    }

    // Observar mudanças no DOM
    const observer = new MutationObserver(hideUnwantedItems)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Aplicar imediatamente
    hideUnwantedItems()

    return () => observer.disconnect()
  }, [])

  if (!isMounted) {
    return <div className="p-4 min-h-[300px] animate-pulse bg-gray-50 rounded-lg" />
  }

  return (
    <div 
      className="border rounded-lg overflow-visible bg-white relative"
      style={{
        fontFamily: 'var(--font-kumbh-sans)',
        minHeight: '150px',
        zIndex: 1,
      }}
    >
      <style jsx global>{`
        .bn-container .bn-editor {
          min-height: 150px;
          max-height: 400px;
          overflow-y: auto;
        }
        .bn-container [data-node-type="blockContainer"] {
          font-family: var(--font-kumbh-sans);
          font-size: 1rem;
          line-height: 1.5;
        }
        .bn-suggestion-menu {
          z-index: 9999999 !important;
          position: fixed !important;
          width: 300px !important;
          max-height: 500px !important;
          overflow-y: auto !important;
        }
        .mantine-Menu-dropdown {
          z-index: 9999999 !important;
          position: fixed !important;
          width: 300px !important;
          max-height: 500px !important;
          overflow-y: auto !important;
        }
        [data-mantine-portal] {
          z-index: 9999999 !important;
        }
        .bn-container [role="menu"] {
          z-index: 9999999 !important;
        }
        /* Ocultar itens da toolbar: strikethrough, text color, background color, align, link */
        .bn-toolbar-button[data-test="strikethrough"],
        .bn-toolbar-button[data-test="textColor"],
        .bn-toolbar-button[data-test="backgroundColor"],
        .bn-toolbar-button[data-test="textAlign"],
        .bn-toolbar-button[data-test="createLink"],
        .bn-toolbar-button[data-test="nestBlock"],
        .bn-toolbar-button[data-test="unnestBlock"],
        button[data-test="createLink"],
        button[aria-label="Create link"],
        [aria-label*="Strike"],
        [aria-label*="Text Color"],
        [aria-label*="Background Color"],
        [aria-label*="Align"],
        [aria-label*="Create Link"],
        [aria-label*="Nest"],
        [aria-label*="Unnest"],
        [aria-label*="Colors"],
        [aria-label*="Toggle Heading"],
        [aria-label*="Toggle List"],
        button[aria-label="Strike"],
        button[aria-label*="Unnest"],
        button[aria-label*="Create Link"],
        button[id*="mantine"][id*="target"]:has(svg[data-icon="link"]),
        .mantine-Menu-item:has([aria-label*="Toggle Heading"]),
        .mantine-Menu-item:contains("Toggle Heading"),
        .mantine-Menu-item:has([aria-label*="Toggle List"]),
        .mantine-Menu-item:contains("Toggle List") {
          display: none !important;
        }
      `}</style>
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
        formattingToolbar={true}
      />
    </div>
  )
}
