<template>
  <div class="hero-map-section" ref="wrapperEl">
    <div class="hero-title-wrapper">
      <InspiraFocusTitle
        sentence="山城 志愿 · 星火燎原"
        :manual-mode="false"
        :blur-amount="6"
        border-color="#1989fa"
        :animation-duration="1"
        :pause-between-animations="2"
      />
    </div>
    <button v-if="currentMap !== 'shi'" @click="backToShi" class="back-btn">← 返回上级地图</button>
    <div ref="mapEl" class="hero-map"></div>
    <div class="scroll-button-wrapper">
      <ScrollButton @click="handleScrollToDashboard" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import chongqingshiGeo from '@/assets/geo/chongqingshi.json'
import chongqingchengquGeo from '@/assets/geo/chongqingchengqu.json'
import chongqingjiaoxianGeo from '@/assets/geo/chongqingjiaoxian.json'
import InspiraFocusTitle from '@/components/common/InspiraFocusTitle.vue'
import ScrollButton from '@/components/common/ScrollButton.vue'

type DistrictDatum = { name: string; value: number }
type ActivityLike = { location?: string | null }
type GeoFeature = {
  properties?: { name?: string; center?: [number, number] | number[] }
  geometry: { coordinates: unknown }
}
type GeoLike = { features: GeoFeature[] }
const toCenterTuple = (center?: [number, number] | number[]): [number, number] | undefined => {
  if (!center || center.length < 2) return undefined
  return [center[0], center[1]]
}

const props = defineProps<{
  activities: ActivityLike[]
  dashboardRef?: HTMLElement | null
}>()

const emit = defineEmits<{
  scrollToDashboard: []
}>()

const mapEl = ref<HTMLDivElement>()
const wrapperEl = ref<HTMLDivElement>()
let chart: ECharts | null = null
type MapSource = Parameters<typeof echarts.registerMap>[1]

// 地图注册名
const CHONGQING_MAP_NAME = 'chongqing_districts'
const CHONGQING_CITY_MAP = 'chongqing_chengqu'
const CHONGQING_SUB_MAP = 'chongqing_jiaoxian'
const shiGeo = chongqingshiGeo as unknown as GeoLike
const cityGeo = chongqingchengquGeo as unknown as GeoLike
const subGeo = chongqingjiaoxianGeo as unknown as GeoLike

/** 配置常量 */
const NANAN_CENTER: [number, number] = [106.560813, 29.523992]
const ANIM_DURATION_MS = 1000
const INITIAL_ZOOM = 2

// 数据存储
const districtData = ref<DistrictDatum[]>([])
const currentMap = ref<'shi' | 'city' | 'sub'>('shi')

// 名称合集（从三个Geo中获取）
const getNamesFromGeo = (geo: GeoLike | undefined): string[] => {
  const feats = geo?.features || []
  return feats.map((f) => f.properties?.name).filter((n): n is string => !!n)
}
const shiChildNames = ref<string[]>(getNamesFromGeo(shiGeo)) // ['重庆城区','重庆郊县']
const urbanDistricts = ref<string[]>(getNamesFromGeo(cityGeo))
const suburbanDistricts = ref<string[]>(getNamesFromGeo(subGeo))
const allGeoNames = Array.from(
  new Set([...shiChildNames.value, ...urbanDistricts.value, ...suburbanDistricts.value])
)

// 从 location 提取 district 名称（优先匹配子集）
const extractDistrict = (location: string | null | undefined): string | null => {
  if (!location) return null
  const allNames = allGeoNames
  const target = allNames.find((n) => location.includes(n))
  return target ?? null
}

// 统计活动次数并构建 districtData
const buildDistrictData = () => {
  const counts = new Map<string, number>()
  props.activities?.forEach((activity) => {
    const district = extractDistrict(activity.location ?? '')
    if (district) {
      counts.set(district, (counts.get(district) || 0) + 1)
    }
  })

  // 计算城区/郊县总和（覆盖 shi 级展示）
  const urbanSum = urbanDistricts.value.reduce((s, name) => s + (counts.get(name) || 0), 0)
  const suburbanSum = suburbanDistricts.value.reduce((s, name) => s + (counts.get(name) || 0), 0)
  counts.set('重庆城区', urbanSum)
  counts.set('重庆郊县', suburbanSum)

  // 使用 union 名称列表（保证包含所有可能的 name）
  districtData.value = Array.from(
    new Set([...shiChildNames.value, ...urbanDistricts.value, ...suburbanDistricts.value])
  ).map((name) => ({ name, value: counts.get(name) ?? 0 }))
}

