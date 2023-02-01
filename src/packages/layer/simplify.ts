function getSqDist(p1, p2) {
    const dx = p1[0] - p2[0], dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
}
function getSqSegDist(p, p1, p2) {
    let x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
    if (0 !== dx || 0 !== dy) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = p2[0];
            y = p2[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }
    dx = p[0] - x;
    dy = p[1] - y;
    return dx * dx + dy * dy;
}
function simplifyRadialDist(points, sqTolerance) {
    let prevPoint = points[0]
    const newPoints = [ prevPoint ]
    let point
    for (let i = 1, len = points.length; i < len; i++) {
        point = points[i];
        if (getSqDist(point, prevPoint) > sqTolerance) {
            newPoints.push(point);
            prevPoint = point;
        }
    }
    prevPoint !== point && newPoints.push(point);
    return newPoints;
}
function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    let index, maxSqDist = sqTolerance
    for (let i = first + 1; i < last; i++) {
        const sqDist = getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }
    if (maxSqDist > sqTolerance) {
        index - first > 1 && simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        last - index > 1 && simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}
function simplifyDouglasPeucker(points, sqTolerance) {
    const last = points.length - 1, simplified = [ points[0] ];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);
    return simplified;
}
export default function simplify(points, tolerance, highestQuality) {
    if (points.length <= 2 || 0 === tolerance) return points;
    const sqTolerance = undefined !== tolerance ? tolerance * tolerance : 1;
    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);
    return points;
}
