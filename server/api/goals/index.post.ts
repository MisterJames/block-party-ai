import { createError, readBody } from 'h3'
import { createGoal } from '../../utils/coordination'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ label?: string, detail?: string, planId?: string | null }>(event)

  if (!body.label?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Goal label is required'
    })
  }

  return createGoal(body)
})
