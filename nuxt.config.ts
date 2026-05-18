export default defineNuxtConfig({
  compatibilityDate: '2026-05-18',
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
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
  devtools: { enabled: false },
  typescript: {
    typeCheck: true
  }
})
