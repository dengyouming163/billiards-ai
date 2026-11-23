import envConfig from './env'

declare const process: { env: { NODE_ENV?: string } }
const isDevelopment = process.env.NODE_ENV === 'development'
const config = isDevelopment ? envConfig.development : envConfig.production

export default config