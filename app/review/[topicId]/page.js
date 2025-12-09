'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Send, Brain, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { submitReview } from '@/lib/actions'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// === SHARED COMPONENTS PORTED FROM LEARN PAGE ===

const cleanCodeContent = (content) => {
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

const MarkdownComponents = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl md:text-3xl font-bold mt-6 md:mt-10 mb-4 md:mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent inline-block pb-2 border-b border-white/10 w-full" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl md:text-2xl font-bold mt-6 md:mt-8 mb-3 md:mb-4 text-foreground flex items-center gap-2 group" {...props}>
      <div className="h-6 w-1 md:h-8 md:w-1 bg-primary rounded-full" />
      {props.children}
    </h2>
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg md:text-xl font-semibold mt-5 md:mt-6 mb-2 md:mb-3 text-foreground/90 pl-3 md:pl-4 border-l-2 border-primary/30" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mb-4 md:mb-6 leading-relaxed text-muted-foreground text-base md:text-lg" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-outside ml-4 md:ml-6 space-y-2 md:space-y-3 my-4 md:my-6 text-muted-foreground marker:text-primary" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-outside ml-4 md:ml-6 space-y-2 md:space-y-3 my-4 md:my-6 text-muted-foreground marker:text-primary list-decimal" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="[&>p]:!my-0 [&>p]:!inline pl-1 md:pl-0" {...props}>
      {props.children}
    </li>
  ),
  code: CodeBlock,
  pre: ({ node, ...props }) => (
    <pre className="!bg-transparent !p-0 !m-0 !rounded-none !border-none !shadow-none !ring-0 overflow-visible" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="my-8 pl-6 border-l-4 border-primary bg-primary/5 py-4 pr-4 rounded-r-xl italic text-lg text-muted-foreground" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg">
      <table className="w-full text-left border-collapse bg-white/5" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border-b border-white/10 p-4 font-semibold text-foreground bg-white/5" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border-b border-white/5 p-4 text-muted-foreground/90 tabular-nums" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a className="text-primary hover:text-primary/80 transition-colors underline decoration-primary/30 underline-offset-4 hover:decoration-primary" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-10 border-white/10" {...props} />
  ),
  img: ({ node, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="rounded-xl border border-white/10 shadow-lg my-8 w-full object-cover" alt={props.alt} {...props} />
  )
}


const MiniMarkdownComponents = {
  p: ({ node, ...props }) => <p className="mb-4 text-base md:text-lg text-foreground/90 leading-relaxed last:mb-0" {...props} />,
  strong: ({ node, ...props }) => <span className="font-bold text-primary" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-left space-y-2 text-muted-foreground" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-left space-y-2 text-muted-foreground" {...props} />,
  li: ({ node, ...props }) => <li className="marker:text-primary" {...props} />,
  code: ({ node, inline, children, ...props }) => {
    const codeContent = cleanCodeContent(children)
    const isShortSnippet = !codeContent.includes('\n') && codeContent.length < 60
    
    return (inline || isShortSnippet)
      ? <code className="bg-primary/10 text-primary px-1 rounded text-sm font-mono break-words whitespace-pre-wrap" {...props}>{codeContent}</code> 
      : <code className="block bg-muted/50 p-2 rounded-md text-sm font-mono my-2 whitespace-pre-wrap text-left border border-border" {...props}>{codeContent}</code>
  },
}

