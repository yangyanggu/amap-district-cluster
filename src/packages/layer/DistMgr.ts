import utils from './utils'
import DistrictExplorer from './DistrictExplorer'
import BoundsItem from './BoundsItem'
import SphericalMercator from "./SphericalMercator";
import {polygon, intersect} from "@turf/turf";

const singleDistExplorer = new DistrictExplorer({})
let isDistReady = false,
  singleCountryNode: any = null
const nodeMap = {},
  waitFnList: any[] = []
;(function () {
  function pixelToLngLat(x, y, pz) {
    return SphericalMercator.pointToLngLat([x, y], pz)
  }
  function getBounds(node) {
    const nodeBounds = node.bbounds
    return new AMap.Bounds(
        pixelToLngLat(nodeBounds.x, nodeBounds.y + nodeBounds.height, 20),
        pixelToLngLat(nodeBounds.x + nodeBounds.width, nodeBounds.y, 20)
    )
  }
  function filteAreaTree(root) {
    const stack = [root]
    do {
      const node = stack.pop()
      nodeMap[node.adcode] = node
      const bbox = node.bbox
      node.bbounds = new BoundsItem(bbox[0], bbox[1], bbox[2], bbox[3])
      node.bbox = getBounds(node)
      if (node.children)
        for (let children = node.children, i = 0, len = children.length; i < len; i++) {
          children[i].childIdx = i
          stack.push(children[i])
        }
    } while (stack.length)
  }
  singleDistExplorer.loadAreaTree(function (error, areaTree) {
    if (error) throw error
    filteAreaTree(areaTree)
    singleCountryNode = areaTree
    isDistReady = !0
    if (waitFnList.length) {
      for (let i = 0, len = waitFnList.length; i < len; i++) waitFnList[i][0].call(waitFnList[i][1])
      waitFnList.length = 0
    }
  })
})()
export default class DistMgr {
  _opts: any
  _touchMap: any
  constructor(opts) {
    this._opts = utils.extend(
      {
        topAdcodes: [1e5]
      },
      opts
    )
    this._touchMap = {}
    singleDistExplorer.loadMultiAreaNodes(this._opts.topAdcodes)
  }

  static isReady() {
    return isDistReady
  }
  static getParentAdcode(adcode, acroutes) {
    if (!acroutes) {
      const node = DistMgr.getNodeByAdcode(adcode)
      if (!node) {
        console.warn(`Can not find node: ${adcode}`)
        return null
      }
      acroutes = node.acroutes
    }
    return acroutes && acroutes.length ? acroutes[acroutes.length - 1] : null
  }
  static getSubIdx(subAdcode) {
    return DistMgr.getNodeByAdcode(subAdcode).childIdx
  }
  static getChildrenNum(adcode) {
    const node = DistMgr.getNodeByAdcode(adcode)
    return DistMgr.getChildrenNumOfNode(node)
  }
  static getChildrenNumOfNode(node) {
    return node.children ? node.children.length : node.childrenNum || 0
  }
  static getNodeByAdcode(adcode) {
    const node = nodeMap[adcode]
    if (!node) {
      let areaNode = singleDistExplorer.getLocalAreaNode(`${`${adcode}`.substr(0, 4)}00`)
      areaNode || (areaNode = singleDistExplorer.getLocalAreaNode(`${`${adcode}`.substr(0, 2)}0000`))
      if (!areaNode) return null
      for (let subFeatures = areaNode.getSubFeatures(), i = 0, len = subFeatures.length; i < len; i++)
        if (subFeatures[i].properties.adcode === adcode) return subFeatures[i].properties
    }
    return node
  }
  static getNodeChildren(adcode) {
    const node = DistMgr.getNodeByAdcode(adcode)
    if (!node) return null
    if (node.children) return node.children
    if (node.childrenNum >= 0) {
      const areaNode = singleDistExplorer.getLocalAreaNode(adcode)
      if (!areaNode) return null
      const children: any[] = [],
        subFeatures = areaNode.getSubFeaturesInPixel()
      for (let i = 0, len = subFeatures.length; i < len; i++) children.push(subFeatures[i].properties)
      return children
    }
    return null
  }
  static getExplorer() {
    return singleDistExplorer
  }
  static traverseCountry(bounds, zoom, handler, finish, thisArg) {
    DistMgr.traverseNode(singleCountryNode, bounds, zoom, handler, finish, thisArg)
  }
  static getNodeBoundsSize(node, zoom) {
    const pz = DistMgr.getPixelZoom(),
      scale = Math.pow(2, pz - zoom)
    return [node.bbounds.width / scale, node.bbounds.height / scale]
  }

