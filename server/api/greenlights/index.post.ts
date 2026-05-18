import { createError, readBody } from 'h3'
import { createGreenlight } from '../../utils/coordination'
import type { GreenlightRule } from '../../../types/coordination'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<GreenlightRule>>(event)

  if (!body.label?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Greenlight label is required'
    })
  }

  return createGreenlight(body)
})
