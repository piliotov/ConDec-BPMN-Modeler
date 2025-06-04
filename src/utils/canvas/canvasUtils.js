import { useRef } from 'react';

/**
 * Initialize canvas panning
 * @param {Object} params
 * @param {Function} params.setCanvasOffset
 * @param {Function} params.setIsPanning
 * @param {Function} params.setPanStart
 * @param {Function} params.setPanOrigin
 * @param {Object} params.canvasOffset
 * @param {Number} params.zoom
 * @returns {Object}
 */
export const useCanvasPanning = ({ 
  setCanvasOffset, 
  setIsPanning, 
  setPanStart, 
  setPanOrigin, 
  canvasOffset,
}) => {
  
  const panStateRef = useRef({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    panOrigin: { x: 0, y: 0 }
  });
  
  const handlePanStart = (e) => {
    const startPos = { x: e.clientX, y: e.clientY };
    const originPos = { x: canvasOffset.x, y: canvasOffset.y };
    
    panStateRef.current = {
      isPanning: true,
      panStart: startPos,
      panOrigin: originPos
    };
    
    setIsPanning(true);
    setPanStart(startPos);
    setPanOrigin(originPos);
  };

  const handlePanMove = (e) => {
    if (!panStateRef.current.isPanning) return;
    
    const dx = e.clientX - panStateRef.current.panStart.x;
    const dy = e.clientY - panStateRef.current.panStart.y;
    
    setCanvasOffset({
      x: panStateRef.current.panOrigin.x + dx,
      y: panStateRef.current.panOrigin.y + dy
    });
  };

  const handlePanEnd = () => {
    panStateRef.current.isPanning = false;
    setIsPanning(false);
  };

  return { handlePanStart, handlePanMove, handlePanEnd };
};

/**
 * @param {Object} canvasSize
 * @param {Object} canvasOffset
 * @param {number} zoom
 * @returns {Object}
 */
export function getVisibleCanvasBounds(canvasSize, canvasOffset, zoom) {
  // Calculate the bounds of the visible area in diagram coordinates
  const left = (0 - canvasOffset.x) / zoom;
  const top = (0 - canvasOffset.y) / zoom;
  const right = (canvasSize.width - canvasOffset.x) / zoom;
  const bottom = (canvasSize.height - canvasOffset.y) / zoom;

  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

// Manhattan layout directions (similar to bpmn-js)
export const DIRECTION = {
  NORTH: 'n',
  EAST: 'e',
  SOUTH: 's',
  WEST: 'w'
};

/**
 * @param {Object} p1
 * @param {Object} p2
 * @returns {string}
 */
export function getDirection(p1, p2) {
  if (Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y)) {
    return p1.x < p2.x ? DIRECTION.EAST : DIRECTION.WEST;
  } else {
    return p1.y < p2.y ? DIRECTION.SOUTH : DIRECTION.NORTH;
  }
}

/**
 * @param {Object} node
 * @param {Object} point
 * @param {Object} nodeSize
 * @returns {Object}
 */
export function getDockingPoint(node, point, nodeSize) {
  const width = node.width || node.size?.width || (nodeSize?.width ?? 100);
  const height = node.height || node.size?.height || (nodeSize?.height ?? 50);
  const centerX = node.x;
  const centerY = node.y;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const dx = point.x - centerX;
  const dy = point.y - centerY;

  if (dx === 0 && dy === 0) {
    return { x: centerX + halfWidth, y: centerY };
  }
  const tx = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);
  return {
    x: centerX + dx * t,
    y: centerY + dy * t
  };
}

/**
 * @param {Object} source 
 * @param {Object} target
 * @param {Object} sourceSize 
 * @param {Object} targetSize 
 * @param {number} connectionPadding 
 * @returns {Array} 
 */
export function createManhattanWaypoints(
  source,
  target,
  sourceSize,
  targetSize,
  connectionPadding = 20
) {
  const sWidth = source.width || source.size?.width || (sourceSize?.width ?? 100);
  const sHeight = source.height || source.size?.height || (sourceSize?.height ?? 50);
  const tWidth = target.width || target.size?.width || (targetSize?.width ?? 100);
  const tHeight = target.height || target.size?.height || (targetSize?.height ?? 50);
  const sourceDock = getDockingPoint(source, target, { width: sWidth, height: sHeight });
  const targetDock = getDockingPoint(target, source, { width: tWidth, height: tHeight });
  const dx = targetDock.x - sourceDock.x;
  const dy = targetDock.y - sourceDock.y;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx < 1e-2 || ady < 1e-2) {
    return [
      { x: sourceDock.x, y: sourceDock.y },
      { x: targetDock.x, y: targetDock.y }
    ];
  }

}

/**
 * @param {Array} waypoints 
 * @param {Object} point 
 * @returns {Array} 
 */