// 计算 feature 的简单几何质心
const computeFeatureCentroid = (feature: GeoFeature): [number, number] => {
  try {
    const coords = feature.geometry.coordinates
    const pts: [number, number][] = []
    const collect = (c: unknown) => {
      if (!c) return
      if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
        pts.push([c[0], c[1]])
      } else if (Array.isArray(c)) {
        c.forEach((i) => collect(i))
      }
    }
    collect(coords)
    if (!pts.length) return [106.5, 29.53]
    const sum = pts.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0])
    return [sum[0] / pts.length, sum[1] / pts.length]
  } catch {
    return [106.5, 29.53]
  }
}

// 获取 geo 内次数最多的区的中心（优先用 properties.center，否则用质心；若无任何数据返回 geo 的整体中心）
const getMaxCountCenterForGeo = (geo: GeoLike, regionNameInShi: string): [number, number] => {
  const districtNames = getNamesFromGeo(geo)

  // 取出当前 geo 内所有区的数据
  const itemsInThisGeo = districtData.value.filter((d) => districtNames.includes(d.name))

  // 有活动,放大到次数最多的那个区
  if (itemsInThisGeo.some((d) => d.value > 0)) {
    const maxItem = itemsInThisGeo.reduce((a, b) => (a.value > b.value ? a : b))
    const feat = geo.features.find((f) => f.properties?.name === maxItem.name)
    if (feat && feat.properties?.center) {
      const tuple = toCenterTuple(feat.properties.center)
      if (tuple) return tuple
    }
    if (feat) return computeFeatureCentroid(feat)
  }

  // 全是 0 → 用 shi 级大区块（重庆城区/重庆郊县）的 center
  const shiBigRegionFeat = shiGeo.features.find((f) => f.properties?.name === regionNameInShi)
  if (shiBigRegionFeat) {
    const center = toCenterTuple(shiBigRegionFeat.properties?.center)
    if (center) return center
    // 极少情况 center 也不存在，再用质心
    return computeFeatureCentroid(shiBigRegionFeat)
  }

  // 情况3：终极兜底 → 当前 geo 第一个区的 center 或质心
  const firstFeat = geo.features?.[0]
  if (firstFeat) {
    const center = toCenterTuple(firstFeat.properties?.center)
    return center ?? computeFeatureCentroid(firstFeat)
  }

  // 终极终极兜底
  return [106.5, 29.53]
}

// 注册地图（初始注册全图即可，子图在需要时也注册）
const registerMaps = () => {
  try {
    echarts.registerMap(CHONGQING_MAP_NAME, shiGeo as MapSource)
  } catch {
    // ignore if already registered
  }
  try {
    echarts.registerMap(CHONGQING_CITY_MAP, cityGeo as MapSource)
  } catch {}
  try {
    echarts.registerMap(CHONGQING_SUB_MAP, subGeo as MapSource)
  } catch {}
}

// 根据当前地图过滤 data（只把当前 geo 中的区传给 series.data）
const makeSeriesDataForGeo = (geo: GeoLike) => {
  const names = getNamesFromGeo(geo)
  return names.map((name) => {
    const item = districtData.value.find((d) => d.name === name)
    const val = item?.value ?? 0
    return {
      name,
      value: Math.max(val, 0),
      itemStyle: {},
    }
  })
}

// 计算当前级别可视化的 min/max（用于 visualMap）
const calcVisualMinMax = (seriesData: { value: number }[]) => {
  if (!seriesData.length) return { min: 0, max: 1 }
  const values = seriesData.map((d) => d.value)
  const min = Math.min(...values, 0)
  const maxRaw = Math.max(...values)
  const max = Math.max(maxRaw, 1)
  return { min, max }
}

