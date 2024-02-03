/// <reference types="@vuemap/amap-jsapi-types" />

import { polygon } from '@turf/helpers'
import intersect from '@turf/intersect'
import utils from './utils'
import DistrictExplorer from './DistrictExplorer'
import BoundsItem from './BoundsItem'
import SphericalMercator from './SphericalMercator'

interface DeepCount {
  total: number
  count: number
}

export default class DistMgr {
  _opts: any
  _touchMap: any
  singleCountryNode: any
  isDistReady = false
  nodeMap = {}
  waitFnList: any[] = []
  singleDistExplorer = new DistrictExplorer({})
  constructor(opts) {
    this._opts = utils.extend(
      {
        topAdcodes: [1e5]
      },
      opts
    )
    this._touchMap = {}

    this.singleDistExplorer.loadAreaTree((error, areaTree) => {
      if (error) throw error
      this.filterAreaTree(areaTree)
      this.singleCountryNode = areaTree
      this.isDistReady = true
      if (this.waitFnList.length) {
        for (let i = 0, len = this.waitFnList.length; i < len; i++) {
          this.waitFnList[i][0].call(this.waitFnList[i][1])
        }
        this.waitFnList.length = 0
      }
      // console.log('this._opts.topAdcodes: ', this._opts.topAdcodes)
      this.singleDistExplorer.loadMultiAreaNodes(this._opts.topAdcodes)
    })
  }
  pixelToLngLat(x, y, pz) {
    return SphericalMercator.pointToLngLat([x, y], pz)
  }
  getBounds(node) {
    const nodeBounds = node.bbounds
    return new AMap.Bounds(
      this.pixelToLngLat(nodeBounds.x, nodeBounds.y + nodeBounds.height, 20),
      this.pixelToLngLat(nodeBounds.x + nodeBounds.width, nodeBounds.y, 20)
    )
  }
  filterAreaTree(root) {
    const stack = [root]
    do {
      const node = stack.pop()
      this.nodeMap[node.adcode] = node
      const bbox = node.bbox
      node.bbounds = new BoundsItem(bbox[0], bbox[1], bbox[2], bbox[3])
      node.bbox = this.getBounds(node)
      if (node.children)
        for (let children = node.children, i = 0, len = children.length; i < len; i++) {
          children[i].childIdx = i
          stack.push(children[i])
        }
    } while (stack.length)
  }

  isReady() {
    return this.isDistReady
  }
  getParentAdcode(adcode, acroutes) {
    if (!acroutes) {
      const node = this.getNodeByAdcode(adcode)
      if (!node) {
        console.warn(`Can not find node: ${adcode}`)
        return null
      }
      acroutes = node.acroutes
    }
    return acroutes && acroutes.length ? acroutes[acroutes.length - 1] : null
  }
  getSubIdx(subAdcode) {
    return this.getNodeByAdcode(subAdcode).childIdx
  }
  getChildrenNum(adcode) {
    const node = this.getNodeByAdcode(adcode)
    return this.getChildrenNumOfNode(node)
  }
  getChildrenNumOfNode(node) {
    return node.children ? node.children.length : node.childrenNum || 0
  }
  getNodeByAdcode(adcode) {
    const node = this.nodeMap[adcode]
    if (!node) {
      let areaNode = this.singleDistExplorer.getLocalAreaNode(`${`${adcode}`.substr(0, 4)}00`)
      areaNode || (areaNode = this.singleDistExplorer.getLocalAreaNode(`${`${adcode}`.substr(0, 2)}0000`))
      if (!areaNode) return null
      for (let subFeatures = areaNode.getSubFeatures(), i = 0, len = subFeatures.length; i < len; i++)
        if (subFeatures[i].properties.adcode === adcode) return subFeatures[i].properties
    }
    return node
  }
  getNodeChildren(adcode) {
    const node = this.getNodeByAdcode(adcode)
    if (!node) return null
    if (node.children) return node.children
    if (node.childrenNum >= 0) {
      const areaNode = this.singleDistExplorer.getLocalAreaNode(adcode)
      if (!areaNode) return null
      const children: any[] = [],
        subFeatures = areaNode.getSubFeaturesInPixel()
      for (let i = 0, len = subFeatures.length; i < len; i++) children.push(subFeatures[i].properties)
      return children
    }
    return null
  }
  getExplorer() {
    return this.singleDistExplorer
  }
  traverseCountry(bounds, zoom, handler, finish, thisArg) {
    this.traverseNode(this.singleCountryNode, bounds, zoom, handler, finish, thisArg, [])
  }
  getNodeBoundsSize(node, zoom) {
    const pz = this.getPixelZoom(),
      scale = Math.pow(2, pz - zoom)
    return [node.bbounds.width / scale, node.bbounds.height / scale]
  }

