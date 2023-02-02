interface Point{
    x: number,
    y: number
}

export default class BoundsItem {
  x: number
  y: number
  width: number
  height: number

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  static getBoundsItemToExpand(): BoundsItem {
    return new BoundsItem(Number.MAX_VALUE, Number.MAX_VALUE, -1, -1)
  }

  static boundsIntersect(b1: BoundsItem, b2: BoundsItem): boolean {
    return b1.x <= b2.x + b2.width && b2.x <= b1.x + b1.width && b1.y <= b2.y + b2.height && b2.y <= b1.y + b1.height
  }
  isEmpty() {
    return this.width < 0
  }
  expandByPoint(x, y) {
    let minX, minY, maxX, maxY
    if (this.isEmpty()) {
      minX = maxX = x
      minY = maxY = y
    } else {
      minX = this.x
      minY = this.y
      maxX = this.x + this.width
      maxY = this.y + this.height
      x < minX ? (minX = x) : x > maxX && (maxX = x)
      y < minY ? (minY = y) : y > maxY && (maxY = y)
    }
    this.x = minX
    this.y = minY
    this.width = maxX - minX
    this.height = maxY - minY
  }
}
