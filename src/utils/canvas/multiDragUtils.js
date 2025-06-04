import { updateRelationsForNode } from '../relations/relationUtils';
import { MoveMultipleNodesCommand, MoveNodeCommand } from '../commands/DiagramCommands';

function calculateDeltas(multiDragStart, e, zoom) {
  return {
    deltaX: (e.clientX - multiDragStart.startX) / zoom,
    deltaY: (e.clientY - multiDragStart.startY) / zoom
  };
}

function updateNodesPositions(nodes, selectedNodes, deltaX, deltaY) {
  return nodes.map(node => {
    const dragNode = selectedNodes.find(n => n.id === node.id);
    if (dragNode) {
      return { ...node, x: dragNode.x + deltaX, y: dragNode.y + deltaY };
    }
    return node;
  });
}

function updateExtendedRelations(relations, multiDragStart, updatedNodes, deltaX, deltaY) {
  return relations.map(relation => {
    let updatedRelation = { ...relation };
    const selectedNodeIds = multiDragStart.selectedElements.nodes.map(n => n.id);
    const bothNodesSelected = selectedNodeIds.includes(relation.sourceId) && selectedNodeIds.includes(relation.targetId);
    
    if (multiDragStart.selectedElements.relationPoints) {
      const relationWaypoints = multiDragStart.selectedElements.relationPoints
        .filter(rp => rp.relationId === relation.id);
      if (relationWaypoints.length > 0 && Array.isArray(relation.waypoints)) {
        updatedRelation.waypoints = relation.waypoints.map((wp, index) => {
          const dragWaypoint = relationWaypoints.find(rp => rp.waypointIndex === index);
          if (dragWaypoint) {
            return { ...wp, x: dragWaypoint.x + deltaX, y: dragWaypoint.y + deltaY };
          }
          return wp;
        });
      }
    }

    if (bothNodesSelected && updatedRelation.waypoints && updatedRelation.waypoints.length >= 2) {
      const tempDiagram = { nodes: updatedNodes, relations: [updatedRelation] };
      updatedRelation = updateRelationsForNode(
        updatedNodes.find(n => n.id === relation.sourceId), 
        tempDiagram
      )[0];
    }
    
    if (multiDragStart.selectedElements.naryDiamonds) {
      const dragDiamond = multiDragStart.selectedElements.naryDiamonds
        .find(nd => nd.relationId === relation.id);
      if (dragDiamond && relation.diamondPos) {
        updatedRelation.diamondPos = {
          x: dragDiamond.x + deltaX,
          y: dragDiamond.y + deltaY
        };
      }
    }
    
    return updatedRelation;
  });
}

function updateTraditionalRelations(relations, diagram, updatedNodes, movedNodeIds) {
  return relations.map(relation => {
    const bothNodesSelected = movedNodeIds.includes(relation.sourceId) && movedNodeIds.includes(relation.targetId);
    
    if (bothNodesSelected) {
      const tempDiagram = { nodes: updatedNodes, relations: [relation] };
      return updateRelationsForNode(
        updatedNodes.find(n => n.id === relation.sourceId), 
        tempDiagram
      )[0];
    } else if (movedNodeIds.includes(relation.sourceId) || movedNodeIds.includes(relation.targetId)) {
      const movedNode = updatedNodes.find(n => 
        movedNodeIds.includes(n.id) && 
        (n.id === relation.sourceId || n.id === relation.targetId)
      );
      if (movedNode) {
        const tempDiagram = { nodes: updatedNodes, relations: [relation] };
        return updateRelationsForNode(movedNode, tempDiagram)[0];
      }
    }
    return relation;
  });
}

function executeMoveCommands(movedNodes, scaledDeltaX, scaledDeltaY, commandStack, getDiagram, setDiagram) {
  if (!movedNodes.length || !commandStack || !getDiagram || !setDiagram) return;

  if (movedNodes.length === 1) {
    const node = movedNodes[0];
    const newPosition = { x: node.x + scaledDeltaX, y: node.y + scaledDeltaY };
    const originalPosition = { x: node.x, y: node.y };
    const command = new MoveNodeCommand(
      node.id,
      newPosition,
      getDiagram,
      setDiagram,
      originalPosition
    );
    commandStack.execute(command);
  } else {
    const nodeUpdates = movedNodes.map(node => ({
      id: node.id,
      x: node.x + scaledDeltaX,
      y: node.y + scaledDeltaY
    }));
    
    const command = new MoveMultipleNodesCommand(
      nodeUpdates,
      getDiagram,
      setDiagram
    );
    commandStack.execute(command);
  }
}

export function handleExtendedMultiDragMove({ multiDragStart, diagram, zoom, e, onNodeEdit, onRelationEdit, setMultiDragStart }) {
  if (!multiDragStart || multiDragStart.type !== 'extended' || !multiDragStart.selectedElements) return;
  
  const { deltaX, deltaY } = calculateDeltas(multiDragStart, e, zoom);
  const updatedNodes = updateNodesPositions(diagram.nodes, multiDragStart.selectedElements.nodes, deltaX, deltaY);
  const updatedRelations = updateExtendedRelations(diagram.relations, multiDragStart, updatedNodes, deltaX, deltaY);
  
  if (typeof onNodeEdit === 'function') {
    requestAnimationFrame(() => onNodeEdit(updatedNodes));
  }
  if (typeof onRelationEdit === 'function') {
    requestAnimationFrame(() => onRelationEdit(updatedRelations));
  }

  setMultiDragStart(prev => prev ? { ...prev, lastClientX: e.clientX, lastClientY: e.clientY } : prev);
}