  doesRingRingIntersect(mapBounds: AMap.Bounds, bounds: AMap.Bounds) {
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
    return !!intersect(polygon([mapArray]), polygon([boxArray]))
  }
  traverseNode(topNode, bounds: AMap.Bounds, zoom, handler, finish, thisArg, excludedAdcodes, deepCount?: DeepCount) {
    if (!(excludedAdcodes && excludedAdcodes.indexOf(topNode.adcode) >= 0)) {
      if (this.doesRingRingIntersect(bounds, topNode.bbox as AMap.Bounds)) {
        const children = topNode.children,
          hasChildren = children && children.length > 0
        if (zoom > topNode.idealZoom && hasChildren) {
          for (let i = 0, len = children.length; i < len; i++) {
            this.traverseNode(children[i], bounds, zoom, handler, null, thisArg, excludedAdcodes)
          }
        } else handler.call(thisArg, topNode)
      }
      if (finish) {
        if (deepCount) {
          deepCount.count++
          if (deepCount.count >= deepCount.total) {
            finish.call(thisArg)
          }
        } else {
          finish.call(thisArg)
        }
      }
    }
  }
  onReady(fn, thisArg, canSync?: any) {
    this.isDistReady
      ? canSync
        ? fn.call(thisArg)
        : setTimeout(function () {
            fn.call(thisArg)
          }, 0)
      : this.waitFnList.push([fn, thisArg])
  }
  getPixelZoom() {
    return this.singleCountryNode?.pz
  }
  loadAreaNode(adcode, callback, thisArg, callSync) {
    this.singleDistExplorer.loadAreaNode(adcode, callback, thisArg, callSync)
  }

  isExcludedAdcode(adcode) {
    const excludedAdcodes = this._opts.excludedAdcodes
    return excludedAdcodes && excludedAdcodes.indexOf(adcode) >= 0
  }
  traverseTopNodes(bounds: AMap.Bounds, zoom, handler, finish, thisArg) {
    const topAdcodes = this._opts.topAdcodes,
      excludedAdcodes = this._opts.excludedAdcodes,
      deepCount: DeepCount = {
        total: topAdcodes.length,
        count: 0
      }
    for (let i = 0, len = topAdcodes.length; i < len; i++) {
      const node = this.getNodeByAdcode(topAdcodes[i])
      if (!node) throw new Error(`Can not find adcode: ${topAdcodes[i]}`)
      this.traverseNode(node, bounds, zoom, handler, finish, thisArg, excludedAdcodes, deepCount)
    }
  }
  tryClearCache(tag, maxLeft) {
    if (!(maxLeft < 0)) {
      const stack = [this.singleCountryNode],
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
          this.singleDistExplorer.clearAreaNodeCacheByAdcode(list[i]) && this.touchAdcode(list[i], null)
    }
  }
  touchAdcode(adcode, tag) {
    this._touchMap[adcode] = tag
  }
  destroy() {
    this.singleDistExplorer.destroy()
    this._touchMap = {}
    this.nodeMap = {}
    this.singleDistExplorer = undefined as any
    this._opts = undefined
    this.waitFnList = []
    this.singleCountryNode = undefined
  }
}
