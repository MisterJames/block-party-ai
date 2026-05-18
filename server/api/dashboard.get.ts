import { getWorldConnectionStatus } from '../utils/local-server'
import { getMaphewStatus } from '../utils/maphew'
import type { DashboardOperationalStatus } from '../../types/dashboard'

export default defineEventHandler(async (): Promise<DashboardOperationalStatus> => {
  const [worldConnection, maphew] = await Promise.all([
    getWorldConnectionStatus(),
    getMaphewStatus()
  ])

  return {
    localServer: worldConnection.server,
    worldConnection,
    maphew
  }
})
