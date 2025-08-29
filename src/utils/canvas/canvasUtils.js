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
  const sourceDock = getDockingPoint(sourceNode, targetNode, sourceSize);
  const targetDock = getDockingPoint(targetNode, sourceNode, targetSize);
  return [
    { x: sourceDock.x, y: sourceDock.y },
    { x: targetDock.x, y: targetDock.y }
  ];
}
