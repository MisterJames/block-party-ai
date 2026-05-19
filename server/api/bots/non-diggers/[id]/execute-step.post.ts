import { createError, getRouterParam } from 'h3'
import { executeNextNonDiggerStep, nonDiggerIds } from '../../../../utils/non-digger-bots'
import type { NonDiggerCrewBotId } from '../../../../../types/dashboard'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as NonDiggerCrewBotId | undefined

  if (!id || !nonDiggerIds().includes(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid non-digger bot id is required'
    })
  }

  try {
    return await executeNextNonDiggerStep(id)
  } catch (error) {
    throw createError({
      statusCode: 409,
      statusMessage: error instanceof Error ? error.message : 'Non-digger step execution failed'
    })
  }
})
