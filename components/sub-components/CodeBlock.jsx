'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export const cleanCodeContent = (content) => {
  let cleaned = String(content).replace(/\n$/, '')
  let prev
  do {
    prev = cleaned
    // Recursively strip any combination of leading/trailing backticks and whitespace
    cleaned = cleaned.trim().replace(/^`+|`+$/g, '').trim()
  } while (cleaned !== prev)
  return cleaned
}

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const codeContent = cleanCodeContent(children)
  
  const [copied, setCopied] = useState(false)
  const isSingleLine = !codeContent.includes('\n') && codeContent.length < 80
  const isShortSnippet = !codeContent.includes('\n') && codeContent.length < 60

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Force inline style for actual inline code OR short snippets
  if (inline || isShortSnippet) {
    return (
      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-mono text-sm border border-primary/20 break-words whitespace-pre-wrap align-middle" {...props}>
        {codeContent}
      </code>
    )
  }

  // "Single Line" Block
  if (isSingleLine) {
    return (
      <div className="relative group my-4 inline-block max-w-full align-middle w-full">
         <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
             <button
            onClick={handleCopy}
            className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow-sm hover:bg-primary/90 transition-colors"
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
        <code className={`block ${className} bg-zinc-50 dark:bg-[#0d1117] px-4 py-3 rounded-lg border border-border dark:border-white/10 shadow-sm font-mono text-sm leading-relaxed overflow-x-auto custom-scrollbar whitespace-pre-wrap break-words placeholder:break-all text-zinc-900 dark:text-zinc-100`} {...props}>
          {codeContent}
        </code>
      </div>
    )
  }

  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-border dark:border-white/5 shadow-2xl bg-zinc-50 dark:bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-white/5 border-b border-border dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm" />
          </div>
          {language && (
            <span className="ml-3 text-xs font-mono text-muted-foreground font-medium uppercase tracking-wider">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-white/5"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span className="uppercase text-[10px] font-bold tracking-wider text-green-500">Copied</span>
              </>
            ) : (
              <span className="uppercase text-[10px] font-bold tracking-wider">Copy</span>
            )}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <code className={`${className} font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-zinc-900 dark:text-zinc-100`} {...props}>
          {codeContent}
        </code>
      </div>
    </div>
  )
}

export default CodeBlock
