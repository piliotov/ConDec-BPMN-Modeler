import { Command } from './CommandStack.js';
export class CreateNodeCommand extends Command {
  constructor(node, getDiagram, setDiagram) {
    super(`Create node: ${node.name || 'Unnamed'}`);
    this.node = { ...node };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      nodes: [...currentDiagram.nodes, this.node]
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      nodes: currentDiagram.nodes.filter(n => n.id !== this.node.id)
    };
    this.setDiagram(updatedDiagram);
  }
}
export class DeleteNodeCommand extends Command {
  constructor(nodeId, getDiagram, setDiagram) {
    super(`Delete node: ${nodeId}`);
    this.nodeId = nodeId;
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    const diagram = getDiagram();
    this.deletedNode = diagram.nodes.find(n => n.id === nodeId);
    this.deletedRelations = diagram.relations.filter(
      r => r.sourceId === nodeId || r.targetId === nodeId
    );
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.filter(n => n.id !== this.nodeId);
    const updatedRelations = currentDiagram.relations.filter(
      r => r.sourceId !== this.nodeId && r.targetId !== this.nodeId
    );
    const updatedDiagram = {
      ...currentDiagram,
      nodes: updatedNodes,
      relations: updatedRelations
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      nodes: [...currentDiagram.nodes, this.deletedNode],
      relations: [...currentDiagram.relations, ...this.deletedRelations]
    };
    this.setDiagram(updatedDiagram);
  }
}
export class UpdateNodeCommand extends Command {
  constructor(nodeId, updates, getDiagram, setDiagram, description = null) {
    super(description || `Update node: ${nodeId}`);
    this.nodeId = nodeId;
    this.updates = { ...updates };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    const diagram = getDiagram();
    const node = diagram.nodes.find(n => n.id === nodeId);
    this.oldValues = {};
    Object.keys(updates).forEach(key => {
      this.oldValues[key] = node[key];
    });
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.map(n =>
      n.id === this.nodeId ? { ...n, ...this.updates } : n
    );
    const updatedDiagram = {
      ...currentDiagram,
      nodes: updatedNodes
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.map(n =>
      n.id === this.nodeId ? { ...n, ...this.oldValues } : n
    );
    const updatedDiagram = {
      ...currentDiagram,
      nodes: updatedNodes
    };
    this.setDiagram(updatedDiagram);
  }
}
export class MoveNodeCommand extends Command {
  constructor(nodeId, newPosition, getDiagram, setDiagram, originalPosition = null) {
    super(`Move node: ${nodeId}`);
    this.nodeId = nodeId;
    this.newPosition = { ...newPosition };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    if (originalPosition) {
      this.originalPosition = { ...originalPosition };
    } else {
      const diagram = getDiagram();
      const node = diagram.nodes.find(n => n.id === nodeId);
      this.originalPosition = { x: node.x, y: node.y };
    }
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.map(n =>
      n.id === this.nodeId ? { ...n, x: this.newPosition.x, y: this.newPosition.y } : n
    );
    
    // Update relations when node is moved
    const { updateRelationsForNode } = require('../relations/relationUtils');
    const movedNode = updatedNodes.find(n => n.id === this.nodeId);
    const tempDiagram = { nodes: updatedNodes, relations: currentDiagram.relations };
    const updatedRelations = updateRelationsForNode(movedNode, tempDiagram);
    
    this.setDiagram({
      ...currentDiagram,
      nodes: updatedNodes,
      relations: updatedRelations
    });
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.map(n =>
      n.id === this.nodeId ? { ...n, x: this.originalPosition.x, y: this.originalPosition.y } : n
    );
    
    // Update relations when node is moved back to original position
    const { updateRelationsForNode } = require('../relations/relationUtils');
    const movedNode = updatedNodes.find(n => n.id === this.nodeId);
    const tempDiagram = { nodes: updatedNodes, relations: currentDiagram.relations };
    const updatedRelations = updateRelationsForNode(movedNode, tempDiagram);
    
    this.setDiagram({
      ...currentDiagram,
      nodes: updatedNodes,
      relations: updatedRelations
    });
  }
}
export class MoveMultipleNodesCommand extends Command {
  constructor(nodeUpdates, getDiagram, setDiagram) {
    super(`Move ${nodeUpdates.length} nodes`);
    this.nodeUpdates = [...nodeUpdates];
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    const diagram = getDiagram();
    this.originalPositions = {};
    nodeUpdates.forEach(update => {
      const node = diagram.nodes.find(n => n.id === update.id);
      if (node) {
        this.originalPositions[update.id] = { x: node.x, y: node.y };
      }
    });
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.map(node => {
      const update = this.nodeUpdates.find(u => u.id === node.id);
      return update ? { ...node, x: update.x, y: update.y } : node;
    });
    
    // Update relations when nodes are moved
    const { updateRelationsForNode } = require('../relations/relationUtils');
    let updatedRelations = currentDiagram.relations;
    
    // Update relations for each moved node
    this.nodeUpdates.forEach(update => {
      const movedNode = updatedNodes.find(n => n.id === update.id);
      if (movedNode) {
        const tempDiagram = { nodes: updatedNodes, relations: updatedRelations };
        updatedRelations = updateRelationsForNode(movedNode, tempDiagram);
      }
    });
    
    this.setDiagram({
      ...currentDiagram,
      nodes: updatedNodes,
      relations: updatedRelations
    });
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.map(node => {
      const originalPos = this.originalPositions[node.id];
      return originalPos ? { ...node, x: originalPos.x, y: originalPos.y } : node;
    });
    
    // Update relations when nodes are moved back to original positions
    const { updateRelationsForNode } = require('../relations/relationUtils');
    let updatedRelations = currentDiagram.relations;
    
    // Update relations for each node that was moved back
    Object.keys(this.originalPositions).forEach(nodeId => {
      const movedNode = updatedNodes.find(n => n.id === nodeId);
      if (movedNode) {
        const tempDiagram = { nodes: updatedNodes, relations: updatedRelations };
        updatedRelations = updateRelationsForNode(movedNode, tempDiagram);
      }
    });
    
    this.setDiagram({
      ...currentDiagram,
      nodes: updatedNodes,
      relations: updatedRelations
    });
  }
}
export class CreateRelationCommand extends Command {
  constructor(relation, getDiagram, setDiagram) {
    super(`Create relation: ${relation.type}`);
    this.relation = { ...relation };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: [...currentDiagram.relations, this.relation]
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: currentDiagram.relations.filter(r => r.id !== this.relation.id)
    };
    this.setDiagram(updatedDiagram);
  }
}
export class DeleteRelationCommand extends Command {
  constructor(relationId, getDiagram, setDiagram) {
    super(`Delete relation: ${relationId}`);
    this.relationId = relationId;
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    this.deletedRelation = null;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    this.deletedRelation = currentDiagram.relations.find(r => r.id === this.relationId);
    const updatedDiagram = {
      ...currentDiagram,
      relations: currentDiagram.relations.filter(r => r.id !== this.relationId)
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    if (!this.deletedRelation) return;
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: [...currentDiagram.relations, this.deletedRelation]
    };
    this.setDiagram(updatedDiagram);
  }
}
export class UpdateRelationCommand extends Command {
  constructor(relationId, updates, getDiagram, setDiagram) {
    super(`Update relation: ${relationId}`);
    this.relationId = relationId;
    this.updates = { ...updates };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    this.previousState = null;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const relation = currentDiagram.relations.find(r => r.id === this.relationId);
    if (!relation) return;
    this.previousState = { ...relation };
    const updatedRelation = { ...relation, ...this.updates };
    const updatedDiagram = {
      ...currentDiagram,
      relations: currentDiagram.relations.map(r => 
        r.id === this.relationId ? updatedRelation : r
      )
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    if (!this.previousState) return;
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: currentDiagram.relations.map(r => 
        r.id === this.relationId ? this.previousState : r
      )
    };
    this.setDiagram(updatedDiagram);
  }
}
export class AppendActivityCommand extends Command {
  constructor(sourceNode, newNode, newRelation, getDiagram, setDiagram) {
    super(`Append activity: ${newNode.name}`);
    this.sourceNode = { ...sourceNode };
    this.newNode = { ...newNode };
    this.newRelation = { ...newRelation };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      nodes: [...currentDiagram.nodes, this.newNode],
      relations: [...currentDiagram.relations, this.newRelation]
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      nodes: currentDiagram.nodes.filter(n => n.id !== this.newNode.id),
      relations: currentDiagram.relations.filter(r => r.id !== this.newRelation.id)
    };
    this.setDiagram(updatedDiagram);
  }
}
export class CreateNaryRelationCommand extends Command {
  constructor(relation, getDiagram, setDiagram) {
    super(`Create n-ary relation: ${relation.type}`);
    this.relation = { ...relation };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: [...currentDiagram.relations, this.relation]
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: currentDiagram.relations.filter(r => r.id !== this.relation.id)
    };
    this.setDiagram(updatedDiagram);
  }
}
export class CreateNaryFromBinaryCommand extends Command {
  constructor(originalRelation, newNaryRelation, getDiagram, setDiagram) {
    super(`Convert to n-ary relation: ${newNaryRelation.type}`);
    this.originalRelation = { ...originalRelation };
    this.newNaryRelation = { ...newNaryRelation };
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: [
        ...currentDiagram.relations.filter(r => r.id !== this.originalRelation.id),
        this.newNaryRelation
      ]
    };
    this.setDiagram(updatedDiagram);
  }
  undo() {
    const currentDiagram = this.getDiagram();
    const updatedDiagram = {
      ...currentDiagram,
      relations: [
        ...currentDiagram.relations.filter(r => r.id !== this.newNaryRelation.id),
        this.originalRelation
      ]
    };
    this.setDiagram(updatedDiagram);
  }
}
export class ImportDiagramCommand extends Command {
  constructor(newDiagram, getDiagram, setDiagram) {
    super('Import diagram');
    this.newDiagram = JSON.parse(JSON.stringify(newDiagram));
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    this.oldDiagram = null;
  }
  execute() {
    if (!this.oldDiagram) {
      this.oldDiagram = JSON.parse(JSON.stringify(this.getDiagram()));
    }
    this.setDiagram(this.newDiagram);
  }
  undo() {
    if (this.oldDiagram) {
      this.setDiagram(this.oldDiagram);
    }
  }
}
export class CompositeCommand extends Command {
  constructor(commands, description = 'Multiple operations') {
    super(description);
    this.commands = [...commands];
  }
  execute() {
    this.commands.forEach(command => command.execute());
  }
  undo() {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
export class DeleteMultipleNodesCommand extends Command {
  constructor(nodeIds, getDiagram, setDiagram) {
    super(`Delete ${nodeIds.length} nodes`);
    this.nodeIds = [...nodeIds];
    this.getDiagram = getDiagram;
    this.setDiagram = setDiagram;
    this.previousDiagram = null;
    const diagram = getDiagram();
    this.deletedNodes = [];
    this.deletedRelations = [];
    nodeIds.forEach(nodeId => {
      const node = diagram.nodes.find(n => n.id === nodeId);
      if (node) {
        this.deletedNodes.push({ ...node });
      }
    });
    this.deletedRelations = diagram.relations.filter(relation =>
      nodeIds.includes(relation.sourceId) || nodeIds.includes(relation.targetId)
    );
  }
  execute() {
    const currentDiagram = this.getDiagram();
    const updatedNodes = currentDiagram.nodes.filter(node => 
      !this.nodeIds.includes(node.id)
    );
    const updatedRelations = currentDiagram.relations.filter(relation =>
      !this.nodeIds.includes(relation.sourceId) && 
      !this.nodeIds.includes(relation.targetId)
    );
    
    // Store a complete snapshot for proper undo
    this.previousDiagram = JSON.parse(JSON.stringify(currentDiagram));
    
    this.setDiagram({
      ...currentDiagram,
      nodes: updatedNodes,
      relations: updatedRelations
    });
  }
  undo() {
    // Restore complete previous state for better consistency
    if (this.previousDiagram) {
      this.setDiagram(this.previousDiagram);
    } else {
      // Fallback to original method
      const currentDiagram = this.getDiagram();
      this.setDiagram({
        ...currentDiagram,
        nodes: [...currentDiagram.nodes, ...this.deletedNodes],
        relations: [...currentDiagram.relations, ...this.deletedRelations]
      });
    }
  }
}
