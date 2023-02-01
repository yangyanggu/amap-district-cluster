function sortKD(ids, coords, nodeSize, left, right, depth) {
  if (!(right - left <= nodeSize)) {
    const m = Math.floor((left + right) / 2)
    select(ids, coords, m, left, right, depth % 2)
    sortKD(ids, coords, nodeSize, left, m - 1, depth + 1)
    sortKD(ids, coords, nodeSize, m + 1, right, depth + 1)
  }
}
function select(ids, coords, k, left, right, inc) {
  for (; right > left; ) {
    if (right - left > 600) {
      const n = right - left + 1,
        m = k - left + 1,
        z = Math.log(n),
        s = 0.5 * Math.exp((2 * z) / 3),
        sd = 0.5 * Math.sqrt((z * s * (n - s)) / n) * (m - n / 2 < 0 ? -1 : 1),
        newLeft = Math.max(left, Math.floor(k - (m * s) / n + sd)),
        newRight = Math.min(right, Math.floor(k + ((n - m) * s) / n + sd))
      select(ids, coords, k, newLeft, newRight, inc)
    }
    let t = coords[2 * k + inc],
      i = left,
      j = right
    swapItem(ids, coords, left, k)
    coords[2 * right + inc] > t && swapItem(ids, coords, left, right)
    for (; i < j; ) {
      swapItem(ids, coords, i, j)
      i++
      j--
      for (; coords[2 * i + inc] < t; ) i++
      for (; coords[2 * j + inc] > t; ) j--
    }
    if (coords[2 * left + inc] === t) swapItem(ids, coords, left, j)
    else {
      j++
      swapItem(ids, coords, j, right)
    }
    j <= k && (left = j + 1)
    k <= j && (right = j - 1)
  }
}
function swapItem(ids, coords, i, j) {
  swap(ids, i, j)
  swap(coords, 2 * i, 2 * j)
  swap(coords, 2 * i + 1, 2 * j + 1)
}
function swap(arr, i, j) {
  const tmp = arr[i]
  arr[i] = arr[j]
  arr[j] = tmp
}
export { sortKD }

function range(ids: any[], coords, minX, minY, maxX, maxY, nodeSize) {
  const result: any[] = []
  for (let x, y, stack = [0, ids.length - 1, 0]; stack.length; ) {
    const axis = stack.pop() as number,
      right = stack.pop() as number,
      left = stack.pop() as number
    if (right - left <= nodeSize)
      for (let i = left; i <= right; i++) {
        x = coords[2 * i]
        y = coords[2 * i + 1]
        x >= minX && x <= maxX && y >= minY && y <= maxY && result.push(ids[i])
      }
    else {
      const m = Math.floor((left + right) / 2)
      x = coords[2 * m]
      y = coords[2 * m + 1]
      x >= minX && x <= maxX && y >= minY && y <= maxY && result.push(ids[m])
      const nextAxis = (axis + 1) % 2
      if (0 === axis ? minX <= x : minY <= y) {
        stack.push(left)
        stack.push(m - 1)
        stack.push(nextAxis)
      }
      if (0 === axis ? maxX >= x : maxY >= y) {
        stack.push(m + 1)
        stack.push(right)
        stack.push(nextAxis)
      }
    }
  }
  return result
}
export { range }

function within(ids, coords, qx, qy, r, nodeSize) {
  const result: any[] = []
  for (let stack = [0, ids.length - 1, 0], r2 = r * r; stack.length; ) {
    const axis = stack.pop() as number,
      right = stack.pop() as number,
      left = stack.pop() as number
    if (right - left <= nodeSize)
      for (let i = left; i <= right; i++) sqDist(coords[2 * i], coords[2 * i + 1], qx, qy) <= r2 && result.push(ids[i])
    else {
      const m = Math.floor((left + right) / 2),
        x = coords[2 * m],
        y = coords[2 * m + 1]
      sqDist(x, y, qx, qy) <= r2 && result.push(ids[m])
      const nextAxis = (axis + 1) % 2
      if (0 === axis ? qx - r <= x : qy - r <= y) {
        stack.push(left)
        stack.push(m - 1)
        stack.push(nextAxis)
      }
      if (0 === axis ? qx + r >= x : qy + r >= y) {
        stack.push(m + 1)
        stack.push(right)
        stack.push(nextAxis)
      }
    }
  }
  return result
}
function sqDist(ax, ay, bx, by) {
  const dx = ax - bx,
    dy = ay - by
  return dx * dx + dy * dy
}
export { within }

export class KDBush {
    nodeSize: number
    points: any[]
    ids: any[]
    coords: any[]
  constructor(points, nodeSize?: number, ArrayType?: any) {
    ArrayType = ArrayType || Array
    this.nodeSize = nodeSize || 64
    this.points = points
    this.ids = new ArrayType(points.length)
    this.coords = new ArrayType(2 * points.length)
    for (let i = 0; i < points.length; i++) {
      this.ids[i] = i
      this.coords[2 * i] = points[i].x
      this.coords[2 * i + 1] = points[i].y
    }
    sortKD(this.ids, this.coords, this.nodeSize, 0, this.ids.length - 1, 0)
  }

  destroy() {
    this.ids.length && (this.ids.length = 0)
    this.coords.length && (this.coords.length = 0)
  }
  range(minX, minY, maxX, maxY) {
    return range(this.ids, this.coords, minX, minY, maxX, maxY, this.nodeSize)
  }
  within(x, y, r) {
    return within(this.ids, this.coords, x, y, r, this.nodeSize)
  }
}
