import { createError, getRouterParam } from 'h3'
import { updateJobStatus } from '../../../utils/coordination'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Job id is required'
    })
  }

  try {
    return await updateJobStatus(id, 'approve')
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error instanceof Error ? error.message : 'Job not found'
    })
  }
})
