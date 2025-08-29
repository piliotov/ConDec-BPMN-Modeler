import { CONSTRAINTS } from '../modeler/diagramUtils';

function isNegativeRelationType(relationType) {
  return relationType && (relationType.includes('neg_') || relationType.includes('resp_absence') || relationType.includes('not_coexistence'));
}

export function validateNodeConstraint(node, diagram) {
  if (!node || !diagram) return { valid: true };
  
  const allIncomingRelations = diagram.relations.filter(r => r.targetId === node.id);
  const positiveIncomingRelations = allIncomingRelations.filter(r => !isNegativeRelationType(r.type));
  const negativeIncomingRelations = allIncomingRelations.filter(r => isNegativeRelationType(r.type));
  const incomingCount = positiveIncomingRelations.length;

  switch (node.constraint) {
    case CONSTRAINTS.ABSENCE:
      const absenceValid = incomingCount === 0;
      return { 
        valid: absenceValid, 
        incomingCount,
        negativeCount: negativeIncomingRelations.length,
        message: !absenceValid ? 'Absence constraint violated: activity has positive incoming relations that would trigger execution' : null
      };
      
    case CONSTRAINTS.ABSENCE_N:
      const maxAllowed = node.constraintValue || 0;
      const absenceNValid = incomingCount <= maxAllowed;
      return { 
        valid: absenceNValid, 
        incomingCount,
        negativeCount: negativeIncomingRelations.length,
        maxAllowed,
        message: !absenceNValid ? `Absence(${maxAllowed}) constraint violated: has ${incomingCount} positive incoming relations, maximum allowed is ${maxAllowed}` : null
      };
      
    case CONSTRAINTS.EXISTENCE_N:
      const minRequired = node.constraintValue || 0;
      const existenceValid = incomingCount >= minRequired;
      return { 
        valid: existenceValid, 
        incomingCount,
        negativeCount: negativeIncomingRelations.length,
        minRequired,
        message: !existenceValid ? `Existence(${minRequired}) constraint violated: has only ${incomingCount} positive incoming relations, needs at least ${minRequired}` : null
      };
      
    case CONSTRAINTS.EXACTLY_N:
      const exactRequired = node.constraintValue || 0;
      const exactlyValid = incomingCount === exactRequired;
      return { 
        valid: exactlyValid, 
        incomingCount,
        negativeCount: negativeIncomingRelations.length,
        exactRequired,
        message: !exactlyValid ? `Exactly(${exactRequired}) constraint violated: has ${incomingCount} positive incoming relations instead of exactly ${exactRequired}` : null
      };
      
    case CONSTRAINTS.INIT:
      const initValid = incomingCount === 0;
      const invalidNegativeRelations = negativeIncomingRelations.filter(r => {
        return !['resp_absence', 'not_coexistence', 'neg_response', 'neg_succession', 'neg_chain_response', 'neg_chain_succession'].includes(r.type);
      });
      const hasInvalidNegative = invalidNegativeRelations.length > 0;
      
      return { 
        valid: initValid && !hasInvalidNegative, 
        incomingCount,
        negativeCount: negativeIncomingRelations.length,
        message: !initValid ? 'Init constraint violated: activity must be first (no positive incoming relations)' : 
                 hasInvalidNegative ? `Init constraint violated: invalid negative relations (${invalidNegativeRelations.map(r => r.type).join(', ')})` : null
      };
      
    default:
      return { 
        valid: true, 
        incomingCount,
        negativeCount: negativeIncomingRelations.length 
      };
  }
}
