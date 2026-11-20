import envConfig from './env'

const isDevelopment = import.meta.env.DEV
const config = isDevelopment ? envConfig.development : envConfig.production

export default config
