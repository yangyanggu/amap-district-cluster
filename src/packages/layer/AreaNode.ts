/// <reference types="@vuemap/amap-jsapi-types" />
import Const from './Const'
import bbIdxBuilder from './bbIdxBuilder'
import SphericalMercator from './SphericalMercator'
import geomUtils from './geomUtils'
export default class AreaNode {
  adcode?: any
  _data?: any
  _sqScaleFactor?: any
  _opts?: any
  _sqNearTolerance?: any
  constructor(adcode, data, opts) {
    this.adcode = adcode
    this._data = data
    this._sqScaleFactor = data.scale * data.scale
    this._opts = Object.assign(
      {
        nearTolerance: 2
      },
      opts
    )
    this.setNearTolerance(this._opts.nearTolerance)
  }

  static getPropsOfFeature(f) {
    return f && f.properties ? f.properties : null
  }
  static getAdcodeOfFeature(f) {
    return f ? f.properties.adcode : null
  }
  static doesFeatureHasChildren(f) {
    return !!f && f.properties.childrenNum > 0
  }

  setNearTolerance(t) {
    this._opts.nearTolerance = t
    this._sqNearTolerance = t * t
  }
  getIdealZoom() {
    return this._data.idealZoom
  }
  _getEmptySubFeatureGroupItem(idx) {
    return {
      subFeatureIndex: idx,
      subFeature: this.getSubFeatureByIndex(idx),
      pointsIndexes: [],
      points: []
    }
  }
  groupByPosition(points, getPosition) {
    let i,
      len,
      groupMap = {},
      outsideItem = null
    for (i = 0, len = points.length; i < len; i++) {
      const idx = this.getLocatedSubFeatureIndex(getPosition.call(null, points[i], i))
      groupMap[idx] || (groupMap[idx] = this._getEmptySubFeatureGroupItem(idx))
      groupMap[idx].pointsIndexes.push(i)
      groupMap[idx].points.push(points[i])
      idx < 0 && (outsideItem = groupMap[idx])
    }
    const groupList: any[] = []
    if (this._data.geoData.sub)
      for (i = 0, len = this._data.geoData.sub.features.length; i < len; i++)
        groupList.push(groupMap[i] || this._getEmptySubFeatureGroupItem(i))
    outsideItem && groupList.push(outsideItem)
    groupMap = null as any
    return groupList
  }
  getLocatedSubFeatureIndex(lngLat) {
    return this._getLocatedSubFeatureIndexByPixel(this.lngLatToPixel(lngLat))
  }
  getSubFeatureByIndex(fIdx) {
    if (fIdx >= 0) {
      const features = this.getSubFeatures()
      return features[fIdx]
    }
    return null
  }
  _getLocatedSubFeatureIndexByPixel(pixel) {
    if (!this._data.geoData.sub) return -1
    const data = this._data,
      bbIdx = data.bbIndex,
      offX = pixel[0] - bbIdx.l,
      offY = pixel[1] - bbIdx.t,
      y = Math.floor(offY / bbIdx.s),
      x = Math.floor(offX / bbIdx.s)
    if (x < 0 || y < 0 || y >= bbIdx.h || x >= bbIdx.w) return -1
    const seqIdx = y * bbIdx.w + x,
      idxItem = bbIdx.idxList[seqIdx]
    if (!idxItem) return -1
    const BBRFLAG = Const.BBRFLAG
    switch (idxItem[0]) {
      case BBRFLAG.I:
        return idxItem[1]

      case BBRFLAG.S:
        // bbIdxBuilder.prepareGridFeatureClip(data, x, y, idxItem[1])
        bbIdxBuilder.prepareGridFeatureClip(data, x, y)
        return this._calcLocatedFeatureIndexOfSList(pixel, idxItem[1])

      default:
        throw new Error(`Unknown BBRFLAG: ${idxItem[0]}`)
    }
  }
  _calcNearestFeatureIndexOfSList(pixel, list) {
    let features: any[] = []
    this._data.geoData.sub && (features = this._data.geoData.sub.features)
    const closest = {
      sq: Number.MAX_VALUE,
      idx: -1
    }
    for (let i = 0, len = list.length; i < len; i++) {
      const idxItem = list[i],
        feature = features[idxItem[0]],
        ring = idxItem[2] || feature.geometry.coordinates[idxItem[1]][0],
        sqDistance = geomUtils.sqClosestDistanceToPolygon(pixel, ring)
      if (sqDistance < closest.sq) {
        closest.sq = sqDistance
        closest.idx = idxItem[0]
      }
    }
    return closest.sq / this._sqScaleFactor < this._sqNearTolerance ? closest.idx : -1
  }
  _calcLocatedFeatureIndexOfSList(pixel, list) {
    for (let features = this._data.geoData.sub.features, i = 0, len = list.length; i < len; i++) {
      const idxItem = list[i],
        feature = features[idxItem[0]],
        ring = idxItem[2] || feature.geometry.coordinates[idxItem[1]][0]
      if (geomUtils.pointInPolygon(pixel, ring) || geomUtils.pointOnPolygon(pixel, ring)) return idxItem[0]
    }
    return this._calcNearestFeatureIndexOfSList(pixel, list)
  }
  pixelToLngLat(x, y) {
    return SphericalMercator.pointToLngLat([x, y], this._data.pz)
  }
  lngLatToPixel(lngLat) {
    lngLat instanceof AMap.LngLat && (lngLat = [lngLat.getLng(), lngLat.getLat()])
    const pMx = SphericalMercator.lngLatToPoint(lngLat, this._data.pz)
    return [Math.round(pMx[0]), Math.round(pMx[1])]
  }
  _convertRingCoordsToLngLats(ring) {
    const list: any[] = []
    for (let i = 0, len = ring.length; i < len; i++) list[i] = this.pixelToLngLat(ring[i][0], ring[i][1])
    return list
  }
  _convertPolygonCoordsToLngLats(poly) {
    const list: any[] = []
    for (let i = 0, len = poly.length; i < len; i++) list[i] = this._convertRingCoordsToLngLats(poly[i])
    return list
  }
  _convertMultiPolygonCoordsToLngLats(polys) {
    const list: any[] = []
    for (let i = 0, len = polys.length; i < len; i++) list[i] = this._convertPolygonCoordsToLngLats(polys[i])
    return list
  }
  _convertCoordsToLngLats(type, coordinates) {
    switch (type) {
      case 'MultiPolygon':
        return this._convertMultiPolygonCoordsToLngLats(coordinates)

      default:
        throw new Error(`Unknown type ${type}`)
    }
  }
  _createLngLatFeature(f, extraProps?: any) {
    const newNode = Object.assign({}, f)
    extraProps && Object.assign(newNode.properties, extraProps)
    newNode.geometry = Object.assign({}, newNode.geometry)
    newNode.geometry.coordinates = this._convertCoordsToLngLats(newNode.geometry.type, newNode.geometry.coordinates)
    return newNode
  }
  getAdcode() {
    return this.getProps('adcode')
  }
  getName() {
    return this.getProps('name')
  }
  getChildrenNum() {
    return this.getProps('childrenNum')
  }
  getProps(key) {
    const props = AreaNode.getPropsOfFeature(this._data.geoData.parent)
    return props ? (key ? props[key] : props) : null
  }
  getParentFeature() {
    const geoData = this._data.geoData
    geoData.lngLatParent || (geoData.lngLatParent = this._createLngLatFeature(geoData.parent))
    return geoData.lngLatParent
  }
  getParentFeatureInPixel() {
    return this._data.geoData.parent
  }
  getSubFeatures() {
    const geoData = this._data.geoData
    if (!geoData.sub) return []
    if (!geoData.lngLatSubList) {
      const newFList: any[] = []
      for (let features = geoData.sub.features, i = 0, len = features.length; i < len; i++)
        newFList[i] = this._createLngLatFeature(features[i])
      geoData.lngLatSubList = newFList
    }
    return [].concat(geoData.lngLatSubList)
  }
  getSubFeaturesInPixel() {
    return this._data.geoData.sub ? [].concat(this._data.geoData.sub.features) : []
  }
  getBounds() {
    const data = this._data
    if (!data.lngLatBounds) {
      const nodeBounds = this._data.bounds
      data.lngLatBounds = new AMap.Bounds(
        this.pixelToLngLat(nodeBounds.x, nodeBounds.y + nodeBounds.height),
        this.pixelToLngLat(nodeBounds.x + nodeBounds.width, nodeBounds.y)
      )
    }
    return data.lngLatBounds
  }
}
