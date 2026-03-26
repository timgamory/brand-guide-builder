import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useConversationStore } from '../stores/conversationStore'
import { getSection } from '../data/sections'
import { buildSystemPrompt, getOpener } from '../services/prompts/builder'
import { sendMessage, parseSectionReview } from '../services/ai'
import { ChatWindow } from '../components/chat/ChatWindow'
import { SectionReview } from '../components/review/SectionReview'
import { FallbackForm } from '../components/shared/FallbackForm'
import type { Message, SectionReviewResponse, EntrepreneurMode } from '../types'

export function WizardSection() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const updateBrandData = useBrandGuideStore(s => s.updateBrandData)
  const approveSectionDraft = useBrandGuideStore(s => s.approveSectionDraft)
  const updateSectionStatus = useBrandGuideStore(s => s.updateSectionStatus)

  const { messages, isStreaming, loadConversation, addMessage, setStreaming, clearConversation } = useConversationStore()

  const [mode, setMode] = useState<EntrepreneurMode | 'fallback'>('interview')
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [review, setReview] = useState<SectionReviewResponse | null>(null)
  const [apiError, setApiError] = useState(false)

  const section = sectionId ? getSection(sectionId) : undefined

  // Load conversation when section changes
  useEffect(() => {
    if (!session || !sectionId) return
    loadConversation(session.id, sectionId)
    setReview(null)
    setMode('interview')
    setApiError(false)
  }, [session?.id, sectionId, loadConversation])

  // Send AI opener when entering a fresh section
  useEffect(() => {
    if (!session || !sectionId || messages.length > 0 || isStreaming) return
    const opener = getOpener(session, sectionId)
    addMessage({ role: 'assistant', content: opener })
  }, [session, sectionId, messages.length, isStreaming, addMessage])

  const handleSend = useCallback(async (text: string) => {
    if (!session || !sectionId) return

    const userMsg: Message = { role: 'user', content: text }
    await addMessage(userMsg)
    await updateSectionStatus(sectionId, 'in_progress')

    setStreaming(true)
    setStreamingContent('')

    try {
      const systemPrompt = buildSystemPrompt(session, sectionId)
      const allMessages = [...messages, userMsg]
      const response = await sendMessage(systemPrompt, allMessages, setStreamingContent)

      setStreamingContent(null)
      setStreaming(false)

      // Check if response is a section review (JSON)
      const parsed = parseSectionReview(response)
      if (parsed) {
        await addMessage({ role: 'assistant', content: "Here's my draft for this section. Take a look and let me know what you think." })
        setReview(parsed)
        setMode('review')
      } else {
        await addMessage({ role: 'assistant', content: response })
      }

      setApiError(false)
    } catch (err) {
      console.error('AI error:', err)
      setStreamingContent(null)
      setStreaming(false)
      setApiError(true)
      await addMessage({ role: 'assistant', content: "I'm having trouble connecting right now. You can continue filling in the fields manually, or try again in a moment." })
      setMode('fallback')
    }
  }, [session, sectionId, messages, addMessage, setStreaming, updateSectionStatus])

  const handleApprove = useCallback(async (draft: string) => {
    if (!sectionId) return
    await approveSectionDraft(sectionId, draft)
    const store = useBrandGuideStore.getState()
    await store.nextSection()
    const next = useBrandGuideStore.getState().session?.currentSection
    if (next) navigate(`/wizard/${next}`)
  }, [sectionId, approveSectionDraft, navigate])

  const handleRevise = useCallback(async (direction: string) => {
    setMode('interview')
    setReview(null)
    await handleSend(`Please revise the draft: ${direction}`)
  }, [handleSend])

  const handleStartOver = useCallback(async () => {
    await clearConversation()
    setReview(null)
    setMode('interview')
  }, [clearConversation])

  const handleFallbackChange = useCallback(async (key: string, value: string) => {
    await updateBrandData({ [key]: value })
  }, [updateBrandData])

  if (!section || !session) {
    return <div className="flex items-center justify-center h-full text-brand-text-muted font-body">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Section header */}
      <div className="px-6 pt-6 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-brand-text">{section.title}</h2>
          {section.optional && (
            <span className="text-[11px] font-semibold text-brand-text-faint uppercase tracking-wider bg-brand-bg-warm px-2.5 py-0.5 rounded-md">Optional</span>
          )}
        </div>
        <p className="text-brand-text-muted text-[15px] mt-1">{section.subtitle}</p>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          AI assistant is temporarily unavailable. You can continue filling in fields manually.
          <button
            onClick={() => { setApiError(false); setMode('interview') }}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'review' && review ? (
          <div className="overflow-y-auto h-full">
            <SectionReview
              review={review}
              onApprove={handleApprove}
              onRevise={handleRevise}
              onStartOver={handleStartOver}
            />
          </div>
        ) : mode === 'fallback' ? (
          <div className="overflow-y-auto h-full">
            <FallbackForm
              fields={section.fields}
              data={session.brandData}
              onChange={handleFallbackChange}
            />
          </div>
        ) : (
          <ChatWindow
            messages={messages}
            streamingContent={streamingContent}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        )}
      </div>
    </div>
  )
}
