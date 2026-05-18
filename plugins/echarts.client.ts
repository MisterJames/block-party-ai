import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'

export default defineNuxtPlugin({
  name: 'echarts',
  setup(nuxtApp) {
    use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])
    nuxtApp.vueApp.component('VChart', VChart)
  }
})
