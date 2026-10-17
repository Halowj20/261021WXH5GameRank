import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App.vue'
import { router } from './router'
import './styles/main.css'

dayjs.locale('zh-cn')

createApp(App).use(ElementPlus, { locale: zhCn }).use(router).mount('#app')
