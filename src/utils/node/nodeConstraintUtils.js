import { CONSTRAINTS } from '../modeler/diagramUtils';
import { countIncomingRelationsDeclare } from '../relations/incomingRelationUtils';
export function validateNodeConstraint(node, diagram) {
  if (!node || !diagram) return { valid: true };
  const incomingCount = countIncomingRelationsDeclare(node.id, diagram);

  switch (node.constraint) {
    case CONSTRAINTS.ABSENCE:
      return { valid: incomingCount === 0, incomingCount };
    case CONSTRAINTS.ABSENCE_N:
      return { valid: incomingCount <= (node.constraintValue || 0), incomingCount };
    case CONSTRAINTS.EXISTENCE_N:
      return { valid: incomingCount >= (node.constraintValue || 0), incomingCount };
    case CONSTRAINTS.EXACTLY_N:
      return { valid: incomingCount === (node.constraintValue || 0), incomingCount };
    case CONSTRAINTS.INIT:
      return { valid: incomingCount === 0, incomingCount };
    default:
      return { valid: true, incomingCount };
  }
}
