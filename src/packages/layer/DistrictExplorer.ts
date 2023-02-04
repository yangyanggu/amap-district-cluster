import Event from '../event'
import Const from './Const'
import distDataParser from './distDataParser'
import AreaNode from './AreaNode'

export default class DistrictExplorer extends Event {
  _opts: any
  _areaNodesForLocating: any

  _areaNodeCache: any
  constructor(opts) {
    super()
    this._opts = Object.assign(
      {
        distDataLoc: '//webapi.amap.com/ui/1.1/ui/geo/DistrictExplorer/assets/d_v2'
      },
      opts
    )
    this._areaNodesForLocating = null
    this._areaNodeCache = {}
    this._opts.preload && this.loadMultiAreaNodes(this._opts.preload)
  }

  setAreaNodesForLocating(areaNodes) {
    areaNodes ? Array.isArray(areaNodes) || (areaNodes = [areaNodes]) : (areaNodes = [])
    this._areaNodesForLocating = areaNodes || []
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
  _buildAreaNode(adcode, distData) {
    if (!this._areaNodeCache[adcode]) {
      if (!distData) throw new Error(`Empty distData: ${adcode}`)
      const areaNode = new AreaNode(adcode, distDataParser.buildData(distData), this._opts)
      this._areaNodeCache[adcode] = areaNode
      this._areaNodesForLocating || (this._areaNodesForLocating = [areaNode])
    }
  }
  clearAreaNodeCacheByAdcode(adcode) {
    const nodeCache = this._areaNodeCache
    delete nodeCache[adcode]
    return !0
  }
  destroy() {
    this._areaNodesForLocating = null
    this._areaNodeCache = null
    this._opts = null
  }
}
