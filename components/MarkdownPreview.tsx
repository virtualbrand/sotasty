'use client'

import { ReactNode } from 'react'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Heading 1
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
            {processInlineFormatting(line.substring(2))}
          </h1>
        )
      }
      // Heading 2
      else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-xl font-bold text-gray-900 mt-5 mb-2 first:mt-0">
            {processInlineFormatting(line.substring(3))}
          </h2>
        )
      }
      // Heading 3
      else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-lg font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
            {processInlineFormatting(line.substring(4))}
          </h3>
        )
      }
      // Quote
      else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-gray-300 pl-4 py-2 my-3 text-gray-700 italic">
            {processInlineFormatting(line.substring(2))}
          </blockquote>
        )
      }
      // Todo list
      else if (line.match(/^- \[[ x]\] /)) {
        const checked = line.includes('[x]')
        const text = line.substring(6)
        elements.push(
          <div key={i} className="flex items-start gap-2 my-1">
            <input
              type="checkbox"
              checked={checked}
              readOnly
              className="mt-1 cursor-default"
            />
            <span className={checked ? 'line-through text-gray-500' : 'text-gray-700'}>
              {processInlineFormatting(text)}
            </span>
          </div>
        )
      }
      // Unordered list
      else if (line.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-6 my-1 text-gray-700 list-disc">
            {processInlineFormatting(line.substring(2))}
          </li>
        )
      }
      // Ordered list
      else if (line.match(/^\d+\. /)) {
        const text = line.substring(line.indexOf('. ') + 2)
        elements.push(
          <li key={i} className="ml-6 my-1 text-gray-700 list-decimal">
            {processInlineFormatting(text)}
          </li>
        )
      }
      // Code block
      else if (line.startsWith('```')) {
        const codeLines: string[] = []
        i++ // Skip opening ```
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i])
          i++
        }
        elements.push(
          <pre key={i} className="bg-gray-900 text-gray-100 p-4 rounded-lg my-3 overflow-x-auto">
            <code className="text-sm font-mono">{codeLines.join('\n')}</code>
          </pre>
        )
      }
      // Empty line
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />)
      }
      // Regular paragraph
      else {
        elements.push(
          <p key={i} className="text-gray-700 leading-relaxed my-2">
            {processInlineFormatting(line)}
          </p>
        )
      }
    }

    return elements
  }

  const processInlineFormatting = (text: string): (string | ReactNode)[] => {
    const parts: (string | ReactNode)[] = []
    let currentIndex = 0
    let keyCounter = 0

    // Bold: **text**
    const boldRegex = /\*\*(.+?)\*\*/g
    // Italic: *text*
    const italicRegex = /\*(.+?)\*/g
    // Inline code: `code`
    const codeRegex = /`(.+?)`/g

    const allMatches: Array<{ index: number; length: number; type: string; content: string }> = []

    // Find all bold matches
    let match
    while ((match = boldRegex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'bold',
        content: match[1]
      })
    }

    // Find all italic matches (excluding bold)
    const textWithoutBold = text.replace(/\*\*(.+?)\*\*/g, (_, content) => '§'.repeat(content.length + 4))
    while ((match = italicRegex.exec(textWithoutBold)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'italic',
        content: text.substring(match.index + 1, match.index + match[0].length - 1)
      })
    }

    // Find all code matches
    while ((match = codeRegex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        type: 'code',
        content: match[1]
      })
    }

    // Sort by index
    allMatches.sort((a, b) => a.index - b.index)

    // Process text with formatting
    for (const formatting of allMatches) {
      // Add text before this formatting
      if (currentIndex < formatting.index) {
        parts.push(text.substring(currentIndex, formatting.index))
      }

      // Add formatted text
      if (formatting.type === 'bold') {
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-bold">
            {formatting.content}
          </strong>
        )
      } else if (formatting.type === 'italic') {
        parts.push(
          <em key={`italic-${keyCounter++}`} className="italic">
            {formatting.content}
          </em>
        )
      } else if (formatting.type === 'code') {
        parts.push(
          <code key={`code-${keyCounter++}`} className="bg-gray-100 text-[var(--color-clay-500)] px-1.5 py-0.5 rounded text-sm font-mono">
            {formatting.content}
          </code>
        )
      }

      currentIndex = formatting.index + formatting.length
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderMarkdown(content)}
    </div>
  )
}
