export function getAlignmentGuidesForPoint(point, nodes, relations = [], threshold = 2) {
  if (!point || !Array.isArray(nodes)) return { x: null, y: null };
  
  let guideX = null, guideY = null;
  let minDistanceX = threshold;
  let minDistanceY = threshold;
  for (const n of nodes) {
    const distanceX = Math.abs(n.x - point.x);
    const distanceY = Math.abs(n.y - point.y);
    
    if (distanceX < minDistanceX) {
      guideX = n.x;
      minDistanceX = distanceX;
    }
    if (distanceY < minDistanceY) {
      guideY = n.y;
      minDistanceY = distanceY;
    }
  }
  
  if (Array.isArray(relations)) {
    relations.forEach(relation => {
      if (relation.waypoints && relation.waypoints.length >= 2) {
        const midpoint = calculateRelationMidpoint(relation.waypoints);
        if (midpoint) {
          const distanceX = Math.abs(midpoint.x - point.x);
          const distanceY = Math.abs(midpoint.y - point.y);
          
          if (distanceX < minDistanceX) {
            guideX = midpoint.x;
            minDistanceX = distanceX;
          }
          if (distanceY < minDistanceY) {
            guideY = midpoint.y;
            minDistanceY = distanceY;
          }
        }
      }
      
      if (relation.diamondPos && (relation.type === 'choice' || relation.type === 'ex_choice')) {
        const distanceX = Math.abs(relation.diamondPos.x - point.x);
        const distanceY = Math.abs(relation.diamondPos.y - point.y);
        
        if (distanceX < minDistanceX) {
          guideX = relation.diamondPos.x;
          minDistanceX = distanceX;
        }
        if (distanceY < minDistanceY) {
          guideY = relation.diamondPos.y;
          minDistanceY = distanceY;
        }
      }
    });
  }
  
  return { x: guideX, y: guideY };
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

export function renderAlignmentGuidesSVG(guides, zoom = 1) {
  if (!guides) return null;
  const lines = [];
  if (guides.x !== null) {
    lines.push(
      <line
        key="align-x"
        x1={guides.x}
        y1={-10000}
        x2={guides.x}
        y2={10000}
        stroke="#1976d2"
        strokeWidth={2/zoom}
        strokeDasharray="8,4"
        pointerEvents="none"
        opacity={0.5}
      />
    );
  }
  if (guides.y !== null) {
    lines.push(
      <line
        key="align-y"
        x1={-10000}
        y1={guides.y}
        x2={10000}
        y2={guides.y}
        stroke="#1976d2"
        strokeWidth={2/zoom}
        strokeDasharray="8,4"
        pointerEvents="none"
        opacity={0.5}
      />
    );
  }
  return lines.length ? <g className="alignment-guides">{lines}</g> : null;
}
