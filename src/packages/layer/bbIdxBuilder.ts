import Const from './Const'
import geomUtils from './geomUtils'
const BBRFLAG = Const.BBRFLAG,
  flagIList: any[] = []
function parseRanges(ranges, radix) {
  const nums: any[] = []
  for (let i = 0, len = ranges.length; i < len; i++) {
    const parts = ranges[i].split('-')
    let start = parts[0],
      end = parts.length > 1 ? parts[1] : start
    start = parseInt(start, radix)
    end = parseInt(end, radix)
    for (let j = start; j <= end; j++) nums.push(j)
  }
  return nums
}
function add2BBList(bbList: any[], seqIdx: number, result) {
  if (bbList[seqIdx]) throw new Error(`Alreay exists:  ${bbList[seqIdx]}`)
  bbList[seqIdx] = result
}
function getFlagI(idx) {
  flagIList[idx] || (flagIList[idx] = [BBRFLAG.I, idx])
  return flagIList[idx]
}
function parseILine(line, radix, bbList) {
  if (line)
    for (
      let parts = line.split(':'),
        fIdx = parseInt(parts[0], radix),
        bIdxes = parseRanges(parts[1].split(','), radix),
        item = getFlagI(fIdx),
        i = 0,
        len = bIdxes.length;
      i < len;
      i++
    )
      add2BBList(bbList, bIdxes[i], item)
}
function parseSLine(line, radix, bbList) {
  if (line) {
    const secList: any[] = []
    let parts = line.split(':')
    let bIdx = parseInt(parts[0], radix)
    const fList = parts[1].split(';')
    for (let i = 0, len = fList.length; i < len; i++) {
      parts = fList[i].split(',')
      const item = [parseInt(parts[0], radix), 0]
      parts.length > 1 && (item[1] = parseInt(parts[1], radix))
      secList.push(item)
    }
    add2BBList(bbList, bIdx, [BBRFLAG.S, secList])
  }
}
function parseMaxRect(l, radix) {
  if (!l) return null
  const parts = l.split(','),
    rect: any[] = []
  for (let i = 0, len = parts.length; i < len; i++) {
    const n = parseInt(parts[i], radix)
    if (n < 0) return null
    rect.push(parseInt(parts[i], radix))
  }
  return rect
}
function parseMultiMaxRect(l, radix) {
  if (!l) return null
  const parts = l.split(';'),
    rectList: any[] = []

  for (let i = 0, len = parts.length; i < len; i++) rectList.push(parseMaxRect(parts[i], radix))
  return rectList
}
function buildIdxList(res) {
  let i, len
  const radix = res.r,
    bbList = [],
    inList = res.idx.i.split('|')
  res.idx.i = null
  for (i = 0, len = inList.length; i < len; i++) parseILine(inList[i], radix, bbList)
  inList.length = 0
  const secList = res.idx.s.split('|')
  res.idx.s = null
  for (i = 0, len = secList.length; i < len; i++) parseSLine(secList[i], radix, bbList)
  secList.length = 0
  res.idx = null
  res.idxList = bbList
  if (res.mxr) {
    res.maxRect = parseMaxRect(res.mxr, radix)
    res.mxr = null
  }
  if (res.mxsr) {
    res.maxSubRect = parseMultiMaxRect(res.mxsr, radix)
    res.mxsr = null
  }
}
function buildRectFeatureClip(data, rect, ringIdxList) {
  for (let features = data.geoData.sub.features, i = 0, len = ringIdxList.length; i < len; i++) {
    const idxItem = ringIdxList[i],
      feature = features[idxItem[0]],
      ring = feature.geometry.coordinates[idxItem[1]][0],
      clipedRing = geomUtils.polygonClip(ring, rect)
    !clipedRing || clipedRing.length < 4
      ? console.warn(`Cliped ring length werid: ${clipedRing}`)
      : (idxItem[2] = clipedRing)
  }
  return !0
}
function prepareGridFeatureClip(data, x, y) {
  const bbIdx = data.bbIndex,
    step = bbIdx.s
  ;(x < 0 || y < 0 || y >= bbIdx.h || x >= bbIdx.w) && console.warn('Wrong x,y', x, y, bbIdx)
  const seqIdx = y * bbIdx.w + x,
    idxItem = bbIdx.idxList[seqIdx]
  if (idxItem[0] !== BBRFLAG.S) return !1
  const ringIdxList = idxItem[1]
  if (ringIdxList[0].length > 2) return !1
  const rectX = x * step + bbIdx.l,
    rectY = y * step + bbIdx.t
  buildRectFeatureClip(
    data,
    [
      [rectX, rectY],
      [rectX + step, rectY],
      [rectX + step, rectY + step],
      [rectX, rectY + step],
      [rectX, rectY]
    ],
    ringIdxList
  )
  return !0
}

export default {
  prepareGridFeatureClip,
  buildIdxList
}
