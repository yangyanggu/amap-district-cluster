/// <reference types="@vuemap/amap-jsapi-types" />
import Event from '../event'
import DistMgr from './DistMgr'
import DistCounter from './DistCounter'
import { BaseRender } from './BaseRender'
import PointItem from './PointItem'
import BoundsItem from './BoundsItem'
import utils from './utils'
import type { RenderOptions } from './BaseRender'

export type { RenderOptions, StyleOption, FeatureStyleByLevelOption } from './BaseRender'

export interface DistrictClusterOptions {
  map: AMap.Map // 地图实例
  zIndex?: number // 默认10
  visible?: boolean //  是否显示
  data: any[] // 数据源数组，每个元素即为点相关的信息
  getPosition: (dataItem: any, dataIndex: number) => AMap.LngLatLike // 透明度，默认1
  autoSetFitView?: boolean // 是否在绘制后自动调整地图视野以适合全部点，默认true
  topAdcodes?: number[] // 顶层区划的adcode列表。默认为[100000]，即全国范围.假如仅需要展示河北和北京，可以设置为[130000, 110000]
  excludedAdcodes?: number[] // 需要排除的区划的adcode列表
  renderOptions: RenderOptions
}

type _OptOptions = Required<DistrictClusterOptions>

class DistrictCluster extends Event {
  _opts: _OptOptions //初始化参数
  map: AMap.Map // 地图实例
  _distMgr: DistMgr
  _distCounter: DistCounter
  renderEngine: BaseRender
  _data = {
    list: [],
    bounds: null,
    source: null
  } as any

  _mouseEvent = utils.bind(
    utils.debounce(() => {
      this.renderLater()
    }, 50),
    this
  )

  constructor(options: DistrictClusterOptions) {
    super()
    this.initCSS()
    const defaultOptions = {
      autoSetFitView: true,
      topAdcodes: [100000],
      visible: true,
      excludedAdcodes: null,
      zIndex: 10,
      renderOptions: {}
    }
    this._opts = utils.extend({}, defaultOptions, options)
    this.map = options.map
    this._distMgr = new DistMgr({
      topAdcodes: this._opts.topAdcodes,
      excludedAdcodes: this._opts.excludedAdcodes
    })
    this._distCounter = new DistCounter({
      distMgr: this._distMgr,
      pointPackerThisArg: this,
      pointPacker: (p) => {
        return this._packDataItem(p)
      }
    })
    this.renderEngine = new BaseRender(this, {
      ...options.renderOptions,
      zIndex: this._opts.zIndex,
      visible: this._opts.visible,
      map: options.map
    })
    this.renderEngine.on('*', (name, ...data: any[]) => {
      this.emit(name as any, ...data)
    })
    this._opts.data && this.setData(this._opts.data)
    this.bindOrUnbindMapEvent()
  }
  bindOrUnbindMapEvent(bind = true) {
    const method = bind ? 'on' : 'off'
    this.map[method]('moveend', this._mouseEvent)
    this.map[method]('zoomend', this._mouseEvent)
    this.map[method]('resize', this._mouseEvent)
    this.map[method]('rotateend', this._mouseEvent)
    this.map[method]('dragend', this._mouseEvent)
  }

  initCSS() {
    const id = '_amap_district_cluster_css'
    const style = document.getElementById(id)
    if (style) {
      return
    }
    const css =
      ".amap-ui-district-cluster-container{cursor:default;-webkit-backface-visibility:hidden;-webkit-transform:translateZ(0) scale(1,1)}.amap-ui-district-cluster-container canvas{position:absolute}.amap-ui-district-cluster-container .amap-ui-hide{display:none!important}.amap-ui-district-cluster-container .overlay-title,.amap-ui-district-cluster-marker{color:#555;background-color:#fffeef;font-size:12px;white-space:nowrap;position:absolute}.amap-ui-district-cluster-container .overlay-title{padding:2px 6px;display:inline-block;z-index:99999;border:1px solid #7e7e7e;border-radius:2px}.amap-ui-district-cluster-container .overlay-title:after,.amap-ui-district-cluster-container .overlay-title:before{content:'';display:block;position:absolute;margin:auto;width:0;height:0;border:solid transparent;border-width:5px}.amap-ui-district-cluster-container .overlay-title.left{transform:translate(10px,-50%)}.amap-ui-district-cluster-container .overlay-title.left:before{top:5px}.amap-ui-district-cluster-container .overlay-title.left:after{left:-9px;top:5px;border-right-color:#fffeef}.amap-ui-district-cluster-container .overlay-title.left:before{left:-10px;border-right-color:#7e7e7e}.amap-ui-district-cluster-container .overlay-title.top{transform:translate(-50%,-130%)}.amap-ui-district-cluster-container .overlay-title.top:before{left:0;right:0}.amap-ui-district-cluster-container .overlay-title.top:after{bottom:-9px;left:0;right:0;border-top-color:#fffeef}.amap-ui-district-cluster-container .overlay-title.top:before{bottom:-10px;border-top-color:#7e7e7e}.amap-ui-district-cluster-marker{border:1px solid #8e8e8e;width:auto;height:22px;border-radius:5px 5px 5px 0;left:0;top:0}.amap-ui-district-cluster-marker:after,.amap-ui-district-cluster-marker:before{content:'';display:block;position:absolute;width:0;height:0;border:solid rgba(0,0,0,0);border-width:6px;left:13px}.amap-ui-district-cluster-marker:after{bottom:-12px;border-top-color:#fffeef}.amap-ui-district-cluster-marker:before{bottom:-13px;border-top-color:#8e8e8e}.amap-ui-district-cluster-marker span{vertical-align:middle;padding:3px 5px;display:inline-block;height:16px;line-height:16px}.amap-ui-district-cluster-marker-title{border-radius:5px 0 0 0}.amap-ui-district-cluster-marker-body{background-color:#dc3912;color:#fff;border-radius:0 5px 5px 0}.amap-ui-district-cluster-marker.level_country .amap-ui-district-cluster-marker-body{background-color:#36c}.amap-ui-district-cluster-marker.level_province .amap-ui-district-cluster-marker-body{background-color:#dc3912}.amap-ui-district-cluster-marker.level_city .amap-ui-district-cluster-marker-body{background-color:#909}.amap-ui-district-cluster-marker.level_district .amap-ui-district-cluster-marker-body{background-color:#d47}"
    const d = document,
      a = 'appendChild',
      i = 'styleSheet',
      s = d.createElement('style')
    s.id = id
    s.type = 'text/css'
    d.getElementsByTagName('head')[0][a](s)
    s[i] ? (s[i].cssText = css) : s[a](d.createTextNode(css))
  }

