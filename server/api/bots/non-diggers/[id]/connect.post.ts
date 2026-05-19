import { createError, getRouterParam } from 'h3'
import { connectNonDiggerBot, nonDiggerIds } from '../../../../utils/non-digger-bots'
import type { NonDiggerCrewBotId } from '../../../../../types/dashboard'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') as NonDiggerCrewBotId | undefined

  if (!id || !nonDiggerIds().includes(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid non-digger bot id is required'
    })
  }

  return connectNonDiggerBot(id)
})