export function addWaypointNearPosition(waypoints, point) {
  if (waypoints.length < 2) {
    return [...waypoints];
  }
  let minDistance = Infinity;
  let insertIndex = 0;
  let newPoint = null;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i+1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    let isNear = false;
    if (length === 0) {
      const distToPoint = Math.sqrt(
        Math.pow(point.x - start.x, 2) + 
        Math.pow(point.y - start.y, 2)
      );
      isNear = distToPoint <= 5;
    } else {
      const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (length * length);
      if (t < 0) {
        isNear = Math.sqrt(
          Math.pow(point.x - start.x, 2) + 
          Math.pow(point.y - start.y, 2)
        ) <= 5;
      } else if (t > 1) {
        isNear = Math.sqrt(
          Math.pow(point.x - end.x, 2) + 
          Math.pow(point.y - end.y, 2)
        ) <= 5;
      } else {
        const projX = start.x + t * dx;
        const projY = start.y + t * dy;
        isNear = Math.sqrt(
          Math.pow(point.x - projX, 2) + 
          Math.pow(point.y - projY, 2)
        ) <= 5;
      }
    }
    if (isNear) {
      const nx = dx / (length || 1);
      const ny = dy / (length || 1);
      const vx = point.x - start.x;
      const vy = point.y - start.y;
      const projLength = nx * vx + ny * vy;
      const clampedProjLength = Math.max(0, Math.min(length, projLength));
      const projX = start.x + clampedProjLength * nx;
      const projY = start.y + clampedProjLength * ny;
      const distance = Math.sqrt(
        Math.pow(point.x - projX, 2) + 
        Math.pow(point.y - projY, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        insertIndex = i + 1;
        newPoint = { x: projX, y: projY };
      }
    }
  }
  if (newPoint) {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(insertIndex, 0, newPoint);
    return newWaypoints;
  }
  return waypoints;
}

/**
 * @param {Array} waypoints 
 * @param {boolean} smoothing 
 * @returns {string} 
 */
export function generateConnectionPath(waypoints, smoothing = true) {
  if (!waypoints || waypoints.length < 2) {
    return '';
  }
  
  if (waypoints.length === 2) {
    return `M${waypoints[0].x},${waypoints[0].y} L${waypoints[1].x},${waypoints[1].y}`;
  }
  
  let path = `M${waypoints[0].x},${waypoints[0].y}`;
  
  if (smoothing) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const curr = waypoints[i];
      const next = waypoints[i + 1];
      
      if (i === 0) {
        path += ` L${next.x},${next.y}`;
      } 
      else if (i === waypoints.length - 2) {
        path += ` L${next.x},${next.y}`;
      }
      else {
        const prev = waypoints[i - 1];
        const inDir = getDirection(prev, curr);
        const outDir = getDirection(curr, next);
        
        if (inDir !== outDir) {
          const thirdDistX = (next.x - curr.x) / 3;
          const thirdDistY = (next.y - curr.y) / 3;
          path += ` C${curr.x + thirdDistX},${curr.y + thirdDistY} ${next.x - thirdDistX},${next.y - thirdDistY} ${next.x},${next.y}`;
        } else {
          path += ` L${next.x},${next.y}`;
        }
      }
    }
  } else {
    for (let i = 1; i < waypoints.length; i++) {
      path += ` L${waypoints[i].x},${waypoints[i].y}`;
    }
  }
  
  return path;
}

/**
 * @param {Object} sourceNode
 * @param {Object} targetNode 
 * @param {Array} existingWaypoints 
 * @returns {Array} 
 */
export function layoutConnection(sourceNode, targetNode, existingWaypoints = []) {
  if (existingWaypoints && existingWaypoints.length >= 2) {
    return existingWaypoints;
  }
  const sourceSize = { width: 100, height: 50 };
  const targetSize = { width: 100, height: 50 };
  const verticalAlign = Math.abs(sourceNode.x - targetNode.x) < 50;
  const horizontalAlign = Math.abs(sourceNode.y - targetNode.y) < 50;
  if (verticalAlign || horizontalAlign) {
    const sourceDock = getDockingPoint(sourceNode, targetNode, sourceSize);
    const targetDock = getDockingPoint(targetNode, sourceNode, targetSize);
    return [
      { x: sourceDock.x, y: sourceDock.y },
      { x: targetDock.x, y: targetDock.y }
    ];
  }
  return createManhattanWaypoints(sourceNode, targetNode, sourceSize, targetSize);
}

/**
 * @param {Object} params 
 * @param {MouseEvent} params.e 
 * @param {boolean} params.isPanning 
 * @param {Function} params.handlePanMove 
 * @param {Object} params.draggedElement 
 * @param {Function} params.setAlignmentGuides 
 * @param {Object} params.diagram 
 * @param {number} params.zoom 
 */
export function handleCanvasMouseMove({
  e,
  isPanning,
  handlePanMove,
  draggedElement,
  setAlignmentGuides,
  diagram,
  zoom
}) {
  if (isPanning) {
    handlePanMove(e);
  }
  if (draggedElement && diagram && Array.isArray(diagram.nodes) && Array.isArray(diagram.relations)) {
    const deltaX = (e.clientX - draggedElement.startX) / zoom;
    const deltaY = (e.clientY - draggedElement.startY) / zoom;
    const newPosition = {
      x: draggedElement.elementX + deltaX,
      y: draggedElement.elementY + deltaY
    };
    const otherNodes = diagram.nodes.filter(n => n.id !== draggedElement.id);
    const { getAlignmentGuidesForPoint } = require('./alignmentUtils');
    const guides = getAlignmentGuidesForPoint(newPosition, otherNodes, diagram.relations);
    if (setAlignmentGuides) {
      setAlignmentGuides(guides);
    }
  }
}
