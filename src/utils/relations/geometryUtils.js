export function calculateIntersectionPoint(point1, point2, width = 100, height = 50) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return point2;
  const nx = dx / length;
  const ny = dy / length;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  let t;
  if (Math.abs(nx) * halfHeight > Math.abs(ny) * halfWidth) {
    t = halfWidth / Math.abs(nx);
  } else {
    t = halfHeight / Math.abs(ny);
  }
  return {
    x: point2.x - nx * t,
    y: point2.y - ny * t
  };
}
export function generatePath(waypoints) {
  if (!waypoints || waypoints.length < 2) return '';
  const path = [`M ${waypoints[0].x} ${waypoints[0].y}`];
  for (let i = 1; i < waypoints.length; i++) {
    const curr = waypoints[i];
    path.push(`L ${curr.x} ${curr.y}`);
  }
  return path.join(' ');
}