export function handleTraditionalMultiDragMove({ multiDragStart, diagram, zoom, e, onNodeEdit, onRelationEdit, setMultiDragStart }) {
  if (!multiDragStart || !multiDragStart.nodePositions) return;
  
  const { deltaX, deltaY } = calculateDeltas(multiDragStart, e, zoom);
  const updatedNodes = updateNodesPositions(diagram.nodes, multiDragStart.nodePositions, deltaX, deltaY);
  
  if (typeof onNodeEdit === 'function') {
    requestAnimationFrame(() => onNodeEdit(updatedNodes));
  }
  
  if (typeof onRelationEdit === 'function' && diagram && Array.isArray(diagram.relations)) {
    const movedNodeIds = multiDragStart.nodePositions.map(n => n.id);
    const updatedRelations = updateTraditionalRelations(diagram.relations, diagram, updatedNodes, movedNodeIds);
    requestAnimationFrame(() => onRelationEdit(updatedRelations));
  }
  
  setMultiDragStart(prev => prev ? { ...prev, lastClientX: e.clientX, lastClientY: e.clientY } : prev);
}

export function handleExtendedMultiDragUp({ multiDragStart, diagram, zoom, onNodeEdit, onRelationEdit, commandStack, setDiagram, props, getDiagram }) {
  if (!multiDragStart || multiDragStart.type !== 'extended' || !multiDragStart.selectedElements) return;
  
  const deltaX = (multiDragStart.lastClientX !== undefined ? multiDragStart.lastClientX : multiDragStart.startX) - multiDragStart.startX;
  const deltaY = (multiDragStart.lastClientY !== undefined ? multiDragStart.lastClientY : multiDragStart.startY) - multiDragStart.startY;
  const moved = deltaX !== 0 || deltaY !== 0;
  const scaledDeltaX = deltaX / zoom;
  const scaledDeltaY = deltaY / zoom;
  
  const updatedNodes = updateNodesPositions(diagram.nodes, multiDragStart.selectedElements.nodes, scaledDeltaX, scaledDeltaY);
  const updatedRelations = updateExtendedRelations(diagram.relations, multiDragStart, updatedNodes, scaledDeltaX, scaledDeltaY);
  
  if (typeof onNodeEdit === 'function') {
    onNodeEdit(updatedNodes);
  }
  if (typeof onRelationEdit === 'function') {
    onRelationEdit(updatedRelations);
  }

  if (props.setMultiSelectedElements) {
    const newExtendedSelection = {
      nodes: updatedNodes.filter(n => 
        multiDragStart.selectedElements.nodes.some(sn => sn.id === n.id)
      ),
      relationPoints: multiDragStart.selectedElements.relationPoints?.map(rp => ({
        ...rp,
        x: rp.x + scaledDeltaX,
        y: rp.y + scaledDeltaY
      })) || [],
      naryDiamonds: multiDragStart.selectedElements.naryDiamonds?.map(nd => ({
        ...nd,
        x: nd.x + scaledDeltaX,
        y: nd.y + scaledDeltaY
      })) || []
    };
    props.setMultiSelectedElements(newExtendedSelection);
  }

  if (moved) {
    executeMoveCommands(multiDragStart.selectedElements.nodes || [], scaledDeltaX, scaledDeltaY, commandStack, getDiagram, setDiagram);
  }
}

export function handleTraditionalMultiDragUp({ multiDragStart, diagram, zoom, onNodeEdit, commandStack, setDiagram, props, getDiagram }) {
  if (!multiDragStart || !multiDragStart.nodePositions) return;
  
  const deltaX = (multiDragStart.lastClientX !== undefined ? multiDragStart.lastClientX : multiDragStart.startX) - multiDragStart.startX;
  const deltaY = (multiDragStart.lastClientY !== undefined ? multiDragStart.lastClientY : multiDragStart.startY) - multiDragStart.startY;
  const moved = deltaX !== 0 || deltaY !== 0;
  const scaledDeltaX = deltaX / zoom;
  const scaledDeltaY = deltaY / zoom;
  
  const updatedNodes = updateNodesPositions(diagram.nodes, multiDragStart.nodePositions, scaledDeltaX, scaledDeltaY);
  
  if (typeof onNodeEdit === 'function') {
    onNodeEdit(updatedNodes);
  }

  if (props.setMultiSelectedNodes) {
    const newSelection = updatedNodes.filter(n => multiDragStart.nodeIds.includes(n.id));
    props.setMultiSelectedNodes(newSelection);
  }
  
  if (moved) {
    executeMoveCommands(multiDragStart.nodePositions || [], scaledDeltaX, scaledDeltaY, commandStack, getDiagram, setDiagram);
  }
}