// 渲染 / 切换地图 主函数
const renderMap = async (
  mapKey: 'shi' | 'city' | 'sub' = 'shi',
  opts?: { center?: [number, number]; zoom?: number; animate?: boolean }
) => {
  if (!mapEl.value) return
  registerMaps()
  if (!chart) chart = echarts.init(mapEl.value)

  currentMap.value = mapKey

  // 选择对应的 geo & 注册名
  let mapName = CHONGQING_MAP_NAME
  let geo = shiGeo
  if (mapKey === 'city') {
    mapName = CHONGQING_CITY_MAP
    geo = cityGeo
  } else if (mapKey === 'sub') {
    mapName = CHONGQING_SUB_MAP
    geo = subGeo
  }

  // 构造 series 数据（只包含该 geo 的区）
  const seriesData = makeSeriesDataForGeo(geo)
  const { min, max } = calcVisualMinMax(seriesData)

  // label 显示：所有名字都高亮（color/描边/加粗）
  const labelFormatter = (p: { name?: string }) => p?.name || ''

  const baseOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#1989fa',
      borderWidth: 2,
      textStyle: { color: '#333', fontWeight: '600' },
      formatter:
        '<div style="font-weight:bold;color:#1989fa">{b}</div><div style="margin-top:4px">志愿活动 <strong style="color:#e54c44">{c}</strong> 场</div>',
    },
    visualMap: {
      show: true,
      type: 'continuous',
      min: min,
      max: max,
      left: 'left',
      bottom: '10%',
      text: ['高', '低'],
      calculable: false,
      inRange: {
        color: ['#f5faff', '#cfe9ff', '#1989fa', '#e54c44'],
      },
      textStyle: {
        color: '#1989fa',
        fontWeight: '600',
      },
    },
    series: [
      {
        name: '志愿次数',
        type: 'map',
        map: mapName,
        roam: true,
        selectedMode: false,
        label: {
          show: true,
          color: '#fff',
          fontSize: currentMap.value === 'shi' ? 24 : 18,
          fontWeight: 800,
          textBorderColor: '#1989fa',
          textBorderWidth: 4,
          formatter: labelFormatter,
        },
        emphasis: {
          label: {
            show: true,
            color: '#333',
            fontSize: currentMap.value === 'shi' ? 28 : 22,
            fontWeight: 900,
            textBorderColor: '#fff',
            textBorderWidth: 4,
          },
          itemStyle: {
            areaColor: undefined,
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2.5,
        },
        data: seriesData,
      },
    ],
  }

  chart.setOption(baseOption, true)

  // 默认市级要略微放大
  if (mapKey === 'shi') {
    const center = opts?.center ?? [106.5, 29.53]
    const zoom = opts?.zoom ?? INITIAL_ZOOM
    const animate = opts?.animate ?? true
    chart.setOption({
      series: [
        {
          center,
          zoom,
          animation: animate,
          animationDuration: animate ? ANIM_DURATION_MS : 0,
          animationDurationUpdate: animate ? ANIM_DURATION_MS : 0,
          animationEasing: 'quarticOut',
        },
      ],
    })
  } else {
    // 子图（city/sub）放大逻辑：如果用户传了 center/zoom 用传入的，否则计算
    let center: [number, number] | undefined = opts?.center
    if (!center) {
      // 若该 geo 中有最大值区，放到最大值区；否则使用 geo.features[0].properties.center 或质心
      const values = seriesData.map((s) => s.value)
      const maxVal = Math.max(...values)
      if (maxVal > 0) {
        // 使用最值区的 center/质心
        const maxItem = seriesData.reduce((a, b) => (a.value >= b.value ? a : b))
        const feat = geo.features.find((f) => f.properties?.name === maxItem.name)
        if (feat) {
          center = toCenterTuple(feat.properties?.center) ?? computeFeatureCentroid(feat)
        } else {
          const fallbackFeat = geo.features[0]
          center =
            (fallbackFeat && toCenterTuple(fallbackFeat.properties?.center)) ??
            (fallbackFeat ? computeFeatureCentroid(fallbackFeat) : undefined)
        }
      } else {
        // 全为 0, 优先使用大区中心（重庆城区 / 重庆郊县）
        if (mapKey === 'city') {
          center = NANAN_CENTER // 城区固定南岸区
        } else {
          center = getMaxCountCenterForGeo(subGeo, '重庆郊县')
        }
      }
    }
    const zoom = opts?.zoom ?? 8.0
    const animate = opts?.animate ?? true

    // 先 reset，然后做长动画（5000ms）
    nextTick(() => {
      chart!.setOption({ series: [{ center, zoom: 1.0, animation: false }] })
      chart!.setOption({
        series: [
          {
            center,
            zoom,
            animation: animate,
            animationDuration: animate ? ANIM_DURATION_MS : 0,
            animationDurationUpdate: animate ? ANIM_DURATION_MS : 0,
            animationEasing: 'quarticOut',
          },
        ],
      })
    })
  }

  // 点击行为（顶层 drill-down / 子图点击某区放大到区心）
  chart.off('click')
  chart.on('click', (params: { name?: string }) => {
    const name = params?.name ?? ''
    if (!name) return

    //在 shi 级：点击重庆城区/重庆郊县 进入相应子图
    if (currentMap.value === 'shi') {
      if (shiChildNames.value.includes(name)) {
        if (name.includes('城区') || name.includes('市区')) {
          renderMap('city', { center: NANAN_CENTER, zoom: 8.0, animate: true })
          return
        } else {
          renderMap('sub', {
            center: getMaxCountCenterForGeo(subGeo, '重庆郊县'),
            zoom: 8.0,
            animate: true,
          })
          return
        }
      }
    } else {
      // 在子图：点击某区 -> 放到区中心（短动画）
      const currentGeo = currentMap.value === 'city' ? cityGeo : subGeo
      const feat = currentGeo.features.find((f) => f.properties?.name === name)
      if (feat) {
        const center = toCenterTuple(feat.properties?.center) ?? computeFeatureCentroid(feat)
        chart!.setOption({
          series: [
            {
              center,
              zoom: 8.0,
              animation: true,
              animationDuration: 600,
              animationDurationUpdate: 600,
            },
          ],
        })
      } else {
      }
    }
  })
}

