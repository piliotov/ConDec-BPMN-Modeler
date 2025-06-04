function isPointInBox(x, y, size, selectionBox) {
  return (
    x - size >= selectionBox.x &&
    x + size <= selectionBox.x + selectionBox.width &&
    y - size >= selectionBox.y &&
    y + size <= selectionBox.y + selectionBox.height
  );
}
function isNodeInBox(node, selectionBox) {
  const nodeLeft = node.x - 50;
  const nodeRight = node.x + 50;
  const nodeTop = node.y - 25;
  const nodeBottom = node.y + 25;
  return (
    nodeLeft >= selectionBox.x &&
    nodeRight <= selectionBox.x + selectionBox.width &&
    nodeTop >= selectionBox.y &&
    nodeBottom <= selectionBox.y + selectionBox.height
  );
}
export function getNodesInMultiSelectionBox(nodes, selectionBox) {
  if (!selectionBox) return [];
  return nodes.filter(node => isNodeInBox(node, selectionBox));
}
export function getRelationsForSelectedNodes(selectedNodes, relations) {
  if (!selectedNodes || !relations || selectedNodes.length < 2) return [];
  const selectedNodeIds = selectedNodes.map(node => node.id);
  const relationPoints = [];
  relations.forEach(relation => {
    if (selectedNodeIds.includes(relation.sourceId) && 
        selectedNodeIds.includes(relation.targetId)) {
      if (relation.waypoints && relation.waypoints.length > 0) {
        relation.waypoints.forEach((waypoint, index) => {
          relationPoints.push({
            type: 'waypoint',
            relationId: relation.id,
            waypointIndex: index,
            x: waypoint.x,
            y: waypoint.y
          });
        });
      }
    }
  });
  return relationPoints;
}
export function getRelationPointsInMultiSelectionBox(relations, selectionBox) {
  if (!selectionBox || !relations) return [];
  const points = [];
  relations.forEach(relation => {
    if (relation.waypoints && relation.waypoints.length > 2) {
      for (let i = 1; i < relation.waypoints.length - 1; i++) {
        const waypoint = relation.waypoints[i];
        if (isPointInBox(waypoint.x, waypoint.y, 5, selectionBox)) {
          points.push({
            type: 'waypoint',
            relationId: relation.id,
            index: i,
            x: waypoint.x,
            y: waypoint.y
          });
        }
      }
    }
  });
  return points;
}
export function getNaryDiamondsInMultiSelectionBox(relations, selectionBox) {
  if (!selectionBox || !relations) return [];
  return relations
    .filter(relation => relation.activities && Array.isArray(relation.activities) && relation.activities.length > 1)
    .filter(relation => relation.diamondPos && isPointInBox(relation.diamondPos.x, relation.diamondPos.y, 15, selectionBox))
    .map(relation => ({
      type: 'naryDiamond',
      relationId: relation.id,
      x: relation.diamondPos.x,
      y: relation.diamondPos.y
    }));
}
export function getAllSelectableElementsInBox(nodes, relations, selectionBox) {
  if (!selectionBox) return { nodes: [], relationPoints: [], naryDiamonds: [] };
  const selectedNodes = getNodesInMultiSelectionBox(nodes, selectionBox);
  const manuallySelectedRelationPoints = getRelationPointsInMultiSelectionBox(relations, selectionBox);
  const autoSelectedRelationPoints = getRelationsForSelectedNodes(selectedNodes, relations);
  const allRelationPoints = [...manuallySelectedRelationPoints, ...autoSelectedRelationPoints];
  const uniqueRelationPoints = allRelationPoints.filter((point, index, arr) => 
    arr.findIndex(p => 
      p.relationId === point.relationId && 
      p.waypointIndex === point.waypointIndex
    ) === index
  );
  return {
    nodes: selectedNodes,
    relationPoints: uniqueRelationPoints,
    naryDiamonds: getNaryDiamondsInMultiSelectionBox(relations, selectionBox)
  };
}
export function getBoundingBoxForMultiSelectedNodes(nodes) {
  if (!nodes || nodes.length === 0) return null;
  const left = Math.min(...nodes.map(n => n.x - 50));
  const right = Math.max(...nodes.map(n => n.x + 50));
  const top = Math.min(...nodes.map(n => n.y - 25));
  const bottom = Math.max(...nodes.map(n => n.y + 25));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}
export function getBoundingBoxForMixedSelection(selectedElements) {
  if (!selectedElements || 
      (!selectedElements.nodes?.length && 
       !selectedElements.relationPoints?.length && 
       !selectedElements.naryDiamonds?.length)) {
    return null;
  }
  const allPoints = [];
  if (selectedElements.nodes) {
    selectedElements.nodes.forEach(node => {
      const nodeWidth = node.width || node.size?.width || 100;
      const nodeHeight = node.height || node.size?.height || 50;
      allPoints.push(
        { x: node.x - nodeWidth/2, y: node.y - nodeHeight/2 },
        { x: node.x + nodeWidth/2, y: node.y + nodeHeight/2 }
      );
    });
  }
  if (selectedElements.relationPoints) {
    selectedElements.relationPoints.forEach(point => {
      allPoints.push({ x: point.x, y: point.y });
    });
  }
  if (selectedElements.naryDiamonds) {
    selectedElements.naryDiamonds.forEach(diamond => {
      allPoints.push({ x: diamond.x, y: diamond.y });
    });
  }
  if (allPoints.length === 0) return null;
  const left = Math.min(...allPoints.map(p => p.x));
  const right = Math.max(...allPoints.map(p => p.x));
  const top = Math.min(...allPoints.map(p => p.y));
  const bottom = Math.max(...allPoints.map(p => p.y));
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

