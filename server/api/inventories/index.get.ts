import { getLogisticsDashboard } from '../../utils/coordination'

export default defineEventHandler(async () => {
  const logistics = await getLogisticsDashboard()

  return {
    inventories: logistics.inventories,
    updatedAt: logistics.updatedAt
  }
})
