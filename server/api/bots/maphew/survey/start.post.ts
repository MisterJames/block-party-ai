import { createError } from 'h3'
import { startMaphewSurvey } from '../../../../utils/maphew'

export default defineEventHandler(async () => {
  try {
    return await startMaphewSurvey()
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Unable to start Maphew survey'
    })
  }
})
