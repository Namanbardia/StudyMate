/**
 * Gemini AI Service for Study Plan Generation
 * Uses Google Gemini API via Cloudflare Worker
 */

export interface Env {
  GEMINI_API_KEY?: string
  GEMINI_PRIMARY_MODEL?: string
  GEMINI_FALLBACK_MODEL_1?: string
  GEMINI_FALLBACK_MODEL_2?: string
}

export interface StudyPlanInput {
  topic: string
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced'
  dailyStudyTimeMinutes: number
  targetCompletionDate: number // unix timestamp
  learningGoals: string
  additionalInstructions?: string
}

export interface StudyPlanTask {
  dayNumber: number
  taskTitle: string
  taskDescription: string
  estimatedDurationMinutes: number
  moduleName: string
  moduleOrder: number
}

export interface StudyPlanModule {
  moduleName: string
  moduleOrder: number
  description: string
  tasks: StudyPlanTask[]
}

export interface GeneratedStudyPlan {
  title: string
  topic: string
  description: string
  learningObjectives: string[]
  totalEstimatedDays: number
  modules: StudyPlanModule[]
  finalRevisionAndAssessment: string
}

export interface StudyPlanGenerationResponse {
  success: boolean
  plan?: GeneratedStudyPlan
  error?: string
  message?: string
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getGeminiApiKey(env: Env): string {
  const key = env.GEMINI_API_KEY
  if (!key) {
    throw new Error('Gemini API key is not configured on the Worker.')
  }
  return key
}

function getGeminiModels(env: Env): string[] {
  const models: string[] = []
  if (env.GEMINI_PRIMARY_MODEL) {
    models.push(env.GEMINI_PRIMARY_MODEL)
  }
  if (env.GEMINI_FALLBACK_MODEL_1) {
    models.push(env.GEMINI_FALLBACK_MODEL_1)
  }
  if (env.GEMINI_FALLBACK_MODEL_2) {
    models.push(env.GEMINI_FALLBACK_MODEL_2)
  }
  // Default fallback if none configured
  if (models.length === 0) {
    models.push('gemini-2.5-flash')
  }
  return models
}

function buildStudyPlanPrompt(input: StudyPlanInput): string {
  const targetDate = new Date(input.targetCompletionDate * 1000)
  const targetDateStr = targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const daysUntilTarget = Math.max(1, Math.ceil((input.targetCompletionDate - Date.now() / 1000) / 86400))
  const dailyHours = input.dailyStudyTimeMinutes / 60

  return `You are an expert educational curriculum designer. Create a personalized, realistic study plan for a student.

STUDENT PROFILE:
- Topic: ${input.topic}
- Current Knowledge Level: ${input.knowledgeLevel}
- Daily Available Study Time: ${dailyHours} hour(s) (${input.dailyStudyTimeMinutes} minutes)
- Target Completion Date: ${targetDateStr} (${daysUntilTarget} days from now)
- Learning Goals: ${input.learningGoals}
${input.additionalInstructions ? `- Additional Instructions: ${input.additionalInstructions}` : ''}

REQUIREMENTS:
1. Generate a structured study plan that respects the daily time limit and target date.
2. Break the topic into logical modules/milestones.
3. Create daily tasks with specific titles, descriptions, and time estimates.
4. Each task should fit within the daily study time (${input.dailyStudyTimeMinutes} minutes).
4. Total daily workload should not exceed ${input.dailyStudyTimeMinutes} minutes.
5. Include a final revision and assessment phase.
6. Make it realistic for a ${input.knowledgeLevel} level learner.
7. Return ONLY valid JSON matching the exact structure below.

OUTPUT FORMAT (return only this JSON, no markdown, no extra text):
{
  "title": "string - concise plan title",
  "topic": "string - same as input topic",
  "description": "string - brief overview of the plan",
  "learningObjectives": ["string", "string", "..."],
  "totalEstimatedDays": number,
  "modules": [
    {
      "moduleName": "string",
      "moduleOrder": number,
      "description": "string",
      "tasks": [
        {
          "dayNumber": number,
          "taskTitle": "string",
          "taskDescription": "string",
          "estimatedDurationMinutes": number,
          "moduleName": "string",
          "moduleOrder": number
        }
      ]
    }
  ],
  "finalRevisionAndAssessment": "string"
}

IMPORTANT CONSTRAINTS:
- totalEstimatedDays must be <= ${daysUntilTarget}
- Sum of estimatedDurationMinutes for tasks on any given day must be <= ${input.dailyStudyTimeMinutes}
- dayNumber should be sequential starting from 1
- moduleOrder should be sequential starting from 1
- tasks within each module should have sequential dayNumbers
- Generate enough tasks to fill the available days meaningfully`
}

async function callGeminiApi(env: Env, prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey(env)
  const models = getGeminiModels(env)
  const maxRetries = 3
  const baseDelayMs = 2000
  const retryableStatuses = new Set([429, 500, 502, 503, 504, 524])

  let lastError: Error | null = null

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex]
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`
    let lastErrorForModel: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.info('[gemini] Attempting model', JSON.stringify({ model, attempt: attempt + 1, maxRetries: maxRetries + 1, modelIndex: modelIndex + 1, totalModels: models.length }))

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.warn('[gemini] API error', JSON.stringify({
            model,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          }))

          // Check if error is retryable
          if (retryableStatuses.has(response.status) && attempt < maxRetries) {
            const delayMs = baseDelayMs * Math.pow(2, attempt)
            console.info('[gemini] Retrying after delay', JSON.stringify({ model, attempt: attempt + 1, delayMs }))
            await new Promise(resolve => setTimeout(resolve, delayMs))
            continue
          }

          // Non-retryable or max retries reached for this model
          if (response.status === 429) {
            throw new Error('Gemini API rate limit exceeded. Please try again later.')
          }

          // For other non-retryable errors (4xx except 429), don't retry this model, try next model
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            console.warn('[gemini] Non-retryable error for model, falling back', JSON.stringify({ model, status: response.status }))
            lastErrorForModel = new Error(`Gemini API error: ${response.status} ${response.statusText}`)
            break // Break out of retry loop, will try next model
          }

          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
        }

        const data: any = await response.json()

        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('Gemini API returned no candidates')
        }

        const candidate = data.candidates[0]
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          throw new Error('Gemini API returned empty content')
        }

        const text = candidate.content.parts[0].text
        if (!text) {
          throw new Error('Gemini API returned empty text')
        }

        console.info('[gemini] Successfully generated response', JSON.stringify({ model }))
        return text
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        lastErrorForModel = lastError

        // If we've exhausted retries for this model, try next model
        if (attempt === maxRetries) {
          console.warn('[gemini] All retry attempts failed for model, trying next', JSON.stringify({ model, maxRetries: maxRetries + 1, error: lastError?.message }))
          break // Break out of retry loop, will try next model
        }

        // Check if it's a network error (retryable)
        const isNetworkError = error instanceof TypeError && error.message.includes('fetch')
        if (!isNetworkError) {
          // Non-network error (e.g., validation error), don't retry this model, try next
          console.warn('[gemini] Non-network error for model, falling back', JSON.stringify({ model, error: lastError?.message }))
          break // Break out of retry loop, will try next model
        }

        // Network error, retry with backoff
        if (attempt < maxRetries) {
          const delayMs = baseDelayMs * Math.pow(2, attempt)
          console.info('[gemini] Network error, retrying after delay', JSON.stringify({ model, attempt: attempt + 1, delayMs, error: lastError?.message }))
          await new Promise(resolve => setTimeout(resolve, delayMs))
          continue
        }
      }
    }

    // This model failed, log fallback and try next model
    if (modelIndex < models.length - 1) {
      console.info('[gemini] Falling back to next model', JSON.stringify({ 
        failedModel: model, 
        nextModel: models[modelIndex + 1],
        error: lastErrorForModel?.message 
      }))
    }
  }

  // All models failed
  console.error('[gemini] All models failed', JSON.stringify({ 
    modelsTried: models, 
    error: lastError?.message 
  }))
  throw new Error(`Failed to generate study plan after trying all models (${models.join(', ')}). ${lastError?.message || 'Please try again later.'}`)
}

function validateGeneratedPlan(plan: any, maxDays: number, dailyMinutes: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!plan.title || typeof plan.title !== 'string') {
    errors.push('Missing or invalid title')
  }
  if (!plan.topic || typeof plan.topic !== 'string') {
    errors.push('Missing or invalid topic')
  }
  if (!plan.description || typeof plan.description !== 'string') {
    errors.push('Missing or invalid description')
  }
  if (!Array.isArray(plan.learningObjectives) || plan.learningObjectives.length === 0) {
    errors.push('Missing or invalid learningObjectives')
  }
  if (typeof plan.totalEstimatedDays !== 'number' || plan.totalEstimatedDays <= 0) {
    errors.push('Missing or invalid totalEstimatedDays')
  }
  if (plan.totalEstimatedDays > maxDays) {
    errors.push(`totalEstimatedDays (${plan.totalEstimatedDays}) exceeds available days (${maxDays})`)
  }
  if (!Array.isArray(plan.modules) || plan.modules.length === 0) {
    errors.push('Missing or invalid modules')
  }
  if (!plan.finalRevisionAndAssessment || typeof plan.finalRevisionAndAssessment !== 'string') {
    errors.push('Missing or invalid finalRevisionAndAssessment')
  }

  // Validate modules and tasks
  if (Array.isArray(plan.modules)) {
    const dayTaskMinutes: Record<number, number> = {}
    let dayCount = 0

    plan.modules.forEach((module: any, moduleIdx: number) => {
      if (!module.moduleName || typeof module.moduleName !== 'string') {
        errors.push(`Module ${moduleIdx}: missing moduleName`)
      }
      if (typeof module.moduleOrder !== 'number' || module.moduleOrder !== moduleIdx + 1) {
        errors.push(`Module ${moduleIdx}: moduleOrder should be ${moduleIdx + 1}`)
      }
      if (!module.description || typeof module.description !== 'string') {
        errors.push(`Module ${moduleIdx}: missing description`)
      }
      if (!Array.isArray(module.tasks) || module.tasks.length === 0) {
        errors.push(`Module ${moduleIdx}: missing or empty tasks`)
      }

      if (Array.isArray(module.tasks)) {
        module.tasks.forEach((task: any, taskIdx: number) => {
          if (!task.dayNumber || typeof task.dayNumber !== 'number' || task.dayNumber < 1) {
            errors.push(`Module ${moduleIdx}, Task ${taskIdx}: invalid dayNumber`)
          } else {
            dayCount = Math.max(dayCount, task.dayNumber)
            const minutes = task.estimatedDurationMinutes || 0
            dayTaskMinutes[task.dayNumber] = (dayTaskMinutes[task.dayNumber] || 0) + minutes
          }
          if (!task.taskTitle || typeof task.taskTitle !== 'string') {
            errors.push(`Module ${moduleIdx}, Task ${taskIdx}: missing taskTitle`)
          }
          if (!task.taskDescription || typeof task.taskDescription !== 'string') {
            errors.push(`Module ${moduleIdx}, Task ${taskIdx}: missing taskDescription`)
          }
          if (typeof task.estimatedDurationMinutes !== 'number' || task.estimatedDurationMinutes <= 0) {
            errors.push(`Module ${moduleIdx}, Task ${taskIdx}: invalid estimatedDurationMinutes`)
          }
          if (!task.moduleName || task.moduleName !== module.moduleName) {
            errors.push(`Module ${moduleIdx}, Task ${taskIdx}: moduleName mismatch`)
          }
          if (typeof task.moduleOrder !== 'number' || task.moduleOrder !== module.moduleOrder) {
            errors.push(`Module ${moduleIdx}, Task ${taskIdx}: moduleOrder mismatch`)
          }
        })
      }
    })

    // Check daily time limits
    Object.entries(dayTaskMinutes).forEach(([day, minutes]) => {
      if (minutes > dailyMinutes) {
        errors.push(`Day ${day}: total estimated minutes (${minutes}) exceeds daily limit (${dailyMinutes})`)
      }
    })

    if (dayCount > maxDays) {
      errors.push(`Plan spans ${dayCount} days but only ${maxDays} days available until target date`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export async function generateStudyPlan(env: Env, input: StudyPlanInput): Promise<StudyPlanGenerationResponse> {
  const maxDays = Math.max(1, Math.ceil((input.targetCompletionDate - Date.now() / 1000) / 86400))

  try {
    const prompt = buildStudyPlanPrompt(input)
    const responseText = await callGeminiApi(env, prompt)

    let plan: GeneratedStudyPlan
    try {
      plan = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[gemini] Failed to parse JSON response', JSON.stringify({
        error: parseError instanceof Error ? parseError.message : 'Parse error',
        responsePreview: responseText.slice(0, 500),
      }))
      return { success: false, error: 'Failed to parse generated plan', message: 'The AI returned an invalid format. Please try again.' }
    }

    const validation = validateGeneratedPlan(plan, maxDays, input.dailyStudyTimeMinutes)
    if (!validation.valid) {
      console.warn('[gemini] Generated plan validation failed', JSON.stringify({ errors: validation.errors }))
      // Try to fix minor issues or return error
      return { success: false, error: 'Generated plan validation failed', message: validation.errors.join('; ') }
    }

    return { success: true, plan }
  } catch (error) {
    console.error('[gemini] Study plan generation failed', JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      topic: input.topic,
    }))
    const message = error instanceof Error && error.message.includes('rate limit')
      ? 'AI service is temporarily busy. Please try again in a few minutes.'
      : 'Failed to generate study plan. Please check your inputs and try again.'
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', message }
  }
}