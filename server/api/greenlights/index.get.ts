import { getCoordinationDashboard } from '../../utils/coordination'

export default defineEventHandler(async () => {
  const coordination = await getCoordinationDashboard()

  return {
    greenlights: coordination.greenlights,
    summary: coordination.summary
  }
})
