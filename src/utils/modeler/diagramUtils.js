export const NODE_TYPES = {
  ACTIVITY: 'activity',
};

export const CONSTRAINTS = {
  ABSENCE: 'absence',
  ABSENCE_N: 'absence_n',
  EXISTENCE_N: 'existence_n',
  EXACTLY_N: 'exactly_n',
  INIT: 'init',
};

export const initialDiagram = {
  nodes: [
    {
      id: 'activity_1',
      type: NODE_TYPES.ACTIVITY,
      name: '',
      x: 150,
      y: 150,
      constraint: null,
      constraintValue: null,
    },
  ],
  relations: [],
};

export function diagramToXML(diagram) {
  return '';
}

export function xmlToDiagram(xmlString) {
  return { nodes: [], relations: [] };
}

export function createNewRelation(sourceId, targetId, relationType, diagram, calculateIntersectionPoint) {
  const sourceNode = diagram.nodes.find(n => n.id === sourceId);
  const targetNode = diagram.nodes.find(n => n.id === targetId);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourcePoint = { x: sourceNode.x, y: sourceNode.y };
  const targetPoint = { x: targetNode.x, y: targetNode.y };
  const sourceEdgePoint = calculateIntersectionPoint(targetPoint, sourcePoint);
  const targetEdgePoint = calculateIntersectionPoint(sourcePoint, targetPoint);
  const waypoints = [
    { x: sourceEdgePoint.x, y: sourceEdgePoint.y },
    { x: targetEdgePoint.x, y: targetEdgePoint.y }
  ];

  return {
    id: `relation_${Date.now()}`,
    type: relationType,
    sourceId: sourceId,
    targetId: targetId,
    waypoints: waypoints
  };
}
