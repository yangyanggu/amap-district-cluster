import { feature } from 'topojson-client'
import bbIdxBuilder from './bbIdxBuilder'
import BoundsItem from './BoundsItem'

function parseTopo(topo) {
    const result = {}
  const objects = topo.objects
  for (const k in objects) {
    result[k] = feature(topo, objects[k])
  }
  return result
}
function filterSub(geoData) {
  for (
    let features = geoData.sub ? geoData.sub.features : [],
      parentProps = geoData.parent.properties,
      subAcroutes = (parentProps.acroutes || []).concat([parentProps.adcode]),
      i = 0,
      len = features.length;
    i < len;
    i++
  ) {
    features[i].properties.subFeatureIndex = i
    features[i].properties.acroutes = subAcroutes
  }
}
function buildData(data) {
  if (!data._isBuiled) {
    bbIdxBuilder.buildIdxList(data.bbIndex)
    data.geoData = parseTopo(data.topo)
    data.geoData.sub && filterSub(data.geoData)
    const bbox = data.topo.bbox
    data.bounds = new BoundsItem(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1])
    data.topo = null
    data._isBuiled = !0
  }
  return data
}
export default {
  buildData
}