  static doesRingRingIntersect(mapBounds: AMap.Bounds, bounds: AMap.Bounds){
    const mapArray = [
        mapBounds.getNorthWest().toArray(),
      mapBounds.getNorthEast().toArray(),
      mapBounds.getSouthEast().toArray(),
      mapBounds.getSouthWest().toArray(),
      mapBounds.getNorthWest().toArray()
    ]
    const boxArray = [
        bounds.getNorthWest().toArray(),
      bounds.getNorthEast().toArray(),
      bounds.getSouthEast().toArray(),
      bounds.getSouthWest().toArray(),
      bounds.getNorthWest().toArray()
    ]
    // console.log('mapArray: ', mapArray)
    // console.log('boxArray: ', boxArray)
    /*window.map.add(new (AMap as any).Polygon({
      path: mapArray,
      fillColor: 'green'
    }))
    window.map.add(new (AMap as any).Polygon({
      path: boxArray,
      fillColor: 'red'
    }))*/
    // return AMap.GeometryUtil.doesRingRingIntersect(boxArray, mapArray) || AMap.GeometryUtil.isRingInRing(boxArray, mapArray)
    return !!intersect(polygon([mapArray]), polygon([boxArray]))
  }
  static traverseNode(topNode, bounds: AMap.Bounds, zoom, handler, finish, thisArg, excludedAdcodes?: any) {
    if (!(excludedAdcodes && excludedAdcodes.indexOf(topNode.adcode) >= 0)) {
      if (this.doesRingRingIntersect(bounds, topNode.bbox as AMap.Bounds)) {
        const children = topNode.children,
          hasChildren = children && children.length > 0
        if (zoom > topNode.idealZoom && hasChildren){
          for (let i = 0, len = children.length; i < len; i++){
            DistMgr.traverseNode(children[i], bounds, zoom, handler, null, thisArg, excludedAdcodes)
          }
        }
        else handler.call(thisArg, topNode)
      }
      finish && finish.call(thisArg)
    }
  }
  static onReady(fn, thisArg, canSync?: any) {
    isDistReady
      ? canSync
        ? fn.call(thisArg)
        : setTimeout(function () {
            fn.call(thisArg)
          }, 0)
      : waitFnList.push([fn, thisArg])
  }
  static getPixelZoom() {
    return singleCountryNode?.pz
  }
  static loadAreaNode(adcode, callback, thisArg, callSync) {
    singleDistExplorer.loadAreaNode(adcode, callback, thisArg, callSync)
  }

  isExcludedAdcode(adcode) {
    const excludedAdcodes = this._opts.excludedAdcodes
    return excludedAdcodes && excludedAdcodes.indexOf(adcode) >= 0
  }
  traverseTopNodes(bounds: AMap.Bounds, zoom, handler, finish, thisArg) {
    const topAdcodes = this._opts.topAdcodes,
      excludedAdcodes = this._opts.excludedAdcodes
    for (let i = 0, len = topAdcodes.length; i < len; i++) {
      const node = DistMgr.getNodeByAdcode(topAdcodes[i])
      if (!node) throw new Error(`Can not find adcode: ${topAdcodes[i]}`)
      DistMgr.traverseNode(node, bounds, zoom, handler, finish, thisArg, excludedAdcodes)
    }
  }
  tryClearCache(tag, maxLeft) {
    if (!(maxLeft < 0)) {
      const stack = [singleCountryNode],
        list: any[] = [],
        touchMap = this._touchMap
      do {
        const node = stack.pop()
        node.children && utils.mergeArray(stack, node.children)
        const exTag = touchMap[node.adcode]
        exTag && exTag !== tag && list.push(node.adcode)
      } while (stack.length)
      list.sort(function (a, b) {
        const diff = touchMap[a] - touchMap[b]
        return 0 === diff ? a - b : diff
      })
      const toDelLen = list.length - maxLeft
      if (!(toDelLen <= 0))
        for (let i = 0; i < toDelLen; i++)
          singleDistExplorer.clearAreaNodeCacheByAdcode(list[i]) && this.touchAdcode(list[i], null)
    }
  }
  touchAdcode(adcode, tag) {
    this._touchMap[adcode] = tag
  }
}
