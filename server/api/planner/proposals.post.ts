import { createError, readBody } from 'h3'
import { createPlannerProposal } from '../../utils/coordination'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ message?: string }>(event)
  const message = body.message?.trim()

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Planner proposal message is required'
    })
  }

  return createPlannerProposal(message)
})
