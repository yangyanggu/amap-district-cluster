import Event from '../event'
import DistMgr from './DistMgr'
import utils from './utils'
import BoundsItem from './BoundsItem'
import DistrictExplorer from './DistrictExplorer'
import type { DistrictCluster } from './index'
declare global {
  interface Window {
    Loca: any
  }
}
interface StyleOption {
  strokeColor?: string
  strokeOpacity?: number
  strokeWeight?: number
  fillColor?: string
  fillOpacity?: number
}
interface FeatureStyleByLevelOption {
  country?: StyleOption // 国家
  province?: StyleOption // 省份
  city?: StyleOption // 市
  district?: StyleOption // 区县
}
export interface RenderOptions {
  map: AMap.Map
  // engine?: 'default' | 'loca'
  minHeightToShowSubFeatures?: number
  minSiblingAvgHeightToShowSubFeatures?: number
  minSubAvgHeightToShowSubFeatures?: number
  featureStyleByLevel?: FeatureStyleByLevelOption
  zIndex?: number // 层级
  visible?: boolean // 是否显示
  areaNodeCacheLimit?: number
  getFeatureStyle?: (feature: any, dataItems: any[]) => StyleOption
  zooms?: [number, number]
}
type _OptOptions = Required<RenderOptions>
export class BaseRender extends Event {
  baseId = 1
  _ins: DistrictCluster
  _currentZoom = 2
  _currentScaleFactor?: number
  _currentViewBounds?: BoundsItem
  _currentViewBoundsInLngLat?: AMap.Bounds
  _currentPixelRatio?: number

  _currentFeatures: { feature: any; dataItems: any }[] = []
  _currentRenderId?: number
  _loadLeft = 0
  _isRendering?: boolean
  _opts: _OptOptions
  _distExplorer?: any
  _renderLaterId: any
  _map: AMap.Map
  _polygonCache: AMap.Polygon[] = []
  _markerCache: AMap.Marker[] = []
  layer: any
  loca: any
  _locaPolygonLayer: any
  markerGroup?: AMap.OverlayGroup
  constructor(districtCluster: DistrictCluster, options: RenderOptions) {
    super()
    this._opts = utils.extend(
      {
        engine: 'default',
        featureEventSupport: !0,
        areaNodeCacheLimit: -1,
        minHeightToShowSubFeatures: 630,
        minSiblingAvgHeightToShowSubFeatures: 600,
        minSubAvgHeightToShowSubFeatures: 300,
        zooms: [2, 30],
        featureStyleByLevel: {
          country: {
            strokeColor: 'rgb(31, 119, 180)',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: 'rgb(49, 163, 84)',
            fillOpacity: 0.8
          },
          province: {
            strokeColor: 'rgb(31, 119, 180)',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: 'rgb(116, 196, 118)',
            fillOpacity: 0.7
          },
          city: {
            strokeColor: 'rgb(31, 119, 180)',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: 'rgb(161, 217, 155)',
            fillOpacity: 0.6
          },
          district: {
            strokeColor: 'rgb(31, 119, 180)',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: 'rgb(199, 233, 192)',
            fillOpacity: 0.5
          }
        }
      },
      options
    )
    this._map = this._opts.map
    this._createLayer()
    this._ins = districtCluster
    this._isRendering = !1
    this._loadLeft = 0
    this._currentFeatures = []
    this._distExplorer = new DistrictExplorer({
      map: this._ins.getMap()
    })
  }

  _createLayer() {
    this.markerGroup = new AMap.OverlayGroup()
    this._map.add(this.markerGroup as any)
    /*if(this._opts.engine === 'loca'){
      this.loca = new window.Loca.Container({
        map: this._map
      });
      this._locaPolygonLayer = new window.Loca.PolygonLayer({
        zIndex: this._opts.zIndex,
        visible: this._opts.visible
      })
      this._locaPolygonLayer.setSource(new window.Loca.GeoJSONSource({
        data: {
          "type": "FeatureCollection",
          "features": []
        }
      }))
      this._locaPolygonLayer.setStyle({
        topColor: (index, feature) => {
          return this._getFeatureStyleOptions(feature, feature.properties.dataItems).fillColor
        }
      })
      this.loca.add(this._locaPolygonLayer)
    }else{*/
    this.layer = new (AMap as any).VectorLayer({
      zIndex: this._opts.zIndex || 10,
      visible: this._opts.visible || true
    })
    this._map.addLayer(this.layer)
    // }
  }

