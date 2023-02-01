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

  boundsContainPoint(b: BoundsItem, p: Point): boolean {
    return b.x <= p.x && b.x + b.width >= p.x && b.y <= p.y && b.y + b.height >= p.y
  }
  boundsContain(b1: BoundsItem, b2: BoundsItem): boolean {
    return b1.x <= b2.x && b1.x + b1.width >= b2.x + b2.width && b1.y <= b2.y && b1.y + b1.height >= b2.y + b2.height
  }
  static boundsIntersect(b1: BoundsItem, b2: BoundsItem): boolean {
    return b1.x <= b2.x + b2.width && b2.x <= b1.x + b1.width && b1.y <= b2.y + b2.height && b2.y <= b1.y + b1.height
  }
  containBounds(b: BoundsItem) {
    return this.boundsContain(this, b)
  }
  containPoint(p: Point) {
    return this.boundsContainPoint(this, p)
  }
  clone() {
    return new BoundsItem(this.x, this.y, this.width, this.height)
  }
  isEmpty() {
    return this.width < 0
  }
  getMin() {
    return {
      x: this.x,
      y: this.y
    }
  }
  getMax() {
    return {
      x: this.x + this.width,
      y: this.y + this.height
    }
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
  expandByBounds(bounds: BoundsItem) {
    if (!bounds.isEmpty()) {
      let minX = this.x,
        minY = this.y,
        maxX = this.x + this.width,
        maxY = this.y + this.height
        const newMinX = bounds.x,
        newMaxX = bounds.x + bounds.width,
        newMinY = bounds.y,
        newMaxY = bounds.y + bounds.height
      if (this.isEmpty()) {
        minX = newMinX
        minY = newMinY
        maxX = newMaxX
        maxY = newMaxY
      } else {
        newMinX < minX && (minX = newMinX)
        newMaxX > maxX && (maxX = newMaxX)
        newMinY < minY && (minY = newMinY)
        newMaxY > maxY && (maxY = newMaxY)
      }
      this.x = minX
      this.y = minY
      this.width = maxX - minX
      this.height = maxY - minY
    }
  }
  getTopLeft() {
    return {
      x: this.x,
      y: this.y
    }
  }
  getTopRight() {
    return {
      x: this.x + this.width,
      y: this.y
    }
  }
  getBottomLeft() {
    return {
      x: this.x,
      y: this.y + this.height
    }
  }
  getBottomRight() {
    return {
      x: this.x + this.width,
      y: this.y + this.height
    }
  }
}
