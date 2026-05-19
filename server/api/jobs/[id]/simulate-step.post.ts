import { createError, getRouterParam } from 'h3'
import { simulateJobStep } from '../../../utils/coordination'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Job id is required'
    })
  }

  try {
    return await simulateJobStep(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Job simulation failed'
    const statusCode = message.includes('not found') ? 404 : 409

    throw createError({
      statusCode,
      statusMessage: message
    })
  }
})
