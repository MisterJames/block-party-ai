import { getQuery } from 'h3'
import { listAiUsageRecords } from '../../utils/ai-usage'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const limit = Number(query.limit ?? 50)

  return listAiUsageRecords(Number.isFinite(limit) ? limit : 50)
})
