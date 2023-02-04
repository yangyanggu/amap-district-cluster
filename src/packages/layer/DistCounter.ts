import utils from './utils'
import DistMgr from './DistMgr'

function getPosition(p) {
  return [p.x, p.y]
}
export default class DistCounter {
  _opts: any
  _data: any[] = []
  _pointsMap: any = {}
  constructor(opts) {
    this._opts = utils.extend(
      {
        topAdcode: 1e5
      },
      opts
    )
    this.clearData()
  }

  clearData() {
    this._data = []
    this._pointsMap = {}
  }
  setData(data) {
    this.clearData()
    this._data = data
    this._updatePointsMap(this._opts.topAdcode, 'all', data)
  }
  _updatePointsMap(adcode, tag, points) {
    let item = this._pointsMap[adcode]
    item || (item = this._pointsMap[adcode] = {})
    item[tag] = points
    item[`${tag}_pack`] = this._buildPackItemsByAdcode(adcode, points)
  }
  getPointsByAdcode(adcode, tag?: any) {
    return this._pointsMap[adcode] ? this._pointsMap[adcode][tag || 'all'] : []
  }
  getPackItemsByAdcode(adcode, tag?: any) {
    return this._pointsMap[adcode] ? this._pointsMap[adcode][`${tag || 'all'}_pack`] : []
  }
  _buildPackItemsByAdcode(adcode, points) {
    const packer = this._opts.pointPacker,
      items: any[] = []
    for (let i = 0, len = points.length; i < len; i++) items[i] = packer.call(this._opts.pointPackerThisArg, points[i])
    return items
  }
  calcDistGroup(adcode, subInclude, callback, thisArg) {
    const nodeInfo = this._opts.distMgr.getNodeByAdcode(adcode)
    let routes = nodeInfo.acroutes || [1e5]
    if (subInclude && nodeInfo.acroutes) {
      routes = [].concat(routes)
      routes.push(adcode)
    }
    this._calcGroupWithRoutes(routes, 0, callback, thisArg)
  }
  _calcGroupWithRoutes(routes, idx, callback, thisArg) {
    const next = () => {
      idx < routes.length - 1
        ? this._calcGroupWithRoutes(routes, idx + 1, callback, thisArg)
        : callback && callback.call(thisArg)
    }
    const adcode = routes[idx]
    if (this.getPointsByAdcode(adcode, '__done')) next.call(this)
    else {
      const points = this.getPointsByAdcode(adcode)
      if (!points) throw new Error(`Not points found:  ${adcode}`)
      this._opts.distMgr.getExplorer().loadAreaNode(
        adcode,
        (error, areaNode) => {
          this._groupByAreaNode(areaNode, points)
          next.call(this)
        },
        this,
        !0
      )
    }
  }
  _groupByAreaNode(areaNode, points) {
    const groups = areaNode.groupByPosition(points, getPosition),
      isTopNode = areaNode.getAdcode() === this._opts.topAdcode,
      topPoints: any[] = []
    for (let i = 0, len = groups.length; i < len; i++) {
      const item = groups[i]
      if (item.subFeature) {
        this._updatePointsMap(item.subFeature.properties.adcode, 'all', item.points)
        isTopNode && utils.mergeArray(topPoints, item.points)
      } else this._updatePointsMap(areaNode.getAdcode(), 'hanging', item.points)
    }
    isTopNode && this._updatePointsMap(areaNode.getAdcode(), 'all', topPoints)
    this._updatePointsMap(areaNode.getAdcode(), '__done', !0)
  }
  destroy() {
    this.clearData()
    this._opts = null
  }
}
