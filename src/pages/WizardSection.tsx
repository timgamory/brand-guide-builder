import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBrandGuideStore } from '../stores/brandGuideStore'
import { useConversationStore } from '../stores/conversationStore'
import { useReflectionStore } from '../stores/reflectionStore'
import { getSection, getNextSection } from '../data/sections'
import { getResearchTasks } from '../data/researchTasks'
import { buildSystemPrompt, getOpener } from '../services/prompts/builder'
import { sendMessage, parseSectionReview } from '../services/ai'
import { prepareMessagesForApi, generateSummary, needsSummarization } from '../services/summarize'
import { getConversation, saveConversation } from '../services/storage'
import { ChatWindow } from '../components/chat/ChatWindow'
import { SectionReview } from '../components/review/SectionReview'
import { FallbackForm } from '../components/shared/FallbackForm'
import { TaskList } from '../components/research/TaskList'
import { ReflectionPrompt } from '../components/reflection/ReflectionPrompt'
import { VoiceOverlay } from '../components/voice/VoiceOverlay'
import { useVoiceSettings } from '../hooks/useVoiceSettings'
import { track } from '../services/analytics'
import type { Message, SectionReviewResponse, WizardMode } from '../types'

export function WizardSection() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const navigate = useNavigate()
  const session = useBrandGuideStore(s => s.session)
  const updateBrandData = useBrandGuideStore(s => s.updateBrandData)
  const approveSectionDraft = useBrandGuideStore(s => s.approveSectionDraft)
  const updateSectionStatus = useBrandGuideStore(s => s.updateSectionStatus)

  const { messages, isStreaming, loadConversation, addMessage, setStreaming, clearConversation, researchTasks } = useConversationStore()

  const isIntern = session?.path === 'intern'

  const [mode, setMode] = useState<WizardMode>(isIntern ? 'research' : 'interview')
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [review, setReview] = useState<SectionReviewResponse | null>(null)
  const [apiError, setApiError] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [revisionCount, setRevisionCount] = useState(0)
  const [voiceActive, setVoiceActive] = useState(false)
  const { voiceEnabled } = useVoiceSettings()
  const [isReviewDetected, setIsReviewDetected] = useState(false)
  const [preferredMode, setPreferredMode] = useState<'undecided' | 'voice' | 'text'>(
    voiceEnabled ? 'undecided' : 'text'
  )
  const [conversationLoaded, setConversationLoaded] = useState(false)

  const section = sectionId ? getSection(sectionId) : undefined

  // Load conversation and intern-specific data when section changes
  useEffect(() => {
    if (!session || !sectionId) return
    setConversationLoaded(false)
    loadConversation(session.id, sectionId).then(() => setConversationLoaded(true))
    setReview(null)
    setApiError(false)
    setRevisionCount(0)
    setIsReviewDetected(false)
    setVoiceActive(false)
    setPreferredMode(voiceEnabled ? 'undecided' : 'text')
    track('section.started', { sectionId })

    if (session.path === 'intern') {
      setMode('research')
      useConversationStore.getState().loadResearchTasks(session.id, sectionId, getResearchTasks(sectionId))
      useReflectionStore.getState().loadReflections(session.id)
      setReflectionText(useReflectionStore.getState().getReflection(sectionId) ?? '')
    } else {
      setMode('interview')
    }
  }, [session?.id, sectionId, loadConversation])

  // Load reflection text after reflections are loaded (async)
  useEffect(() => {
    if (!isIntern || !sectionId) return
    const text = useReflectionStore.getState().getReflection(sectionId)
    if (text) setReflectionText(text)
  }, [isIntern, sectionId])

  // Send AI opener when entering a fresh interview/synthesis section
  // Wait until user has chosen a mode (voice or text) before sending opener
  useEffect(() => {
    if (!session || !sectionId || messages.length > 0 || isStreaming) return
    if (mode !== 'interview' && mode !== 'synthesis') return
    if (preferredMode === 'undecided') return
    const opener = getOpener(session, sectionId)
    addMessage({ role: 'assistant', content: opener })
  }, [session, sectionId, messages.length, isStreaming, addMessage, mode, preferredMode])

  // Research mode handlers
  const handleToggleTask = useCallback((taskId: string) => {
    useConversationStore.getState().toggleTask(taskId)
  }, [])

  const handleUpdateTaskNotes = useCallback((taskId: string, notes: string) => {
    useConversationStore.getState().updateTaskNotes(taskId, notes)
  }, [])

  const handleProceed = useCallback(async () => {
    if (!session || !sectionId) return
    // Switch to synthesis mode and send AI opener
    setMode('synthesis')
    // Clear existing messages for a fresh synthesis conversation
    await clearConversation()
  }, [session, sectionId, clearConversation])

  const handleSend = useCallback(async (text: string) => {
    if (!session || !sectionId) return

    const userMsg: Message = { role: 'user', content: text }
    await addMessage(userMsg)
    track('message.sent', { sectionId, role: 'user', length: text.length })
    await updateSectionStatus(sectionId, 'in_progress')

    setStreaming(true)
    setStreamingContent('')

    try {
      const currentResearchTasks = useConversationStore.getState().researchTasks
      const systemPrompt = isIntern
        ? buildSystemPrompt(session, sectionId, currentResearchTasks)
        : buildSystemPrompt(session, sectionId)
      const allMessages = [...messages, userMsg]

      // Summarize long conversations
      const convo = await getConversation(session.id, sectionId)
      let summary = convo?.conversationSummary
      let summarizedAtCount = convo?.summarizedAtCount

      if (needsSummarization(allMessages.length, summarizedAtCount)) {
        try {
          summary = await generateSummary(allMessages, summary)
          summarizedAtCount = allMessages.length
          track('summary.triggered', { sectionId, messageCount: allMessages.length })
          await saveConversation(session.id, sectionId, {
            messages: useConversationStore.getState().messages,
            researchTasks: useConversationStore.getState().researchTasks,
            conversationSummary: summary,
            summarizedAtCount,
          })
        } catch {
          // If summarization fails, proceed without it
        }
      }

      const apiMessages = prepareMessagesForApi(allMessages, summary)
      const response = await sendMessage(systemPrompt, apiMessages, setStreamingContent)

      setStreamingContent(null)
      setStreaming(false)

      // Check if response is a section review (JSON)
      const parsed = parseSectionReview(response)
      if (parsed) {
        const draftReadyMsg = "Here's my draft for this section. Take a look and let me know what you think."
        await addMessage({ role: 'assistant', content: draftReadyMsg })
        track('message.sent', { sectionId, role: 'assistant', length: draftReadyMsg.length })
        setReview(parsed)
        setMode('review')
        setIsReviewDetected(true)
      } else {
        await addMessage({ role: 'assistant', content: response })
        track('message.sent', { sectionId, role: 'assistant', length: response.length })
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
  }, [session, sectionId, messages, addMessage, setStreaming, updateSectionStatus, isIntern])


  const handleApprove = useCallback(async (draft: string) => {
    if (!sectionId) return
    // Save reflection for intern path
    if (isIntern && reflectionText.trim()) {
      await useReflectionStore.getState().setReflection(sectionId, reflectionText.trim())
    }
    const messageCount = useConversationStore.getState().messages.length
    track('section.approved', { sectionId, messageCount, draftLength: draft.length, revisionNumber: revisionCount })
    await approveSectionDraft(sectionId, draft)
    // Extract org name from conversation when basics section is approved
    if (sectionId === 'basics' && !useBrandGuideStore.getState().session?.brandData.orgName) {
      const convMessages = useConversationStore.getState().messages
      const firstUserMsg = convMessages.find(m => m.role === 'user')
      if (firstUserMsg) {
        await updateBrandData({ orgName: firstUserMsg.content.trim() })
      }
    }
    const store = useBrandGuideStore.getState()
    await store.nextSection()
    const next = useBrandGuideStore.getState().session?.currentSection
    if (next) navigate(`/wizard/${next}`)
  }, [sectionId, approveSectionDraft, navigate, isIntern, reflectionText, revisionCount])

  const handleRevise = useCallback(async (direction: string) => {
    setMode(isIntern ? 'synthesis' : 'interview')
    setReview(null)
    setRevisionCount(prev => prev + 1)
    await handleSend(`Please revise the draft: ${direction}`)
  }, [handleSend, isIntern])

  const handleStartOver = useCallback(async () => {
    await clearConversation()
    setReview(null)
    if (isIntern) {
      // For intern, go back to research phase
      if (session && sectionId) {
        await useConversationStore.getState().loadResearchTasks(session.id, sectionId, getResearchTasks(sectionId))
      }
      setMode('research')
    } else {
      setMode('interview')
    }
  }, [clearConversation, isIntern, session, sectionId])

  const handleRefine = useCallback(async () => {
    if (!sectionId) return
    const draft = session?.sections[sectionId]?.approvedDraft
    await updateSectionStatus(sectionId, 'in_progress')
    setMode(isIntern ? 'synthesis' : 'interview')
    if (draft) {
      await addMessage({
        role: 'assistant',
        content: `Here's your current approved draft:\n\n${draft}\n\nWhat would you like to change?`
      })
    }
  }, [sectionId, updateSectionStatus, isIntern, session, addMessage])

  const handleSkip = useCallback(async () => {
    if (!sectionId) return
    await useBrandGuideStore.getState().skipSection(sectionId)
    const next = useBrandGuideStore.getState().session?.currentSection
    if (next) navigate(`/wizard/${next}`)
  }, [sectionId, navigate])

  const handleFallbackChange = useCallback(async (key: string, value: string) => {
    await updateBrandData({ [key]: value })
  }, [updateBrandData])

  if (!section || !session) {
    return <div className="flex items-center justify-center h-full text-brand-text-muted font-body">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Section header */}
      <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl md:text-2xl font-semibold text-brand-text">{section.title}</h2>
          {section.optional && (
            <span className="text-fine font-semibold text-brand-text-faint uppercase tracking-wider bg-brand-bg-warm px-2.5 py-0.5 rounded-md">Optional</span>
          )}
          {section.optional && session.sections[sectionId ?? '']?.status !== 'in_progress' && session.sections[sectionId ?? '']?.status !== 'approved' && (
            <button
              onClick={handleSkip}
              className="text-sm text-brand-text-faint hover:text-brand-text transition-colors"
            >
              Skip this section
            </button>
          )}
        </div>
        <p className="text-brand-text-muted text-body mt-1">{section.subtitle}</p>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mx-4 md:mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          AI assistant is temporarily unavailable. You can continue filling in fields manually.
          <button
            onClick={() => { setApiError(false); setMode(isIntern ? 'synthesis' : 'interview') }}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {session.sections[sectionId ?? '']?.status === 'approved' && mode !== 'review' ? (
          <div className="overflow-y-auto h-full">
            <div className="max-w-full md:max-w-2xl mx-auto p-4 md:p-6 space-y-6">
              {/* Success banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                <span>&#10003;</span> This section has been approved.
              </div>

              {/* Approved draft card */}
              <div className="bg-white rounded-2xl border border-brand-border p-4 md:p-6">
                <h3 className="font-heading text-lg font-semibold text-brand-text mb-3">Approved Draft</h3>
                <div className="text-body leading-relaxed text-brand-text-secondary whitespace-pre-wrap">
                  {session.sections[sectionId ?? '']?.approvedDraft}
                </div>
              </div>

              {/* Refine / Start over actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefine}
                  className="px-4 py-2 rounded-lg border border-brand-primary text-brand-primary text-sm font-medium hover:bg-brand-primary/5 transition-colors"
                >
                  Refine this section
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure? This will discard your approved draft and start the conversation over.')) {
                      handleStartOver()
                    }
                  }}
                  className="text-sm text-red-400/70 hover:text-red-600 transition-colors"
                >
                  Start over
                </button>
              </div>

              {/* Next Section CTA */}
              {(() => {
                const next = sectionId ? getNextSection(sectionId) : null
                return next ? (
                  <button
                    onClick={() => navigate(`/wizard/${next.id}`)}
                    className="w-full py-3.5 rounded-xl bg-brand-accent-coral text-white font-semibold text-body hover:bg-brand-accent-coral/90 transition-colors"
                  >
                    Continue to {next.title} &rarr;
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/preview')}
                    className="w-full py-3.5 rounded-xl bg-brand-accent-coral text-white font-semibold text-body hover:bg-brand-accent-coral/90 transition-colors"
                  >
                    Preview Brand Guide &rarr;
                  </button>
                )
              })()}
            </div>
          </div>
        ) : mode === 'research' ? (
          <div className="overflow-y-auto h-full">
            <TaskList
              tasks={researchTasks}
              onToggle={handleToggleTask}
              onNotesChange={handleUpdateTaskNotes}
              onProceed={handleProceed}
            />
          </div>
        ) : mode === 'review' && review ? (
          <div className="overflow-y-auto h-full">
            <SectionReview
              review={review}
              onApprove={handleApprove}
              onRevise={handleRevise}
              disableApprove={isIntern && !reflectionText.trim()}
            />
            {isIntern && sectionId && (
              <div className="max-w-full md:max-w-2xl mx-auto px-4 md:px-6 pb-6">
                <ReflectionPrompt
                  sectionId={sectionId}
                  value={reflectionText}
                  onChange={setReflectionText}
                />
              </div>
            )}
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
          // interview or synthesis mode — both use ChatWindow
          <ChatWindow
            messages={messages}
            streamingContent={streamingContent}
            onSend={handleSend}
            isStreaming={isStreaming}
            showVoiceButton={voiceEnabled && mode !== 'review'}
            onVoiceStart={() => setVoiceActive(true)}
            sectionTitle={section.title}
            preferredMode={preferredMode}
            onPreferredModeChange={setPreferredMode}
            ready={conversationLoaded}
          />
        )}
      </div>

      {voiceActive && (
        <VoiceOverlay
          messages={messages}
          onSend={handleSend}
          isReviewDetected={isReviewDetected}
          onClose={() => setVoiceActive(false)}
        />
      )}
    </div>
  )
}
