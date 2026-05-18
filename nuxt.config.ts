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