const Flashcard = ({ front, back, isFlipped, onFlip }) => {
  return (
    <div 
      className="relative w-full h-80 md:h-96 cursor-pointer group perspective-1000"
      onClick={onFlip}
    >
      <div className={`relative w-full h-full duration-700 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card className="h-full flex flex-col items-center justify-center p-8 glass-card border-primary/20 hover:border-primary/50 transition-colors shadow-2xl shadow-primary/5">
            <div className="absolute top-4 left-4 text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-50">
              Question
            </div>
            <CardContent className="text-center p-0">
               <div className="mb-6 mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
               </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {front}
              </h3>
              <p className="mt-8 text-sm text-muted-foreground animate-pulse">
                Click or Press Space to Flip
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <Card className="h-full flex flex-col p-8 bg-card border border-primary/30 shadow-2xl shadow-primary/10 relative">
             <div className="absolute top-4 left-4 text-xs font-mono text-primary uppercase tracking-widest opacity-70 z-10">
              Answer
            </div>
            <CardContent className="text-center p-0 h-full overflow-y-auto flex flex-col justify-center w-full pt-6">
              <div className="w-full">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={MiniMarkdownComponents}
                >
                    {back}
                </ReactMarkdown>
              </div>
            </CardContent>
             {/* Scroll Indicator Gradient */}
             <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </Card>
        </div>
      </div>
    </div>
  )
}

// === END SHARED COMPONENTS ===

const qualityLabels = [
  { value: 0, label: 'Complete Blackout', description: "I don't remember anything" },
  { value: 1, label: 'Familiar', description: 'I recognize it but incorrect answer' },
  { value: 2, label: 'Remembered', description: 'Incorrect but I remembered something' },
  { value: 3, label: 'Difficult', description: 'Correct with serious difficulty' },
  { value: 4, label: 'Hesitation', description: 'Correct after some hesitation' },
  { value: 5, label: 'Perfect', description: 'Perfect recall, no hesitation' },
]

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const topicId = params.topicId
  const [topic, setTopic] = useState(null)
  const [subject, setSubject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quality, setQuality] = useState([3])
  const [startTime, setStartTime] = useState(null)
  const [showContent, setShowContent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Flashcard State
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [flashcards, setFlashcards] = useState([])
  const [isFlipped, setIsFlipped] = useState(false)
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTopicData()
    setStartTime(Date.now())
  }, [topicId])

  const loadTopicData = async () => {
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('*, subjects(*)')
      .eq('id', topicId)
      .single()

    if (topicError) {
      console.error('Error loading topic:', topicError)
      toast.error('Failed to load topic')
      router.push('/dashboard')
      return
    }

    setTopic(topicData)
    setSubject(topicData.subjects)
    setLoading(false)
  }

  const handleSubmitReview = async () => {
    setSubmitting(true)
    const durationMinutes = startTime ? Math.round((Date.now() - startTime) / 60000) : 0
    
    const result = await submitReview(topicId, quality[0], durationMinutes)
    
    if (result.success) {
      const nextReview = format(new Date(result.nextReviewDate), 'MMM d, yyyy')
      toast.success(`Review complete! Next review: ${nextReview}`, { duration: 5000 })
      router.push(`/subjects/${subject.id}`)
    } else {
      toast.error('Failed to submit review')
      setSubmitting(false)
    }
  }

  const handleShowFlashcards = async () => {
     setShowFlashcards(true)
     
     if (flashcards.length > 0) return

     setGenerating(true)
     try {
         const response = await fetch('/api/generate-topic-flashcards', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 topicId: topic.id,
                 topicTitle: topic.title,
                 topicDescription: topic.description,
                 content: topic.content
             })
         })

         const result = await response.json()

         if (!response.ok) {
             throw new Error(result.error || 'Failed to generate flashcards')
         }

         if (result.flashcards && result.flashcards.length > 0) {
             setFlashcards(result.flashcards)
             setCurrentCard(0)
             setIsFlipped(false)
         } else {
             throw new Error('No flashcards returned')
         }

     } catch (error) {
         console.error('Flashcard generation error:', error)
         toast.error('Could not generate AI flashcards. Falling back to default.')
         
         const fallbackCards = [
            { front: 'What is the main concept?', back: topic.description || 'Review the topic description.' },
            { front: 'Key Takeaway', back: 'Reflect on the most important thing you learned from this section.' },
         ]
         setFlashcards(fallbackCards)
     } finally {
         setGenerating(false)
     }
  }

  // Handle Keyboard Navigation for Flashcards
  useEffect(() => {
    if (!showFlashcards) return

    const handleKeyDown = (e) => {
        if (e.code === 'Space') {
            e.preventDefault()
            setIsFlipped(prev => !prev)
        } else if (e.code === 'ArrowRight') {
            e.preventDefault()
            handleNextCard()
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault()
            handlePrevCard()
        }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showFlashcards, currentCard, flashcards.length])

  const handleNextCard = () => {
      setIsFlipped(false)
      setTimeout(() => {
          setCurrentCard(prev => (prev + 1) % flashcards.length)
      }, 150)
  }

  const handlePrevCard = () => {
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentCard(prev => (prev - 1 + flashcards.length) % flashcards.length)
      }, 150)
  }


  if (loading || !topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-medium">Loading Review...</span>
        </div>
      </div>
    )
  }

  // Flashcard View Overlay
  if (showFlashcards) {
    if (generating) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-primary overflow-hidden relative">
                 {/* Background Ambient Glow */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>
                
                <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Sparkles className="h-16 w-16 text-primary animate-spin-slow relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Synthesizing Flashcards...</h2>
                    <p className="text-muted-foreground animate-pulse">Consulting the AI for key concepts</p>
                </div>
            </div>
        )
    }

    if (flashcards.length > 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-primary overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="mb-8 flex justify-between items-end">
             <div>
                <Button variant="ghost" onClick={() => setShowFlashcards(false)} className="hover:bg-white/5 -ml-4 mb-2">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Review
                </Button>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">Flashcards</h2>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-mono border border-primary/20">
                        {topic.title}
                    </span>
                </div>
             </div>
             <div className="text-right">
                <div className="text-3xl font-bold font-mono text-primary">
                    {String(currentCard + 1).padStart(2, '0')}
                    <span className="text-muted-foreground text-lg">/{String(flashcards.length).padStart(2, '0')}</span>
                </div>
             </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/5 h-1.5 rounded-full mb-8 overflow-hidden">
             <div 
                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out" 
                style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
             />
          </div>

          <Flashcard 
            front={flashcards[currentCard].front}
            back={flashcards[currentCard].back}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          <div className="mt-12 flex justify-between items-center gap-4">
            <Button 
                variant="outline" 
                size="lg"
                onClick={handlePrevCard} 
                className="glass border-white/10 hover:bg-white/5 min-w-[120px]"
            >
              Previous
              <span className="ml-2 text-xs text-muted-foreground hidden md:inline-block border border-white/10 px-1.5 rounded bg-black/20">←</span>
            </Button>

            <div className="flex flex-col items-center gap-2">
                 <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium opacity-50">
                    Space to Flip
                 </span>
            </div>

            {currentCard === flashcards.length - 1 ? (
                 <Button 
                    size="lg"
                    onClick={() => setShowFlashcards(false)} 
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 min-w-[120px]"
                 >
                    <Check className="mr-2 h-5 w-5" />
                    Done
                 </Button>
            ) : (
                <Button 
                    variant="outline"
                    size="lg"
                    onClick={handleNextCard} 
                    className="glass border-white/10 hover:bg-white/5 min-w-[120px]"
                >
                    Next
                    <span className="ml-2 text-xs text-muted-foreground hidden md:inline-block border border-white/10 px-1.5 rounded bg-black/20">→</span>
                </Button>
            )}
          </div>
        </div>
      </div>
    )
    }
  }


  const currentQuality = qualityLabels[quality[0]]

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/subjects/${subject.id}`)} className="hover:bg-white/5">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="text-sm text-muted-foreground">{subject.title}</div>
                <h1 className="text-2xl font-bold tracking-tight">Review Session</h1>
              </div>
            </div>
            <div className="text-sm px-3 py-1 bg-white/5 rounded-full border border-white/5 text-muted-foreground">
              Last interval: {topic.interval_days} days
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="text-3xl text-center mb-4 tracking-tight">
              {topic.title}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Try to recall what you learned about this topic
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
                <div className="flex gap-4 justify-center mt-4">
                    <Button variant="outline" onClick={() => setShowContent(!showContent)} className="glass border-white/10 hover:bg-white/5">
                        {showContent ? 'Hide Content' : 'Show Content to Verify'}
                    </Button>
                    <Button variant="outline" onClick={handleShowFlashcards} className="glass border-white/10 hover:bg-white/5">
                        <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                        Revise with Flashcards
                    </Button>
                </div>

              {showContent && (
                <div className="bg-white/5 p-8 rounded-xl border border-white/5 mt-6 text-left animate-in fade-in slide-in-from-bottom-2">
                    <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/5">
                        <h3 className="text-xl font-semibold mb-3 text-foreground mt-0">Overview</h3>
                        <p className="text-lg leading-relaxed m-0 text-muted-foreground">{topic.description}</p>
                    </div>

                  {topic.content && (
                    <div className="markdown-content prose dark:prose-invert prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-primary prose-code:text-primary max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={MarkdownComponents}
                      >
                        {topic.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quality Rating */}
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl" >How well did you recall?</CardTitle>
            <p className="text-muted-foreground">Rate your recall quality (0-5)</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Quality Slider */}
            <div className="px-6">
              <Slider
                value={quality}
                onValueChange={setQuality}
                max={5}
                min={0}
                step={1}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between mt-4 text-xs font-mono text-muted-foreground">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            {/* Current Selection */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center transition-all">
              <div className="text-5xl font-bold text-primary mb-3">
                {currentQuality.value}
              </div>
              <div className="text-xl font-semibold mb-2 text-foreground">
                {currentQuality.label}
              </div>
              <div className="text-muted-foreground max-w-sm mx-auto">
                {currentQuality.description}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              size="lg" 
              onClick={handleSubmitReview} 
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 text-base font-medium"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
