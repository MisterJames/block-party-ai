import { getLocalServerStatus } from '../../utils/local-server'

export default defineEventHandler(() => getLocalServerStatus())
