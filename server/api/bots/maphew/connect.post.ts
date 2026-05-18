import { createError } from 'h3'
import { connectMaphew } from '../../../utils/maphew'

export default defineEventHandler(async () => {
  try {
    return await connectMaphew()
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Unable to connect Maphew'
    })
  }
})
