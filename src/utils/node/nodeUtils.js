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
    type: 'activity'
  };
  const commandStack = getCommandStack();
  const command = new CreateNodeCommand(newNode, getDiagram, setDiagram);
  commandStack.execute(command);
  return { newNode };
}

export function isRelationAllowed(diagram, sourceId, targetId) {
  const targetNode = diagram.nodes.find(n => n.id === targetId);
  if (!targetNode) return false;
  if (targetNode.constraint === CONSTRAINTS.INIT) {
    return false;
  }
  const incomingRelations = diagram.relations.filter(r => r.targetId === targetId);
  const incomingCount = incomingRelations.length;
  switch (targetNode.constraint) {
    case CONSTRAINTS.ABSENCE:
      return false;
    case CONSTRAINTS.ABSENCE_N:
      return incomingCount < (targetNode.constraintValue || 0);
    case CONSTRAINTS.EXACTLY_N:
      return incomingCount < (targetNode.constraintValue || 0);
    default:
      return true;
  }
}
