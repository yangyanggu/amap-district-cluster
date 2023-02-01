import Event from '../event'
import Const from './Const'
import distDataParser from './distDataParser'
import utils from './utils'
import AreaNode from './AreaNode'

export default class DistrictExplorer extends Event {
  _opts: any
  _hoverFeature: any
  _areaNodesForLocating: any

  _areaNodeCache: any
  _renderedPolygons: any[]
  _debouncedHandleMousemove: any
  _activeMap = {} as any
  constructor(opts) {
    super()
    this._opts = Object.assign(
      {
        distDataLoc: '//webapi.amap.com/ui/1.1/ui/geo/DistrictExplorer/assets/d_v2',
        eventSupport: !1,
        keepFeaturePolygonReference: !0,
        mouseEventNames: ['click'],
        mousemoveDebounceWait: -1
      },
      opts
    )
    this._hoverFeature = null
    this._areaNodesForLocating = null
    this._areaNodeCache = {}
    this._renderedPolygons = []
    this._opts.preload && this.loadMultiAreaNodes(this._opts.preload)
    this._debouncedHandleMousemove =
      this._opts.mousemoveDebounceWait > 1
        ? utils.debounce(this._handleMousemove, this._opts.mousemoveDebounceWait)
        : this._handleMousemove
    this._opts.map && this._opts.eventSupport && this._bindMapEvents(!0)
  }

