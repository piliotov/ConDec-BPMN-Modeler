import { NODE_TYPES } from './diagramUtils';
import { layoutConnection } from '../canvas/canvasUtils';
export function appendActivityAndConnect(node, diagram) {
  if (!diagram || !node) return null;
  const nodeWidth = node.width || node.size?.width || 100;
  const nodeHeight = node.height || node.size?.height || 50;
  const gap = 100;
  const newX = node.x + nodeWidth + gap;
  const newY = node.y;
  const newNodeId = `activity_${Date.now()}`;
  const newNode = {
    id: newNodeId,
    type: NODE_TYPES.ACTIVITY,
    name: '',
    x: newX,
    y: newY,
    width: nodeWidth,
    height: nodeHeight,
    constraint: null,
    constraintValue: null,
    editing: true
  };
  const waypoints = layoutConnection(
    { ...node, width: nodeWidth, height: nodeHeight },
    { ...newNode, width: nodeWidth, height: nodeHeight }
  );
  const newRelation = {
    id: `relation_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: 'resp_existence',
    sourceId: node.id,
    targetId: newNode.id,
    waypoints
  };
  const updatedDiagram = {
    ...diagram,
    nodes: [...diagram.nodes, newNode],
    relations: [...diagram.relations, newRelation]
  };
  return { updatedDiagram, newNode };
}
