import { getWorldConnectionStatus } from '../utils/local-server'
import { getMaphewStatus } from '../utils/maphew'
import { getCoordinationDashboard } from '../utils/coordination'
import type { DashboardOperationalStatus } from '../../types/dashboard'

export default defineEventHandler(async (): Promise<DashboardOperationalStatus> => {
  const [worldConnection, maphew, coordination] = await Promise.all([
    getWorldConnectionStatus(),
    getMaphewStatus(),
    getCoordinationDashboard()
  ])

  return {
    localServer: worldConnection.server,
    worldConnection,
    maphew,
    coordination
  }
})
