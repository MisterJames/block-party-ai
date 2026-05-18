import { createError, getRouterParam } from 'h3'
import { updateProposalStatus } from '../../../utils/coordination'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Proposal id is required'
    })
  }

  try {
    return await updateProposalStatus(id, 'rejected')
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: error instanceof Error ? error.message : 'Proposal not found'
    })
  }
})
