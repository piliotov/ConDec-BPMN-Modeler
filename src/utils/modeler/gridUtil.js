const DEFAULT_GRID_SIZE = 10;
export function snapToGrid(value, gridSize = DEFAULT_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}
export function snapPointToGrid(point, gridSize = DEFAULT_GRID_SIZE) {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize)
  };
}
export function snapNodeDuringDrag(node, deltaX, deltaY, gridSize = DEFAULT_GRID_SIZE) {
  const newX = node.x + deltaX;
  const newY = node.y + deltaY;
  return {
    ...node,
    x: snapToGrid(newX, gridSize),
    y: snapToGrid(newY, gridSize)
  };
}
export function getAlignmentGuidesForPoint(point, nodes = [], relations = [], tolerance = 10) {
  if (!point) return { x: null, y: null };
  let alignX = null;
  let alignY = null;
  let minDistanceX = tolerance;
  let minDistanceY = tolerance;
  nodes.forEach(node => {
    const distanceX = Math.abs(point.x - node.x);
    const distanceY = Math.abs(point.y - node.y);
    if (distanceX < minDistanceX) {
      alignX = node.x;
      minDistanceX = distanceX;
    }
    if (distanceY < minDistanceY) {
      alignY = node.y;
      minDistanceY = distanceY;
    }
  });
  relations.forEach(relation => {
    if (relation.waypoints && relation.waypoints.length >= 2) {
      const midpoint = calculateRelationMidpoint(relation.waypoints);
      if (midpoint) {
        const distanceX = Math.abs(point.x - midpoint.x);
        const distanceY = Math.abs(point.y - midpoint.y);
        if (distanceX < minDistanceX) {
          alignX = midpoint.x;
          minDistanceX = distanceX;
        }
        if (distanceY < minDistanceY) {
          alignY = midpoint.y;
          minDistanceY = distanceY;
        }
      }
    }
    if (relation.diamondPos && (relation.type === 'choice' || relation.type === 'Ex_choice')) {
      const distanceX = Math.abs(point.x - relation.diamondPos.x);
      const distanceY = Math.abs(point.y - relation.diamondPos.y);
      if (distanceX < minDistanceX) {
        alignX = relation.diamondPos.x;
        minDistanceX = distanceX;
      }
      if (distanceY < minDistanceY) {
        alignY = relation.diamondPos.y;
        minDistanceY = distanceY;
      }
    }
  });
  return { x: alignX, y: alignY };
}
function calculateRelationMidpoint(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  let totalLength = 0;
  const segmentLengths = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(length);
    totalLength += length;
  }
  if (totalLength === 0) return waypoints[0];
  const halfLength = totalLength / 2;
  let accumulatedLength = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (accumulatedLength + segmentLengths[i] >= halfLength) {
      const remainingLength = halfLength - accumulatedLength;
      const ratio = remainingLength / segmentLengths[i];
      return {
        x: waypoints[i].x + (waypoints[i + 1].x - waypoints[i].x) * ratio,
        y: waypoints[i].y + (waypoints[i + 1].y - waypoints[i].y) * ratio
      };
    }
    accumulatedLength += segmentLengths[i];
  }
  return waypoints[waypoints.length - 1];
}
