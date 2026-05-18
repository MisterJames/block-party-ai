import { createError, readBody } from 'h3'
import { recordAiUsage } from '../../utils/ai-usage'

type OpenAiResponse = {
  id?: string
  model?: string
  output_text?: string
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  usage?: {
    input_tokens?: number
    input_tokens_details?: {
      cached_tokens?: number
    }
    output_tokens?: number
    total_tokens?: number
  }
}

function extractOutputText(response: OpenAiResponse) {
  if (response.output_text) {
    return response.output_text
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join('\n')
    .trim() || ''
}

function fakePlannerResponse(prompt: string): OpenAiResponse {
  const words = prompt.trim().split(/\s+/).filter(Boolean).length
  const inputTokens = Math.max(16, Math.round(words * 1.4) + 24)
  const outputTokens = 96

  return {
    id: `fake-planner-${Date.now()}`,
    model: process.env.OPENAI_MODEL || 'test-planner-model',
    output_text: `POC response: I would treat this as a planning note, keep it non-destructive, and ask for approval before any bot changes the world.\n\nRequest received: ${prompt}`,
    usage: {
      input_tokens: inputTokens,
      input_tokens_details: {
        cached_tokens: 0
      },
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ message?: string }>(event)
  const message = body.message?.trim()

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Planner message is required'
    })
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5.2'
  const shouldUseFakeAi = process.env.PLANNER_POC_FAKE_AI === '1'

  if (!process.env.OPENAI_API_KEY && !shouldUseFakeAi) {
    throw createError({
      statusCode: 412,
      statusMessage: 'OPENAI_API_KEY is required for planner calls'
    })
  }

  const response = shouldUseFakeAi
    ? fakePlannerResponse(message)
    : await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'developer',
              content: 'You are the Block Party AI planner POC. Reply in concise free-form text. Do not claim a job was executed.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_output_tokens: 600
        })
      }).then(async (apiResponse) => {
        const payload = await apiResponse.json().catch(() => ({}))

        if (!apiResponse.ok) {
          throw createError({
            statusCode: apiResponse.status,
            statusMessage: payload.error?.message || 'OpenAI planner request failed'
          })
        }

        return payload as OpenAiResponse
      })

  const usageRecord = await recordAiUsage({
    model: response.model || model,
    purpose: 'planner_freeform_poc',
    usage: {
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens,
      total_tokens: response.usage?.total_tokens,
      prompt_tokens_details: {
        cached_tokens: response.usage?.input_tokens_details?.cached_tokens
      }
    }
  })

  return {
    id: response.id,
    model: response.model || model,
    message: extractOutputText(response) || 'No text output returned.',
    usageRecord
  }
})
