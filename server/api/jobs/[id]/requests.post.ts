import { createError, getRouterParam, readBody } from 'h3'
import { createJobRequest } from '../../../utils/coordination'
import type { JobRequest } from '../../../../types/coordination'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Job id is required'
    })
  }

  const body = await readBody<Partial<JobRequest>>(event)

  try {
    return await createJobRequest(id, body)
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error instanceof Error ? error.message : 'Job not found'
    })
  }
})