  setAreaNodesForLocating(areaNodes) {
    areaNodes ? Array.isArray(areaNodes) || (areaNodes = [areaNodes]) : (areaNodes = [])
    this._areaNodesForLocating = areaNodes || []
  }
  getLocatedFeature(position) {
    const areaNodes = this._areaNodesForLocating
    if (!areaNodes) return null
    for (let i = 0, len = areaNodes.length; i < len; i++) {
      const feature = areaNodes[i].getLocatedFeature(position)
      if (feature) return feature
    }
    return null
  }
  setMap(map) {
    const oldMap = this._opts.map
    if (oldMap !== map) {
      this.offMapEvents()
      this._opts.map = map
      this._opts.map && this._opts.eventSupport && this._bindMapEvents(true)
    }
  }
  offMapEvents() {
    this._bindMapEvents(!1)
  }
  _bindMapEvents(on) {
    const map = this._opts.map,
      action = on ? 'on' : 'off',
      mouseEventNames = this._opts.mouseEventNames
    for (let i = 0, len = mouseEventNames.length; i < len; i++)
      map[action](mouseEventNames[i], this._handleMouseEvent, this)
    AMap.Browser.mobile || map[action]('mousemove', this._debouncedHandleMousemove, this)
  }
  _handleMouseEvent(e) {
    const feature = this.getLocatedFeature(e.lnglat)
    this.emit((feature ? 'feature' : 'outside') + utils.ucfirst(e.type), e, feature)
  }
  _handleMousemove(e) {
    const feature = this.getLocatedFeature(e.lnglat)
    this.setHoverFeature(feature, e)
    feature && this.emit('featureMousemove', e, feature)
  }
  setHoverFeature(feature, e) {
    const oldHoverFeature = this._hoverFeature
    if (feature !== oldHoverFeature) {
      oldHoverFeature && this.emit('featureMouseout', e, oldHoverFeature)
      this._hoverFeature = feature
      feature && this.emit('featureMouseover', e, feature, oldHoverFeature)
      this.emit('hoverFeatureChanged', e, feature, oldHoverFeature)
    }
  }
  _loadJson(src, callback) {
    const self = this
    return fetch(src, {
      headers: {
        Accept: 'application/json'
      }
    })
      .then((res) => res.json())
      .then((json) => {
        callback && callback.call(self, null, json)
      })
      .catch((error) => {
        if (!callback) throw error
        callback(error)
      })
  }
  _getAreaNodeDataFileName(adcode) {
    return `an_${adcode}.json`
  }
  _getAreaNodeDataSrc(adcode) {
    return `${this._opts.distDataLoc}/${this._getAreaNodeDataFileName(adcode)}`
  }
  _isAreaNodeJsonId(id, adcode) {
    return id.indexOf(!1) && id.indexOf(this._getAreaNodeDataFileName(adcode)) > 0
  }
  loadAreaTree(callback) {
    this._loadJson(`${this._opts.distDataLoc}/area_tree.json`, callback)
  }
  loadCountryNode(callback) {
    this.loadAreaNode(Const.ADCODES.COUNTRY, callback)
  }
  loadMultiAreaNodes(adcodes, callback?: any) {
    let results: any[] = [],
      done = !1,
      left
    function buildCallback(i) {
      return function (error, areaNode) {
        if (!done) {
          left--
          if (error) {
            callback && callback(error)
            done = !0
          } else {
            results[i] = areaNode
            0 === left && callback && callback(null, results)
          }
        }
      }
    }
    if (adcodes && adcodes.length) {
      const len = adcodes.length,
        left = len
      for (let i = 0; i < len; i++) this.loadAreaNode(adcodes[i], callback ? buildCallback(i) : null)
    } else callback && callback(null, [])
  }
  loadAreaNode(adcode, callback, thisArg?: any, canSync?: any) {
    thisArg = thisArg || this
    if (this._areaNodeCache[adcode]) {
      if (callback) {
        const areaNode = this._areaNodeCache[adcode]
        canSync
          ? callback.call(thisArg, null, areaNode, !0)
          : setTimeout(function () {
              callback.call(thisArg, null, areaNode)
            }, 0)
      }
    } else
      this._loadJson(this._getAreaNodeDataSrc(adcode), (err, data) => {
        if (err) callback && callback.call(thisArg, err)
        else {
          this._buildAreaNode(adcode, data)
          callback && callback.call(thisArg, null, this._areaNodeCache[adcode])
        }
      })
  }
  getLocalAreaNode(adcode) {
    return this._areaNodeCache[adcode] || null
  }
  locatePosition(lngLat, callback, opts) {
    opts = utils.extend(
      {
        levelLimit: 10
      },
      opts
    )
    const parentNode = opts.parentNode
    parentNode
      ? this._routeLocate(lngLat, parentNode, [], callback, opts)
      : this.loadCountryNode((err, countryNode) => {
          err ? callback && callback(err) : this._routeLocate(lngLat, countryNode, [], callback, opts)
        })
  }
  _routeLocate(lngLat, parentNode, routes, callback, opts) {
    let subFeature = parentNode.getLocatedSubFeature(lngLat),
      gotChildren = !1
    if (subFeature) {
      routes.pop()
      routes.push(parentNode.getParentFeature())
      routes.push(subFeature)
      gotChildren = parentNode.doesFeatureHasChildren(subFeature)
    }
    gotChildren && routes.length < opts.levelLimit
      ? this.loadAreaNode(parentNode.getAdcodeOfFeature(subFeature), (err, subNode) => {
          err ? callback && callback(err) : this._routeLocate(lngLat, subNode, routes, callback, opts)
        })
      : callback && callback.call(this, null, routes.slice(0, opts.levelLimit))
  }
  _buildAreaNode(adcode, distData) {
    if (!this._areaNodeCache[adcode]) {
      if (!distData) throw new Error(`Empty distData: ${adcode}`)
      const areaNode = new AreaNode(adcode, distDataParser.buildData(distData), this._opts)
      this._areaNodeCache[adcode] = areaNode
      this._areaNodesForLocating || (this._areaNodesForLocating = [areaNode])
    }
  }
  _renderMultiPolygon(coords, styleOptions, attchedData) {
    const polygons: any[] = []
    for (let i = 0, len = coords.length; i < len; i++)
      styleOptions && polygons.push(this._renderPolygon(coords[i], styleOptions[i] || styleOptions, attchedData))
    return polygons
  }
  _renderPolygon(coords, styleOptions, attchedData) {
    if (!styleOptions) return null
    // @ts-ignore
    const polygon = new AMap.Polygon(
      Object.assign(
        {
          bubble: !0,
          lineJoin: 'round',
          map: this._opts.map
        } as any,
        styleOptions,
        {
          path: coords
        } as any
      )
    ) as any
    attchedData && (polygon._attched = attchedData)
    this._opts.keepFeaturePolygonReference && this._renderedPolygons.push(polygon)
    return polygon
  }
  getAdcodeOfFeaturePolygon(polygon) {
    return polygon._attched ? polygon._attched.adcode : null
  }
  findFeaturePolygonsByAdcode(adcode) {
    const list = this._renderedPolygons,
      polys: any[] = []
    adcode = parseInt(adcode, 10)
    for (let i = 0, len = list.length; i < len; i++)
      this.getAdcodeOfFeaturePolygon(list[i]) === adcode && polys.push(list[i])
    return polys
  }
  getAllFeaturePolygons() {
    return this._renderedPolygons
  }
  clearFeaturePolygons() {
    const list = this._renderedPolygons
    for (let i = 0, len = list.length; i < len; i++) list[i].setMap(null)
    list.length = 0
  }
  removeFeaturePolygonsByAdcode(adcode) {
    this.removeFeaturePolygons(this.findFeaturePolygonsByAdcode(adcode))
  }
  removeFeaturePolygons(polygons) {
    for (let list = this._renderedPolygons, i = 0, len = list.length; i < len; i++)
      if (polygons.indexOf(list[i]) >= 0) {
        list[i].setMap(null)
        list.splice(i, 1)
        i--
        len--
      }
  }
  clearAreaNodeCacheByAdcode(adcode) {
    const nodeCache = this._areaNodeCache
    delete nodeCache[adcode]
    return !0
  }
  clearAreaNodeCache(match) {
    if (match) return this.clearAreaNodeCacheByAdcode(match)
    const nodeCache = this._areaNodeCache
    // eslint-disable-next-line no-prototype-builtins
    for (const adcode in nodeCache) nodeCache.hasOwnProperty(adcode) && this.clearAreaNodeCacheByAdcode(adcode)
  }
  renderFeature(feature, styleOptions) {
    if (!styleOptions) return null
    const geometry = feature.geometry
    if (!geometry) return null
    let coords = geometry.coordinates,
      attchedData = feature.properties,
      results: any[] = []
    switch (geometry.type) {
      case 'MultiPolygon':
        results = this._renderMultiPolygon(coords, styleOptions, attchedData)
        break

      case 'Polygon':
        results = [this._renderPolygon(coords, styleOptions, attchedData)]
        break

      default:
        throw new Error(`Unknow geometry: ${geometry.type}`)
    }
    return results
  }
  renderSubFeatures(areaNode, subStyleOption) {
    const features = areaNode.getSubFeatures(),
      isSubStyleFunc = utils.isFunction(subStyleOption),
      results: any[] = []
    for (let i = 0, len = features.length; i < len; i++) {
      const feature = features[i]
      results.push(this.renderFeature(feature, isSubStyleFunc ? subStyleOption.call(this, feature, i) : subStyleOption))
    }
    return results
  }
  renderParentFeature(areaNode, parentStyleOption) {
    return this.renderFeature(areaNode.getParentFeature(), parentStyleOption)
  }
  destroy() {
    this._areaNodeCache = null
    this._renderedPolygons = null as any
    this._opts = null
  }
  setActiveFeatures(features) {
    const activeMap = {}
    for (let i = 0, len = features.length; i < len; i++) activeMap[features[i].properties.adcode] = !0
    this._activeMap = activeMap
  }
  isActiveFeature(feature) {
    return !!feature && (!this._activeMap || !!this._activeMap[feature.properties.adcode])
  }
  getLocatedSubFeature(position) {
    const areaNodes = this._areaNodesForLocating
    if (!areaNodes) return null
    for (let i = 0, len = areaNodes.length; i < len; i++) {
      const featureIdx = areaNodes[i].getLocatedSubFeatureIndex(position)
      if (featureIdx >= 0) {
        const feature = areaNodes[i].getSubFeaturesInPixel()[featureIdx]
        if (this.isActiveFeature(feature)) return feature
        const parentFeature = areaNodes[i].getParentFeatureInPixel()
        if (this.isActiveFeature(parentFeature)) return parentFeature
      }
    }
    return null
  }
}
