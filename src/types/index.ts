export type ThemeMode = 'light' | 'dark' | 'system'

export interface NavItem {
  label: string
  href: string
  isExternal?: boolean
}

export interface FeatureItem {
  id: string
  title: string
  description: string
  tag: string
  iconName: string
  highlight?: string
}

export interface StepItem {
  number: string
  title: string
  description: string
  details: string[]
}

export interface PricingPlan {
  id: 'free' | 'premium'
  name: string
  price: string
  billing: string
  description: string
  isPopular?: boolean
  statusLabel?: string
  features: string[]
  buttonText: string
  buttonVariant: 'primary' | 'outline'
}

export interface SearchPreviewPackage {
  topic: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedHours: string
  summary: string
  keyTakeaways: string[]
  videos: Array<{
    title: string
    channel: string
    duration: string
    verified: boolean
  }>
  readings: Array<{
    title: string
    source: string
    readTime: string
    category: string
  }>
  sampleQuiz: {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }
}

