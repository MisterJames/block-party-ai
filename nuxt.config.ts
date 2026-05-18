export default defineNuxtConfig({
  compatibilityDate: '2026-05-18',
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  sourcemap: {
    client: false,
    server: false
  },
  app: {
    head: {
      title: 'Block Party AI',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/brand/favicon-32x32.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '48x48',
          href: '/brand/favicon-48x48.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/brand/apple-touch-icon.png'
        }
      ]
    }
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: ''
  },
  build: {
    transpile: ['vue-echarts']
  },
  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('echarts') || id.includes('zrender') || id.includes('vue-echarts')) {
              return 'charts'
            }

            if (
              id.includes('@nuxt/ui') ||
              id.includes('@nuxt/icon') ||
              id.includes('@iconify') ||
              id.includes('reka-ui') ||
              id.includes('@floating-ui') ||
              id.includes('@vueuse') ||
              id.includes('vaul-vue')
            ) {
              return 'ui-vendor'
            }
          }
        }
      }
    }
  },
  devtools: { enabled: false },
  typescript: {
    typeCheck: true
  }
})
