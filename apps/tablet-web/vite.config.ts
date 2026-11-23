import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
	plugins: [uni()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	server: {
		port: 8888,
		proxy: {
			'/storeapi': {
				target: 'http://192.168.1.70:10002',
				changeOrigin: true,
				secure: false
			}
		}
	}
})
