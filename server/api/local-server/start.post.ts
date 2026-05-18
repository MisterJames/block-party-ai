import { createError } from 'h3'
import { startLocalServer } from '../../utils/local-server'

export default defineEventHandler(async () => {
  try {
    return await startLocalServer()
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Unable to start local Minecraft server'
    })
  }
})
