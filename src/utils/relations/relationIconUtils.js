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
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#555555" stroke="none" />
      </marker>
      <marker
        id="arrow-start"
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M 10 0 L 0 5 L 10 10 z" fill="#555555" stroke="none" />
      </marker>
      <marker
        id="ball-end"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="5" cy="5" r="5" fill="#555555" stroke="none" />
      </marker>
      <marker
        id="ball-start"
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="5" cy="5" r="5" fill="#555555" stroke="none" />
      </marker>
      <marker
        id="arrow-ball"
        viewBox="0 0 20 10"
        refX="20"
        refY="5"
        markerWidth="12" 
        markerHeight="6"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#555555" stroke="none" />
          <circle cx="15" cy="5" r="5" fill="#555555" stroke="none" />
        </g>
      </marker>
      
      {/* Blue versions for selected relations */}
      <marker
        id="arrow-selected"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a73e8" stroke="none" />
      </marker>
      <marker
        id="arrow-start-selected"
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d="M 10 0 L 0 5 L 10 10 z" fill="#1a73e8" stroke="none" />
      </marker>
      <marker
        id="ball-end-selected"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="5" cy="5" r="5" fill="#1a73e8" stroke="none" />
      </marker>
      <marker
        id="ball-start-selected"
        viewBox="0 0 10 10"
        refX="0"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="5" cy="5" r="5" fill="#1a73e8" stroke="none" />
      </marker>
      <marker
        id="arrow-ball-selected"
        viewBox="0 0 20 10"
        refX="20"
        refY="5"
        markerWidth="12" 
        markerHeight="6"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1a73e8" stroke="none" />
          <circle cx="15" cy="5" r="5" fill="#1a73e8" stroke="none" />
        </g>
      </marker>
      
      {/* Negation marker */}
      <marker
        id="negation-marker"
        viewBox="0 0 24 24"
        refX="12"
        refY="12"
        markerWidth="8"
        markerHeight="8"
        orient="auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          <line x1="6" y1="6" x2="18" y2="18" stroke="#555555" strokeWidth="3" fill="none" />
          <line x1="6" y1="18" x2="18" y2="6" stroke="#555555" strokeWidth="3" fill="none" />
        </g>
      </marker>
    </defs>
  );
}
export function getRelationMarkerIds(relationType, isSelected = false) {
  return {
    startMarkerId: getStartMarker(relationType, isSelected),
    endMarkerId: getEndMarker(relationType, isSelected),
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
function getStartMarker(relationType, isSelected = false) {
  const type = getPositiveRelationType(relationType);
  const suffix = isSelected ? '-selected' : '';
  switch (type) {
    case 'succession':
    case 'alt_succession':
    case 'chain_succession':
    case 'resp_existence':
    case 'coexistence':
    case 'response':
    case 'alt_response':
    case 'chain_response':
      return `url(#ball-start${suffix})`;
    default:
      return null;
  }
}
function getEndMarker(relationType, isSelected = false) {
  const type = getPositiveRelationType(relationType);
  const suffix = isSelected ? '-selected' : '';
  if (type === 'resp_existence') {
    return null;
  }
  if (type === 'coexistence') {
    return `url(#ball-end${suffix})`;
  }
  if (
    type === 'precedence' ||
    type === 'succession' ||
    type === 'alt_precedence' ||
    type === 'alt_succession' ||
    type === 'chain_precedence' ||
    type === 'chain_succession'
  ) {
    return `url(#arrow-ball${suffix})`;
  }
  if (
    type === 'response' ||
    type === 'alt_response' ||
    type === 'chain_response'
  ) {
    return `url(#arrow${suffix})`;
  }
  if (relationType.startsWith('neg_') || relationType === 'resp_absence') {
    return `url(#arrow${suffix})`;
  }
  if (relationType === 'not_coexistence') {
    return `url(#ball-end${suffix})`;
  }
  return null;
}
