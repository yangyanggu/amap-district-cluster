const scaleCache = {},
  earthDiameter = 12756274,
  deg2rad = Math.PI / 180,
  rad2deg = 180 / Math.PI,
  quadPI = Math.PI / 4,
  half2PI = 0.5 / Math.PI
function getScale(level) {
  scaleCache[level] || (scaleCache[level] = 256 * Math.pow(2, level))
  return scaleCache[level]
}
function project(lnglat) {
  let lat = lnglat[1],
    x = lnglat[0] * deg2rad,
    y = lat * deg2rad
  y = Math.log(Math.tan(quadPI + y / 2))
  return [x, y]
}
function transform(point, scale) {
  scale = scale || 1
  const a = half2PI,
    b = 0.5,
    c = -a,
    d = 0.5
  return [scale * (a * point[0] + b), scale * (c * point[1] + d)]
}
function unproject(point) {
  const lng = point[0] * rad2deg,
    lat = (2 * Math.atan(Math.exp(point[1])) - Math.PI / 2) * rad2deg
  return [parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]
}
function untransform(point, scale) {
  const a = half2PI,
    b = 0.5,
    c = -a,
    d = 0.5
  return [(point[0] / scale - b) / a, (point[1] / scale - d) / c]
}
function lngLatToPointByScale(lnglat, scale, round) {
  const p = transform(project(lnglat), scale)
  if (round) {
    p[0] = Math.round(p[0])
    p[1] = Math.round(p[1])
  }
  return p
}
function lngLatToPoint(lnglat, level, round?: any) {
  return lngLatToPointByScale(lnglat, getScale(level), round)
}
function pointToLngLat(point, level) {
  const scale = getScale(level),
    untransformedPoint = untransform(point, scale)
  return unproject(untransformedPoint)
}
function haversineDistance(point1, point2) {
  const cos = Math.cos,
    lat1 = point1[1] * deg2rad,
    lon1 = point1[0] * deg2rad,
    lat2 = point2[1] * deg2rad,
    lon2 = point2[0] * deg2rad,
    dLat = lat2 - lat1,
    dLon = lon2 - lon1,
    a = (1 - cos(dLat) + (1 - cos(dLon)) * cos(lat1) * cos(lat2)) / 2
  return earthDiameter * Math.asin(Math.sqrt(a))
}
export default {
  haversineDistance,
  getScale,
  lngLatToPointByScale,
  pointToLngLat,
  lngLatToPoint
}
