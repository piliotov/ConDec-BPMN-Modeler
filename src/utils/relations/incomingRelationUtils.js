export function countIncomingRelationsDeclare(nodeId, diagram) {
  if (!diagram || !diagram.relations || !nodeId) return 0;
  return diagram.relations.filter(relation => relation.targetId === nodeId).length;
}
