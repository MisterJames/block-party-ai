import { getWorldConnectionStatus } from '../utils/local-server'
import { getMaphewStatus } from '../utils/maphew'
import { getCoordinationDashboard } from '../utils/coordination'
import { getNonDiggerCrewStatus } from '../utils/non-digger-bots'
import type { DashboardOperationalStatus } from '../../types/dashboard'

export default defineEventHandler(async (): Promise<DashboardOperationalStatus> => {
  const [worldConnection, maphew, nonDiggerCrew, coordination] = await Promise.all([
    getWorldConnectionStatus(),
    getMaphewStatus(),
    getNonDiggerCrewStatus(),
    getCoordinationDashboard()
  ])

  return {
    localServer: worldConnection.server,
    worldConnection,
    maphew,
    nonDiggerCrew,
    coordination
  }
})
