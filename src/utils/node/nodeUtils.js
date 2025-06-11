import { CONSTRAINTS } from '../modeler/diagramUtils';
import { UpdateNodeCommand, CreateNodeCommand } from '../commands/DiagramCommands';
export function handleNodeRename(nodeId, newName, getDiagram, setDiagram, commandStack) {
  const diagram = getDiagram();
  if (!newName || !newName.trim() || !diagram) return;
  const node = diagram.nodes.find(n => n.id === nodeId);
  if (!node || node.name === newName.trim()) return;
  const command = new UpdateNodeCommand(nodeId, { name: newName }, getDiagram, setDiagram);
  commandStack.execute(command);
}
export function addNode(e, mode, getDiagram, canvasOffset, zoom, getCommandStack, setDiagram) {
  if (mode !== 'addActivity') return null;

  const svg = document.querySelector('.condec-canvas');
  if (!svg) return null;

  const rect = svg.getBoundingClientRect();
  const canvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
  const canvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;
  const newNode = {
    id: `node_${Date.now()}`,
    name: '',
    x: canvasX,
    y: canvasY,
    type: 'activity',
    editing: true 
  };
  const commandStack = getCommandStack();
  const command = new CreateNodeCommand(newNode, getDiagram, setDiagram);
  commandStack.execute(command);
  return { newNode };
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

  // INIT constraint logic
  if (targetNode.constraint === CONSTRAINTS.INIT) {
    // INIT nodes cannot have any incoming positive relations
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
        case 'precedence':
        case 'response':
        case 'succession':
        case 'coexistence':
        case 'alt_response':
        case 'alt_precedence':
        case 'alt_succession':
          return false;
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
        // Can have at most N positive incoming relations
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
        // Already handled above
        return false;
      default:
        return true;
    }
  }
}

// Helper function to determine if a relation type is negative/restrictive
function isNegativeRelationType(relationType) {
  return relationType && (
    relationType.includes('neg_') || 
    relationType.includes('resp_absence') || 
    relationType.includes('not_coexistence')
  );
}
