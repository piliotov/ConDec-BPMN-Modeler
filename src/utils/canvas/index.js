export { calculateIntersectionPoint } from '../relations/geometryUtils';
export { useCanvasPanning } from './canvasUtils';
export { updateRelationsForNode } from '../relations/relationUtils';
export { RelationMarkers } from '../relations/relationIconUtils';
export { endConnectMode, getConnectModeState } from './connectModeUtils';
export { 
  getBoundingBoxForMultiSelectedNodes, 
  getAllSelectableElementsInBox, 
  getBoundingBoxForMixedSelection 
} from './multiSelectionUtils';
export { 
  getAlignmentGuidesForPoint, 
  renderAlignmentGuidesSVG 
} from './alignmentUtils';
export const getNodeCenter = (node) => {
  return {
    x: node.x,
    y: node.y
  };
};

export const getNodeEdgePoint = (node, dx, dy) => {
  const w = node.width || node.size?.width || 100;
  const h = node.height || node.size?.height || 50;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const rx = w/2, ry = h/2;
  const tx = dx / len, ty = dy / len;
  let scale = Math.min(
    Math.abs(rx / tx || Infinity),
    Math.abs(ry / ty || Infinity)
  );
  return {
    x: node.x + tx * scale,
    y: node.y + ty * scale
  };
};

export const getAlignmentGuides = (draggedNode, nodes) => {
  if (!draggedNode) return { x: null, y: null };
  const threshold = 2;
  let guideX = null, guideY = null;
  for (const n of nodes) {
    if (n.id === draggedNode.id) continue;
    if (Math.abs(n.x - draggedNode.x) <= threshold) guideX = n.x;
    if (Math.abs(n.y - draggedNode.y) <= threshold) guideY = n.y;
  }
  return { x: guideX, y: guideY };
};

export {
  handleLassoMouseDown,
  handleLassoMouseMove,
  handleLassoMouseUp,
  renderLassoBox
} from './lassoUtils';

export {
  handleExtendedMultiDragMove,
  handleTraditionalMultiDragMove,
  handleExtendedMultiDragUp,
  handleTraditionalMultiDragUp
} from './multiDragUtils';

export {
  renderMultiSelectBoundingBox,
  renderMultiSelectMenu,
  renderHologramNode,
  renderLassoNode
} from './renderUtils';

export {
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  handleCanvasMouseDown
} from './mouseUtils';

export {
  renderDiagramElements
} from './diagramRenderUtils';
