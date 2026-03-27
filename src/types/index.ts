// === Paths ===
export type Path = 'entrepreneur' | 'intern'

// === Sections ===
export type FieldType = 'text' | 'textarea' | 'select' | 'color'

export type Field = {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  options?: string[]
  defaultValue?: string
}

export type Section = {
  id: string
  title: string
  subtitle: string
  optional: boolean
  fields: Field[]
}

export type SectionStatus = 'not_started' | 'in_progress' | 'approved' | 'skipped'

export type SectionState = {
  status: SectionStatus
  approvedDraft: string | null
  reviewFeedback: string | null
}

// === Brand Data ===
export type BrandData = Record<string, string>

// === Sessions ===
export type Session = {
  id: string
  path: Path
  userSlug?: string
  brandData: BrandData
  sections: Record<string, SectionState>
  currentSection: string
  internMeta?: InternMeta
  reviewToken?: string
  generatedDocument?: string
  createdAt: string
  updatedAt: string
}

export type InternMeta = {
  internName: string
  fellowName: string
  startDate: string
}

// === Conversations ===
export type MessageRole = 'user' | 'assistant'

export type Message = {
  role: MessageRole
  content: string
}

export type ResearchTaskType = 'interview' | 'observe' | 'reflect' | 'research'

export type ResearchTask = {
  id: string
  description: string
  type: ResearchTaskType
  completed: boolean
  notes: string
}

export type Conversation = {
  id: string
  messages: Message[]
  researchTasks?: ResearchTask[]
  conversationSummary?: string
  summarizedAtCount?: number
}

// === Reflections ===
export type ReflectionEntry = {
  sectionId: string
  text: string
  timestamp: string
}

export type Reflections = {
  id: string
  entries: ReflectionEntry[]
  finalSynthesis?: string
}

// === Fellow Review ===
export type ReviewStatus = 'approved' | 'changes_requested' | 'flagged' | 'not_reviewed'

export type SectionReviewState = {
  status: ReviewStatus
  notes?: string
  reviewedAt?: string
}

export type Review = {
  id: string
  sections: Record<string, SectionReviewState>
}

// === AI Response Types ===
export type SectionReviewResponse = {
  draft: string
  suggestions: string[]
  alternatives: { option: string; rationale: string }[]
  teachingMoment: string
}

// === Wizard Mode ===
export type EntrepreneurMode = 'interview' | 'review'
export type InternMode = 'research' | 'synthesis' | 'review'
export type WizardMode = EntrepreneurMode | InternMode | 'fallback'