  getMinZoomToShowSub(adcode) {
    return this.renderEngine.getMinZoomToShowSub(adcode)
  }
  getAreaNodeProps(adcode) {
    return this._distMgr.getNodeByAdcode(adcode)
  }
  getDistrictExplorer() {
    return this._distMgr.getExplorer()
  }
  getRender() {
    return this.renderEngine
  }
  zoomToShowSubFeatures(adcode, center?: any) {
    this.renderEngine.zoomToShowSubFeatures(adcode, center)
  }
  renderLater(time?: number) {
    this.renderEngine.renderLater(time)
  }
  render() {
    this.renderEngine.render()
  }
  forceRender() {
    this.renderEngine.forceRender()
  }
  getDistMgr() {
    return this._distMgr
  }
  _clearData() {
    this.trigger('willClearData')
    this._data
      ? (this._data.list.length = 0)
      : (this._data = {
          list: [],
          bounds: null
        })
    this._data.source = null
    this._data.bounds = null
    this._data.kdTree = null
    this._distCounter.clearData()
    this.trigger('didClearData')
  }
  _buildDataItems(data) {
    const opts = this._opts,
      posGetter = opts.getPosition,
      list = this._data.list,
      bounds = this._data.bounds
    for (let idx = 0, len = data.length; idx < len; idx++) {
      let point = data[idx],
        lngLat = posGetter.call(this, point, idx) as any
      if (lngLat) {
        lngLat.getLng && (lngLat = [lngLat.getLng(), lngLat.getLat()])
        list[idx] = new PointItem(lngLat[0], lngLat[1], idx)
        bounds.expandByPoint(lngLat[0], lngLat[1])
      }
    }
  }
  getDataItemsByBounds(bounds) {
    const kdTree = this._data.kdTree
    if (!kdTree) return null
    const min = bounds.getSouthWest(),
      max = bounds.getNorthEast(),
      list = this._data.list,
      idxList = kdTree.range(min.getLng(), min.getLat(), max.getLng(), max.getLat()),
      dataItems: any[] = []
    for (let i = 0, len = idxList.length; i < len; i++) dataItems[i] = this._packDataItem(list[idxList[i]])
    return dataItems
  }
  _packDataItem(pointItem) {
    if (!pointItem) return null
    if (!pointItem._packedItem) {
      const idx = pointItem.idx,
        position = [pointItem.x, pointItem.y]
      pointItem._packedItem = {
        dataIndex: idx,
        dataItem: this._data.source[idx],
        position
      }
    }
    return pointItem._packedItem
  }
  _buildData(data) {
    this._clearData()
    this.trigger('willBuildData', data)
    this._data.source = data
    this._data.bounds = BoundsItem.getBoundsItemToExpand()
    this._buildDataItems(data)
    this._distCounter.setData(this._data.list)
    this.trigger('didBuildData', data)
  }
  setData(data) {
    data || (data = [])
    this._buildData(data)
    this.renderLater(10)
    data.length && this._opts.autoSetFitView && this.setFitView()
  }
  isReady() {
    return this._distMgr.isReady() && !!this._data
  }
  setFitView() {
    const nodeBounds = this._data.bounds,
      map = this.getMap(),
      mapBounds = new AMap.Bounds(
        [nodeBounds.x, nodeBounds.y],
        [nodeBounds.x + nodeBounds.width, nodeBounds.y + nodeBounds.height]
      )
    map && map.setBounds(mapBounds)
  }
  getDistCounter() {
    return this._distCounter
  }
  getMap(): any {
    return this._opts.map
  }
  getZooms() {
    return this.renderEngine.getZooms()
  }
  isHidden() {
    return !this._opts.visible
  }
  show() {
    this._opts.visible = true
    return this.getRender().show()
  }
  hide() {
    this._opts.visible = false
    return this.getRender().hide()
  }

  destroy() {
    this.bindOrUnbindMapEvent(false)
    this.getRender().destroy()
    this._distCounter.destroy()
    this._distMgr.destroy()
    this.renderEngine = null as any
    this._data = {
      list: [],
      bounds: null
    }
    this._distMgr = null as any
    this.map = undefined as any
    this._opts = undefined as any
  }

  getzIndex(): number {
    return this._opts.zIndex as number
  }

  setzIndex(zIndex: number) {
    this._opts.zIndex = zIndex
    this.getRender().setzIndex(zIndex)
  }
}

export { DistrictCluster }