// 返回上级
const backToShi = () => {
  renderMap('shi', { zoom: INITIAL_ZOOM, animate: true })
}

// 滚动到驾驶舱
const handleScrollToDashboard = () => {
  emit('scrollToDashboard')
}

// 窗口 / 容器 resize
const handleResize = () => chart?.resize()

onMounted(() => {
  urbanDistricts.value = getNamesFromGeo(cityGeo)
  suburbanDistricts.value = getNamesFromGeo(subGeo)

  buildDistrictData()
  registerMaps()
  renderMap('shi', { zoom: INITIAL_ZOOM, animate: true })
  window.addEventListener('resize', handleResize)

  // 监听容器尺寸（含左侧菜单伸缩）
  if ('ResizeObserver' in window && wrapperEl.value) {
    const observer = new ResizeObserver(() => handleResize())
    observer.observe(wrapperEl.value)
    ;(wrapperEl.value as HTMLDivElement & { _observer?: ResizeObserver })._observer = observer
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  const current = wrapperEl.value as (HTMLDivElement & { _observer?: ResizeObserver }) | null
  if (current && current._observer) {
    current._observer.unobserve(current)
    current._observer.disconnect()
  }

  chart?.dispose()
  chart = null
})

// props.activities 变化时重建数据并刷新地图（保留当前地图）
watch(
  () => props.activities,
  () => {
    buildDistrictData()
    // 保持当前层级并重新渲染（若在子图，会尝试保留放大/中心逻辑）
    nextTick().then(() => {
      if (currentMap.value === 'shi') {
        renderMap('shi', { zoom: INITIAL_ZOOM, animate: false })
      } else if (currentMap.value === 'city') {
        renderMap('city', { center: NANAN_CENTER, zoom: 8.0, animate: false })
      } else {
        renderMap('sub', {
          center: getMaxCountCenterForGeo(chongqingjiaoxianGeo, '重庆郊县'),
          zoom: 8.0,
          animate: false,
        })
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.hero-map-section {
  position: relative;
  width: 100%;
  max-width: 100vw !important;
  height: 86vh;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 50%, #e6f3ff 100%);
  border-radius: 28px;
  margin: 0 auto;
}

.back-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.96);
  border: 2px solid #1989fa;
  border-radius: 20px;
  color: #1989fa;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(25, 137, 250, 0.1);
}

.back-btn:hover {
  background: #1989fa;
  color: #fff;
}

.hero-map {
  width: 100%;
  height: 100%;
  position: relative;
}

.scroll-button-wrapper {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.hero-title-wrapper {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  /* background: rgba(255, 255, 255, 0.96); */
  backdrop-filter: blur(12px);
  padding: 18px 60px;
  border-radius: 50px;
  /* border: 4px solid #1989fa; */
  /* box-shadow: 0 12px 40px rgba(25, 137, 250, 0.22); */
  white-space: nowrap;
  text-align: center;
}

.hero-title-wrapper :deep(.focus-container) {
  gap: 0.5em;
  flex-wrap: nowrap;
}

.hero-title-wrapper :deep(.focus-word) {
  font-size: 68px;
  font-weight: 900;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  letter-spacing: 10px;
  color: #1989fa;
  line-height: 1.2;
}

@media (max-width: 1280px) {
  .hero-title-wrapper {
    padding: 14px 40px;
    top: 40px;
  }
  .hero-title-wrapper :deep(.focus-word) {
    font-size: 48px;
    letter-spacing: 6px;
  }
  .hero-map-section {
    height: 70vh;
  }
}
</style>
