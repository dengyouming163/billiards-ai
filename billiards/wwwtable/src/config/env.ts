const env = {
  development: {
    BASE_URL: 'https://poolapi.kyyp.cn/storeapi',
    WS_URL: 'wss://poolapi.kyyp.cn:8282',
    APP_VERSION: '1.0.0',
    DEBUG: true
  },
  production: {
    BASE_URL: 'https://poolapi.kyyp.cn/storeapi',
    WS_URL: 'wss://poolapi.kyyp.cn:8282',
    APP_VERSION: '1.0.0',
    DEBUG: false
  }
}

export default env
