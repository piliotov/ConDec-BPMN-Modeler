export function RelationMarkers() {
  return (
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
      </marker>
      <marker
        id="arrow-start"
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 10 0 L 0 5 L 10 10 z" fill="currentColor" />
      </marker>
      <marker
        id="ball-end"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <circle cx="5" cy="5" r="5" fill="currentColor" />
      </marker>
      <marker
        id="ball-start"
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <circle cx="5" cy="5" r="5" fill="currentColor" />
      </marker>
      <marker
        id="arrow-ball"
        viewBox="0 0 20 10"
        refX="20"
        refY="5"
        markerWidth="12" 
        markerHeight="6"
        orient="auto"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        <circle cx="15" cy="5" r="5" fill="currentColor" />
      </marker>
    </defs>
  );
}
export function getRelationMarkerIds(relationType) {
  return {
    startMarkerId: getStartMarker(relationType),
    endMarkerId: getEndMarker(relationType),
    negationMarkerId: getNegationMarker(relationType)
  };
}
export function shouldShowNegation(relationType) {
  return relationType.startsWith('neg_') || 
         relationType === 'not_coexistence' || 
         relationType === 'resp_absence';
}
function getNegationMarker(relationType) {
  if (shouldShowNegation(relationType)) {
    return 'url(#negation-marker)';
  }
  return null;
}
function getPositiveRelationType(relationType) {
  switch (relationType) {
    case 'neg_response': return 'response';
    case 'neg_precedence': return 'precedence';
    case 'neg_succession': return 'succession';
    case 'neg_alt_response': return 'alt_response';
    case 'neg_alt_precedence': return 'alt_precedence';
    case 'neg_alt_succession': return 'alt_succession';
    case 'neg_chain_response': return 'chain_response';
    case 'neg_chain_precedence': return 'chain_precedence';
    case 'neg_chain_succession': return 'chain_succession';
    case 'resp_absence': return 'resp_existence';
    case 'not_coexistence': return 'coexistence';
    default: return relationType;
  }
}
function getStartMarker(relationType) {
  const type = getPositiveRelationType(relationType);
  switch (type) {
    case 'succession':
    case 'alt_succession':
    case 'chain_succession':
    case 'resp_existence':
    case 'coexistence':
    case 'response':
    case 'alt_response':
    case 'chain_response':
      return 'url(#ball-start)';
    default:
      return null;
  }
}
function getEndMarker(relationType) {
  const type = getPositiveRelationType(relationType);
  if (type === 'resp_existence') {
    return null;
  }
  if (type === 'coexistence') {
    return 'url(#ball-end)';
  }
  if (
    type === 'precedence' ||
    type === 'succession' ||
    type === 'alt_precedence' ||
    type === 'alt_succession' ||
    type === 'chain_precedence' ||
    type === 'chain_succession'
  ) {
    return 'url(#arrow-ball)';
  }
  if (
    type === 'response' ||
    type === 'alt_response' ||
    type === 'chain_response'
  ) {
    return 'url(#arrow)';
  }
  if (relationType.startsWith('neg_') || relationType === 'resp_absence') {
    return 'url(#arrow)';
  }
  if (relationType === 'not_coexistence') {
    return 'url(#ball-end)';
  }
  return null;
}
