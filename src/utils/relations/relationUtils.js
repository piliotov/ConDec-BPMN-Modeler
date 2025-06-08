import { 
  getDockingPoint, 
  layoutConnection, 
} from '../canvas/canvasUtils';
import { CONSTRAINTS } from '../modeler/diagramUtils';
export const RELATION_TYPES = {
  RESP_EXISTENCE: 'resp_existence',
  COEXISTENCE: 'coexistence',
  RESPONSE: 'response', 
  PRECEDENCE: 'precedence',
  SUCCESSION: 'succession',
  ALT_RESPONSE: 'alt_response',
  ALT_PRECEDENCE: 'alt_precedence',
  ALT_SUCCESSION: 'alt_succession',
  CHAIN_RESPONSE: 'chain_response',
  CHAIN_PRECEDENCE: 'chain_precedence',
  CHAIN_SUCCESSION: 'chain_succession',
  RESP_ABSENCE: 'resp_absence',
  NOT_COEXISTENCE: 'not_coexistence',
  NEG_RESPONSE: 'neg_response',
  NEG_PRECEDENCE: 'neg_precedence',
  NEG_SUCCESSION: 'neg_succession',
  NEG_ALT_RESPONSE: 'neg_alt_response',
  NEG_ALT_PRECEDENCE: 'neg_alt_precedence',
  NEG_ALT_SUCCESSION: 'neg_alt_succession',
  NEG_CHAIN_RESPONSE: 'neg_chain_response',
  NEG_CHAIN_PRECEDENCE: 'neg_chain_precedence',
  NEG_CHAIN_SUCCESSION: 'neg_chain_succession'
};
export function createRelation(sourceId, targetId, relationType, diagram) {
  const sourceNode = diagram.nodes.find(n => n.id === sourceId);
  const targetNode = diagram.nodes.find(n => n.id === targetId);
  if (!sourceNode || !targetNode) {
    return null;
  }
  const waypoints = layoutConnection(sourceNode, targetNode);
  return {
    id: `relation_${Date.now()}`,
    type: relationType || RELATION_TYPES.RESPONSE,
    sourceId: sourceId,
    targetId: targetId,
    waypoints: waypoints,
    labelOffset: { x: 0, y: -10 }
  };
}
export function updateRelationWaypoints(relation, diagram) {
  const sourceNode = diagram.nodes.find(n => n.id === relation.sourceId);
  const targetNode = diagram.nodes.find(n => n.id === relation.targetId);
  if (!sourceNode || !targetNode) {
    return relation;
  }
  const sourceSize = { width: sourceNode.width || sourceNode.size?.width || 100, height: sourceNode.height || sourceNode.size?.height || 50 };
  const targetSize = { width: targetNode.width || targetNode.size?.width || 100, height: targetNode.height || targetNode.size?.height || 50 };
  if (!relation.waypoints || relation.waypoints.length <= 2) {
    const newWaypoints = layoutConnection(sourceNode, targetNode, sourceSize, targetSize);
    return {
      ...relation,
      waypoints: newWaypoints
    };
  }
  const updatedWaypoints = [...relation.waypoints];
  const secondPoint = updatedWaypoints[1];
  updatedWaypoints[0] = getDockingPoint(
    sourceNode,
    secondPoint,
    sourceSize
  );
  const secondLastPoint = updatedWaypoints[updatedWaypoints.length - 2];
  updatedWaypoints[updatedWaypoints.length - 1] = getDockingPoint(
    targetNode,
    secondLastPoint,
    targetSize
  );
  return {
    ...relation,
    waypoints: updatedWaypoints
  };
}
export function updateRelationWithFixedEndpoints(relation, waypoints, diagram) {
  const sourceNode = diagram.nodes.find(n => n.id === relation.sourceId);
  const targetNode = diagram.nodes.find(n => n.id === relation.targetId);
  if (!sourceNode || !targetNode || waypoints.length < 2) {
    return { ...relation, waypoints };
  }
  const updatedWaypoints = [...waypoints];
  const sourceSize = { width: sourceNode.width || sourceNode.size?.width , height: sourceNode.height || sourceNode.size?.height || 50 };
  const targetSize = { width: targetNode.width || targetNode.size?.width , height: targetNode.height || targetNode.size?.height || 50 };
  const secondPoint = updatedWaypoints[1];
  updatedWaypoints[0] = getDockingPoint(
    sourceNode,
    secondPoint,
    sourceSize
  );
  const secondLastPoint = updatedWaypoints[updatedWaypoints.length - 2];
  updatedWaypoints[updatedWaypoints.length - 1] = getDockingPoint(
    targetNode,
    secondLastPoint,
    targetSize
  );
  return {
    ...relation,
    waypoints: updatedWaypoints
  };
}
export function updateRelationsForNode(node, diagram) {
  return diagram.relations.map(relation => {
    if (relation.sourceId === node.id || relation.targetId === node.id) {
      return updateRelationWaypoints(relation, diagram);
    }
    return relation;
  });
}
export function getRelationVisual(relationType, isSelected) {
  let neg = relationType.startsWith('neg_');
  let rest = neg ? relationType.slice(4) : relationType;
  let pathStyle = 'none';
  if (rest.startsWith('alt_')) {
    pathStyle = 'alt';
    rest = rest.slice(4);
  } else if (rest.startsWith('chain_')) {
    pathStyle = 'chain';
    rest = rest.slice(6);
  }
  let baseType = rest;
  const baseStyle = {
    stroke: isSelected ? '#1a73e8' : '#555555',
    strokeWidth: isSelected ? 2 : 1.5,
  };
  const isNegative = neg ||
    relationType === 'not_coexistence' ||
    relationType === 'resp_absence';
  let style = { ...baseStyle };
  let negation = false;
  if (isNegative) {
    negation = true;
  }
  return { 
    style, 
    negation, 
    pathStyle,
    baseType 
  };
}
export function getRelationLabel(relationType) {
  let neg = relationType.startsWith('neg_');
  let rest = neg ? relationType.slice(4) : relationType;
  let prefix = '';
  if (rest.startsWith('alt_')) {
    prefix = 'Alt ';
    rest = rest.slice(4);
  } else if (rest.startsWith('chain_')) {
    prefix = 'Chain ';
    rest = rest.slice(6);
  }
  if (neg) {
    prefix = 'Neg. ' + prefix;
  }
  const baseLabels = {
    resp_existence: 'Resp. Existence',
    coexistence: 'Coexistence',
    response: 'Response',
    precedence: 'Precedence',
    succession: 'Succession',
    resp_absence: 'Resp. Absence',
    not_coexistence: 'Not Coexistence',
  };
  let base = baseLabels[rest] || (rest.charAt(0).toUpperCase() + rest.slice(1).replace(/_/g, ' '));
  return `${prefix}${base}`;
}
export function isRelationAllowed(diagram, sourceId, targetId, relationType = 'response') {
  const sourceNode = diagram.nodes.find(n => n.id === sourceId);
  const targetNode = diagram.nodes.find(n => n.id === targetId);
  
  if (!sourceNode || !targetNode) return false;

  // Check if it's a negative relation type
  const isNegativeRelation = relationType && (
    relationType.includes('neg_') || 
    relationType.includes('resp_absence') || 
    relationType.includes('not_coexistence')
  );

  if (targetNode.constraint === CONSTRAINTS.INIT) {
    if (!isNegativeRelation) return false;
    switch (relationType) {
      case 'resp_absence':
      case 'not_coexistence':
      case 'neg_response':
      case 'neg_succession':
      case 'neg_chain_response':
      case 'neg_chain_succession':
        return true;
      case 'neg_precedence':
      case 'neg_chain_precedence':
      case 'neg_alt_response':
      case 'neg_alt_precedence':
      case 'neg_alt_succession':
        return false;
      default:
        return false;
    }
  }

  if (sourceNode.constraint === CONSTRAINTS.INIT) {
    if (isNegativeRelation) {
      switch (relationType) {
        case 'resp_absence':
        case 'not_coexistence':
        case 'neg_response':
        case 'neg_succession':
        case 'neg_chain_response':
        case 'neg_chain_succession':
          return true;
        case 'neg_precedence':
        case 'neg_chain_precedence': 
        case 'neg_alt_response':
        case 'neg_alt_precedence':
        case 'neg_alt_succession':
          return false;
        default:
          return false;
      }
    } else {
      switch (relationType) {
        case 'resp_existence':
          return false;
        case 'alt_response':
        case 'alt_precedence':
        case 'alt_succession':
          return false;
        case 'precedence':
        case 'response':
        case 'succession':
        case 'coexistence':
        case 'chain_response':
        case 'chain_precedence':
        case 'chain_succession': 
          return true;
        default:
          return true;
      }
    }
  }

  if (sourceNode.constraint && sourceNode.constraint !== CONSTRAINTS.INIT) {
    if (sourceNode.constraint === CONSTRAINTS.ABSENCE && !isNegativeRelation) {
      return false;
    }
        if (sourceNode.constraint === CONSTRAINTS.ABSENCE_N && !isNegativeRelation) {
      const outgoingPositiveRelations = diagram.relations.filter(r => 
        r.sourceId === sourceId && !isNegativeRelationType(r.type)
      );
      const maxAllowed = sourceNode.constraintValue || 0;
      if (outgoingPositiveRelations.length >= maxAllowed) {
        return false;
      }
    }
  }

  if (!isNegativeRelation) {
    const incomingPositiveRelations = diagram.relations.filter(r => 
      r.targetId === targetId && !isNegativeRelationType(r.type)
    );
    const incomingCount = incomingPositiveRelations.length;

    switch (targetNode.constraint) {
      case CONSTRAINTS.ABSENCE:
        return false;
      case CONSTRAINTS.ABSENCE_N:
        const maxAllowed = targetNode.constraintValue || 0;
        return incomingCount < maxAllowed;
      case CONSTRAINTS.EXACTLY_N:
        const exactRequired = targetNode.constraintValue || 0;
        return incomingCount < exactRequired;
      case CONSTRAINTS.EXISTENCE_N:
        return true;
      default:
        return true;
    }
  }

  else {
    switch (targetNode.constraint) {
      case CONSTRAINTS.ABSENCE:
        return true;
      case CONSTRAINTS.ABSENCE_N:
        return true;
      case CONSTRAINTS.EXACTLY_N:
        return true;
      case CONSTRAINTS.EXISTENCE_N:
        return true;
      case CONSTRAINTS.INIT:
        return false;
      default:
        return true;
    }
  }
}
function isNegativeRelationType(relationType) {
  return relationType && (
    relationType.includes('neg_') || 
    relationType.includes('resp_absence') || 
    relationType.includes('not_coexistence')
  );
}
export function reconnectRelation(relation, newSourceId, newTargetId, diagram) {
  const sourceId = newSourceId || relation.sourceId;
  const targetId = newTargetId || relation.targetId;
  const sourceNode = diagram.nodes.find(n => n.id === sourceId);
  const targetNode = diagram.nodes.find(n => n.id === targetId);
  if (!sourceNode || !targetNode) {
    return relation;
  }
  const newWaypoints = layoutConnection(sourceNode, targetNode);
  return {
    ...relation,
    sourceId: sourceId,
    targetId: targetId,
    waypoints: newWaypoints
  };
}
export function updateRelationLabelPosition(relation, labelOffset, diagram) {
  if (!diagram || !relation) return diagram;
  const updatedRelations = diagram.relations.map(r => 
    r.id === relation.id ? { ...r, labelOffset } : r
  );
  return {
    ...diagram,
    relations: updatedRelations
  };
}
export function updateNodeSizeAndRelations(nodeId, newSize, diagram) {
  const updatedNodes = diagram.nodes.map(node =>
    node.id === nodeId ? { ...node, width: newSize.width, height: newSize.height } : node
  );
  const updatedRelations = diagram.relations.map(relation => {
    if (relation.sourceId === nodeId || relation.targetId === nodeId) {
      return updateRelationWaypoints(relation, { ...diagram, nodes: updatedNodes });
    }
    return relation;
  });
  return {
    ...diagram,
    nodes: updatedNodes,
    relations: updatedRelations
  };
}
