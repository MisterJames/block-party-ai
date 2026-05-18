import { createError, readBody } from 'h3'
import { recordAiUsage } from '../../utils/ai-usage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'AI usage record body is required'
    })
  }

  const record = await recordAiUsage(body)

  return { record }
})
