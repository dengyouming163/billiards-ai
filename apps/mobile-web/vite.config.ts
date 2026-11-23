import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig(() => {
	const isApp = process.env.UNI_PLATFORM === 'app'

	return {
		plugins: [uni()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				...(isApp
					? {
						vue: path.resolve(__dirname, './node_modules/@dcloudio/uni-app-vue/dist/vue.runtime.esm.dev.js')
					}
					: {})
			}
		},
		css: {
			preprocessorOptions: {
				scss: {
					silenceDeprecations: ['import', 'legacy-js-api'],
				},
			},
		},
		server: {
			port: 8081,
			proxy: {
				'/storeapi': {
					target: 'http://127.0.0.1:10002',
					changeOrigin: true,
					secure: false
				}
			}
		}
	}
})