  zoomToShowSubFeatures(adcode, center?: any) {
    const minZoomToShowSub = this.getMinZoomToShowSub(adcode)
    if (minZoomToShowSub >= 3) {
      const map = this._ins.getMap()
      if (map) {
        if (!center) {
          const treeNode = DistMgr.getNodeByAdcode(adcode)
          center = treeNode.center
        }
        map.setZoomAndCenter(minZoomToShowSub, center)
      }
    }
  }
  getPixelRatio() {
    return Math.min(2, Math.round(window.devicePixelRatio || 1))
  }
  refreshViewState() {
    if (!DistMgr.isReady()) return !1
    const simpIns = this._ins
    if (!simpIns.isReady()) return !1
    const map = simpIns.getMap() as AMap.Map,
      mapViewBounds = map.getBounds(),
      viewSize = map.getSize(),
      currZoom = map.getZoom(3),
      maxZoom = simpIns.getMaxZoom(),
      scaleFactor = Math.pow(2, maxZoom - currZoom),
      northWest = mapViewBounds.getNorthWest(),
      topLeft = map.lngLatToCoords([northWest.getLng(), northWest.getLat()]),
      bounds = new BoundsItem(topLeft[0], topLeft[1], viewSize.width * scaleFactor, viewSize.height * scaleFactor)
    this._currentZoom = currZoom
    this._currentScaleFactor = scaleFactor
    this._currentViewBounds = bounds
    this._currentViewBoundsInLngLat = mapViewBounds
    this._currentPixelRatio = this.getPixelRatio()
  }
  renderViewport() {
    this.refreshViewState()
    if (!this._currentViewBounds) return !1
    this.trigger('willRenderViewport')
    // this.markerGroup.clearOverlays()
    // this.layer.clear()
    // this._polygonCache = []
    // this._markerCache = []
    this._currentRenderId = this.baseId++
    this._loadLeft = 0
    this._currentFeatures = []
    this._renderViewDist(this._currentRenderId)
    this.trigger('didRenderViewport')
    this._isRendering = false
  }
  getCurrentRenderId() {
    return this._currentRenderId
  }
  isRenderIdStillValid(renderId) {
    return renderId === this._currentRenderId
  }
  _renderViewDist(renderId) {
    const adcodes2Render: any[] = []
    if(this._currentZoom < this._opts.zooms[0] || this._currentZoom > this._opts.zooms[1]){
      this.isRenderIdStillValid(renderId) && this._prepareFeatures(renderId, adcodes2Render)
      return
    }
    this._ins.getDistMgr().traverseTopNodes(
      this._currentViewBoundsInLngLat as AMap.Bounds,
      this._currentZoom,
      (node) => {
        adcodes2Render.push(node.adcode)
      },
      () => {
        // console.log('adcodes2Render: ', adcodes2Render)
        this.isRenderIdStillValid(renderId) && this._prepareFeatures(renderId, adcodes2Render)
      },
      this
    )
  }
  getMinZoomToShowSub(adcode) {
    const treeNode = DistMgr.getNodeByAdcode(adcode)
    if (!treeNode || !treeNode.idealZoom) return -1
    if (!treeNode._minZoomToShowSub) {
      const zooms = this._ins.getZooms() as [number, number]
      for (let i = zooms[0]; i <= zooms[1]; i++)
        if (this.shouldShowSubOnZoom(treeNode, i)) {
          treeNode._minZoomToShowSub = i
          break
        }
    }
    return treeNode._minZoomToShowSub || -1
  }
  shouldShowSubOnZoom(treeNode, zoom) {
    if (!treeNode.idealZoom) return !1
    if (treeNode._minZoomToShowSub && zoom >= treeNode._minZoomToShowSub) return !0
    let boundsSize = DistMgr.getNodeBoundsSize(treeNode, zoom)
    if (1e5 === treeNode.adcode && boundsSize[1] > 400) return !0
    if (boundsSize[1] < this._opts.minHeightToShowSubFeatures) return !1
    let i, len, heightSum
    if (treeNode.children) {
      const children = treeNode.children
      heightSum = 0
      len = children.length
      if (len) {
        for (i = 0; i < len; i++) {
          boundsSize = DistMgr.getNodeBoundsSize(children[i], zoom)
          heightSum += boundsSize[1]
        }
        if (heightSum / len < this._opts.minSubAvgHeightToShowSubFeatures) return !1
      }
    }
    const parentAdcode = DistMgr.getParentAdcode(treeNode.adcode, treeNode.acroutes)
    if (parentAdcode) {
      const parentNode = DistMgr.getNodeByAdcode(parentAdcode),
        siblings = parentNode.children
      siblings || console.error('No children bound', treeNode, parentNode)
      len = siblings.length
      if (len > 1) {
        heightSum = 0
        for (i = 0; i < len; i++)
          if (siblings[i].adcode !== treeNode.adcode) {
            boundsSize = DistMgr.getNodeBoundsSize(siblings[i], zoom)
            heightSum += boundsSize[1]
          }
        if (heightSum / (len - 1) < this._opts.minSiblingAvgHeightToShowSubFeatures) return !1
      }
    }
    return !0
  }
  _shouldShowSub(treeNode) {
    return !(!treeNode.children || !treeNode.children.length) && this.shouldShowSubOnZoom(treeNode, this._currentZoom)
  }
  _prepareFeatures(renderId, adcodes) {
    const justSelfList: any[] = [],
      showSubList: any[] = []
    for (let i = 0, len = adcodes.length; i < len; i++) {
      const treeNode = DistMgr.getNodeByAdcode(adcodes[i])
      if (!treeNode) throw new Error(`Can not find node: ${adcodes[i]}`)
      this._shouldShowSub(treeNode) ? showSubList.push(adcodes[i]) : justSelfList.push(adcodes[i])
    }
    this._prepareSelfFeatures(renderId, justSelfList)
    this._prepareSubFeatures(renderId, showSubList)
    this._checkLoadFinish(renderId)
  }
  _prepareSelfFeatures(renderId, adcodes) {
    let toLoadAdcode
    const currZoom = this._currentZoom as number
    for (let i = 0, len = adcodes.length; i < len; i++) {
      const treeNode = DistMgr.getNodeByAdcode(adcodes[i])
      toLoadAdcode = null
      if (treeNode.acroutes) {
        const parentNode = DistMgr.getNodeByAdcode(treeNode.acroutes[treeNode.acroutes.length - 1])
        ;(!treeNode.idealZoom ||
          currZoom < treeNode.idealZoom - 1 ||
          Math.abs(currZoom - parentNode.idealZoom) <= Math.abs(treeNode.idealZoom - currZoom)) &&
          (toLoadAdcode = parentNode.adcode)
      }
      this._loadAndRenderSelf(renderId, toLoadAdcode ? toLoadAdcode : adcodes[i], adcodes[i])
    }
  }
  _prepareSubFeatures(renderId, adcodes) {
    let i, len
    for (i = 0, len = adcodes.length; i < len; i++) {
      this._loadAndRenderSub(renderId, adcodes[i])
    }
  }
  _renderSelf(renderId, adcode, areaNode) {
    let feature
    if (adcode === areaNode.getAdcode()) {
      feature = areaNode.getParentFeature()
    } else {
      const subFeatures = areaNode.getSubFeatures(),
        subIdx = DistMgr.getSubIdx(adcode)
      feature = subFeatures[subIdx]
      if (!feature) {
        console.warn('Werid, can not find sub feature', areaNode.getAdcode(), adcode)
        return
      }
      if (feature.properties.adcode !== adcode) {
        console.warn('Sub adcode not match!!', subFeatures, subIdx)
        return
      }
    }
    this._ins.getDistCounter().calcDistGroup(
      adcode,
      !1,
      () => {
        this.isRenderIdStillValid(renderId) && this._prepRenderFeatureInPixel(renderId, feature)
      },
      this
    )
  }
  _checkLoadFinish(renderId) {
    if (0 === this._loadLeft) {
      const self = this
      setTimeout(function () {
        self.isRenderIdStillValid(renderId) && self._handleRenderFinish()
      }, 0)
    }
  }
  _renderSub(renderId, areaNode) {
    const subFeatures = areaNode.getSubFeatures()
    this._ins.getDistCounter().calcDistGroup(
      areaNode.getAdcode(),
      !0,
      () => {
        if (this.isRenderIdStillValid(renderId))
          for (let i = 0, len = subFeatures.length; i < len; i++)
            this._prepRenderFeatureInPixel(renderId, subFeatures[i])
      },
      this
    )
  }
  _handleRenderFinish() {
    this._tryFreeMemery()
    this._renderAllFeature()
  }
  _renderAllFeature() {
    // if (this._opts.engine === 'loca') {
    //   this._renderAllFeatureByLoca()
    // } else {
    this._renderAllFeatureByDefault()
    // }
  }
  /*_renderAllFeatureByLoca() {
    const featureData = {
      type: 'FeatureCollection',
      features: []
    } as any
    this._currentFeatures.forEach((item) => {
      const feature = item.feature
      feature.properties.dataItems = item.dataItems
      featureData.features.push(feature)
    })
    this._locaPolygonLayer.setSource(
      new window.Loca.GeoJSONSource({
        data: featureData
      })
    )
  }*/
  _renderAllFeatureByDefault() {
    // 存储需要新增的面区划
    const needRenderPolygons: AMap.Polygon[] = []
    // 存储需要移除的面区划
    const needRemovePolygon: AMap.Polygon[] = []
    // 存储需要新增的聚合点
    const needRenderMarker: AMap.Marker[] = []
    // 存储需要移除的聚合点
    const needRemoveMarker: AMap.Marker[] = []
    for (let i = 0; i < this._polygonCache.length; i++) {
      const prePolygon = this._polygonCache[i]
      const adcode = prePolygon.getExtData().adcode
      let isInCache = false
      for (let j = 0; j < this._currentFeatures.length; j++) {
        const item = this._currentFeatures[j]
        const feature = item.feature
        const props = feature.properties
        if (adcode === props.adcode) {
          isInCache = true
          this._currentFeatures.splice(j, 1)
          break
        }
      }
      if (!isInCache) {
        needRemovePolygon.push(prePolygon)
        this._polygonCache.splice(i, 1)
        needRemoveMarker.push(this._markerCache[i])
        this._markerCache.splice(i, 1)
        i--
      }
    }
    this._currentFeatures.forEach((item) => {
      needRenderPolygons.push(this._createPolygonFeature(item.feature, item.dataItems))
      needRenderMarker.push(this._createClusterMarker(item.feature, item.dataItems))
    })
    this.layer.remove(needRemovePolygon)
    this.markerGroup?.removeOverlays(needRemoveMarker)
    this.layer.add(needRenderPolygons)
    this._polygonCache.push(...needRenderPolygons)
    needRenderPolygons.length = 0
    this.markerGroup?.addOverlays(needRenderMarker)
    this._markerCache.push(...needRenderMarker)
    needRenderMarker.length = 0
  }
  _tryFreeMemery() {
    this._ins.getDistMgr().tryClearCache(this._currentRenderId, this._opts.areaNodeCacheLimit)
  }
  _increaseLoadLeft() {
    this._loadLeft++
  }
  _decreaseLoadLeft(renderId) {
    this._loadLeft--
    0 === this._loadLeft && this._checkLoadFinish(renderId)
  }
  _loadAndRenderSelf(renderId, loadAdcode, adcode) {
    this._ins.getDistMgr().touchAdcode(loadAdcode, renderId)
    const distExplorer = DistMgr.getExplorer(),
      areaNode = distExplorer.getLocalAreaNode(loadAdcode)
    if (areaNode) this._renderSelf(renderId, adcode, areaNode)
    else {
      this._increaseLoadLeft()
      distExplorer.loadAreaNode(
        loadAdcode,
        (error, areaNode) => {
          if (this.isRenderIdStillValid(renderId)) {
            error
              ? console.error(error)
              : this._renderSelf(renderId, adcode, areaNode)
            this._decreaseLoadLeft(renderId)
          }
        },
        this
      )
    }
  }
  _loadAndRenderSub(renderId, adcode) {
    this._ins.getDistMgr().touchAdcode(adcode, renderId)
    const distExplorer = DistMgr.getExplorer(),
      areaNode = distExplorer.getLocalAreaNode(adcode)
    if (areaNode) {
      this._renderSub(renderId, areaNode)
    } else {
      this._increaseLoadLeft()
      distExplorer.loadAreaNode(
        adcode,
        (error, areaNode) => {
          if (this.isRenderIdStillValid(renderId)) {
            error ? console.error(error) : this._renderSub(renderId, areaNode)
            this._decreaseLoadLeft(renderId)
          }
        },
        this
      )
    }
  }
  _prepRenderFeatureInPixel(renderId, feature) {
    if (!this._ins.getDistMgr().isExcludedAdcode(feature.properties.adcode)) {
      const dataItems = this._ins.getDistCounter().getPackItemsByAdcode(feature.properties.adcode)
      this._currentFeatures.push({
        feature,
        dataItems
      })
      // this.renderClusterMarker(renderId, feature, dataItems)
      // this.renderFeature(renderId, feature, null, dataItems)
    }
  }
  _createPolygonFeature(feature, dataItems) {
    const styleOptions = this._getFeatureStyleOptions(feature, dataItems) || {}
    const props = Object.assign({}, feature.properties)
    props.dataItems = dataItems
    const polygon = new (AMap as any).Polygon({
      path: feature.geometry.coordinates,
      ...styleOptions,
      extData: props
    })
    return polygon
    // console.log('renderFeature: ', feature, styleOptions, polygon)
    // console.log('this.layer: ', this.layer)
  }
  renderClusterMarker(renderId, feature, dataItems) {
    const marker = this._createClusterMarker(feature, dataItems)
    this._markerCache.push(marker)
    this.markerGroup?.addOverlay(marker)
    /*let props = feature.properties,
      adcode = props.adcode,
      clusterMarkerMgr = this._clusterMarkerMgr,
      marker = clusterMarkerMgr.findByDataVal('adcode', adcode)
    if (marker && this._opts.clusterMarkerKeepConsistent) clusterMarkerMgr.setTag(marker, renderId)
    else {
      if (!this._opts.getClusterMarkerPosition) return null
      let fromPosition = null,
        targetPosition = this._opts.getClusterMarkerPosition.call(this, feature, dataItems)
      if (targetPosition && this._currentViewBoundsInLngLat.contains(targetPosition)) {
        if (!this._opts.getClusterMarker) return null
        marker = this._opts.getClusterMarker.call(
          this,
          feature,
          dataItems,
          marker || clusterMarkerMgr.pickFromRecycle()
        )
        if (marker) {
          clusterMarkerMgr.setData(marker, 'adcode', adcode)
          const clusterData = {
            adcode,
            feature,
            dataItems
          }
          clusterMarkerMgr.setData(marker, 'clusterData', clusterData)
          const map = this._ins.getMap()
          marker.getMap() !== map && marker.setMap(map)
          this._triggerOnSelfAndIns('clusterMarkerAdd', marker, clusterData)
          if (this._opts.clusterMarkerEventSupport) {
            marker.setClickable(!0)
            marker.setCursor('pointer')
            this._bindClusterMarkerEvents(marker, !0)
          } else {
            marker.setClickable(!1)
            marker.setCursor('default')
          }
          clusterMarkerMgr.add(marker, renderId)
          const parentAdcode = DistMgr.getParentAdcode(adcode, props.acroutes),
            parentMarker = clusterMarkerMgr.findByDataVal('adcode', parentAdcode)
          parentMarker && parentMarker.getMap() === map && (fromPosition = parentMarker.getPosition())
          fromPosition
            ? this._animChildComeOut(renderId, marker, fromPosition, targetPosition)
            : marker.setPosition(targetPosition)
          const children = DistMgr.getNodeChildren(adcode)
          if (children)
            for (let i = 0, len = children.length; i < len; i++) {
              const childMarker = clusterMarkerMgr.findByDataVal('adcode', children[i].adcode)
              childMarker && this._animChildGoBack(renderId, childMarker, targetPosition)
            }
        }
      }
    }*/
  }
  _createClusterMarker(feature, dataItems) {
    const nodeClassNames = {
      title: 'amap-ui-district-cluster-marker-title',
      body: 'amap-ui-district-cluster-marker-body',
      container: 'amap-ui-district-cluster-marker'
    }
    const container = document.createElement('div')
    const title = document.createElement('span')
    title.className = nodeClassNames.title
    const body = document.createElement('span')
    body.className = nodeClassNames.body
    container.appendChild(title)
    container.appendChild(body)
    const props = feature.properties,
      routeNames: any[] = [],
      classNameList = [nodeClassNames.container, `level_${props.level}`, `adcode_${props.adcode}`]
    if (props.acroutes)
      for (let acroutes = props.acroutes, i = 0, len = acroutes.length; i < len; i++) {
        classNameList.push(`descendant_of_${acroutes[i]}`)
        i === len - 1 && classNameList.push(`child_of_${acroutes[i]}`)
        i > 0 && routeNames.push(DistMgr.getNodeByAdcode(acroutes[i]).name)
      }
    container.className = classNameList.join(' ')
    if (routeNames.length > 0) {
      routeNames.push(props.name)
      container.setAttribute('title', routeNames.join('>'))
    } else container.removeAttribute('title')
    title.innerHTML = utils.escapeHtml(props.name)
    body.innerHTML = dataItems.length
    const resultMarker = new AMap.Marker({
      topWhenClick: !0,
      offset: new AMap.Pixel(-20, -30),
      content: container,
      position: props.center
    })
    return resultMarker
  }
  _getFeatureStyleOptions(feature, dataItems): StyleOption {
    const styleGetter = this._opts.getFeatureStyle
    const defaultStyle = this._opts.featureStyleByLevel[feature.properties.level]
    if (!styleGetter) {
      return defaultStyle
    }
    const styleOptions = styleGetter.call(null, feature, dataItems)
    return !styleOptions
      ? defaultStyle
      : utils.extend({}, this._opts.featureStyleByLevel[feature.properties.level], styleOptions)
  }
  renderLater(delay?: number) {
    if (!this._renderLaterId) {
      this._renderLaterId = setTimeout(() => {
        this.render()
      }, delay || 100)
    }
  }
  isRendering() {
    return this._isRendering
  }
  render() {
    if (this._renderLaterId) {
      clearTimeout(this._renderLaterId)
      this._renderLaterId = null
    }
    this._isRendering = true
    DistMgr.onReady(this.renderViewport, this, !0)
  }
  getOption(k) {
    return this._opts[k]
  }
  getOptions() {
    return this._opts
  }
  show() {
    this.layer.show()
  }
  hide() {
    this.layer.hide()
  }
  clear() {
    this.layer.clear()
    this._polygonCache = []
    this._markerCache = []
  }
  setzIndex(zIndex: number) {
    this.layer.setzIndex(zIndex)
  }
  destroy() {
    this._map.removeLayer(this.layer)
    this.clear()
    this.layer = null
    this._map = null as any
    this._ins = null as any
    this._distExplorer.destroy()
    this._distExplorer = null
  }
}
