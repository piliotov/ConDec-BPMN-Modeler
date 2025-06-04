import React, { useRef, useEffect, useState } from 'react';
import { RELATION_TYPES } from '../utils/relations/relationUtils';
import relationDescriptions from '../utils/relations/relationDescriptions';
import { UpdateRelationCommand, DeleteRelationCommand } from '../utils/commands/DiagramCommands';

const RELATION_GROUPS = {
  BASIC: [
    RELATION_TYPES.RESP_EXISTENCE,
    RELATION_TYPES.COEXISTENCE,
    RELATION_TYPES.RESPONSE,
    RELATION_TYPES.PRECEDENCE,
    RELATION_TYPES.SUCCESSION
  ],
  ALTERNATE: [
    RELATION_TYPES.ALT_RESPONSE,
    RELATION_TYPES.ALT_PRECEDENCE,
    RELATION_TYPES.ALT_SUCCESSION
  ],
  CHAIN: [
    RELATION_TYPES.CHAIN_RESPONSE,
    RELATION_TYPES.CHAIN_PRECEDENCE,
    RELATION_TYPES.CHAIN_SUCCESSION
  ],
  NEGATIVE: [
    RELATION_TYPES.RESP_ABSENCE,
    RELATION_TYPES.NOT_COEXISTENCE,
    RELATION_TYPES.NEG_RESPONSE,
    RELATION_TYPES.NEG_PRECEDENCE,
    RELATION_TYPES.NEG_SUCCESSION
  ],
  NEGATIVE_ALTERNATE: [
    RELATION_TYPES.NEG_ALT_RESPONSE,
    RELATION_TYPES.NEG_ALT_PRECEDENCE,
    RELATION_TYPES.NEG_ALT_SUCCESSION
  ],
  NEGATIVE_CHAIN: [
    RELATION_TYPES.NEG_CHAIN_RESPONSE,
    RELATION_TYPES.NEG_CHAIN_PRECEDENCE,
    RELATION_TYPES.NEG_CHAIN_SUCCESSION
  ]
};

export function RelationEditMenu({
  relation,
  nodes,
  setEditNodePopup,
  setEditNodePopupPos,
  diagram,
  setDiagram,
  commandStack,
  setSelectedElement,
  getDiagram
}) {
  const popupRef = useRef(null);
  const [relationType, setRelationType] = useState(relation?.type || RELATION_TYPES.RESPONSE);
  const [sourceNodeId, setSourceNodeId] = useState(relation?.sourceId || '');
  const [targetNodeId, setTargetNodeId] = useState(relation?.targetId || '');
  const [showLabel, setShowLabel] = useState(
    relation?.showLabel !== false
  );

  useEffect(() => {
    if (relation) {
      setRelationType(relation.type || RELATION_TYPES.RESPONSE);
      setSourceNodeId(relation.sourceId || '');
      setTargetNodeId(relation.targetId || '');
      setShowLabel(relation.showLabel !== false);
    }
  }, [relation]);

  const sourceNode = nodes?.find(node => node.id === sourceNodeId);
  const targetNode = nodes?.find(node => node.id === targetNodeId);

  const handleChangeType = (e) => {
    const newType = e.target.value;
    setRelationType(newType);
    
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { type: newType }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleChangeSource = (e) => {
    const newSourceId = e.target.value;
    setSourceNodeId(newSourceId);
    
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { sourceId: newSourceId }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleChangeTarget = (e) => {
    const newTargetId = e.target.value;
    setTargetNodeId(newTargetId);
    
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { targetId: newTargetId }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleReverseRelation = () => {
    setSourceNodeId(targetNodeId);
    setTargetNodeId(sourceNodeId);

    if (!commandStack) return;
    const updates = {
      sourceId: targetNodeId,
      targetId: sourceNodeId,
      waypoints: relation.waypoints ? [...relation.waypoints].reverse() : undefined
    };
    const command = new UpdateRelationCommand(relation.id, updates, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleToggleShowLabel = () => {
    const checked = !showLabel;
    setShowLabel(checked);
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(
      relation.id,
      { showLabel: checked },
      getDiagram,
      setDiagram
    );
    commandStack.execute(command);
  };

  const handleDeleteRelation = () => {
    if (!commandStack || !diagram) return;
    const command = new DeleteRelationCommand(relation.id, getDiagram, setDiagram);
    commandStack.execute(command);
    setEditNodePopup(null);
    setEditNodePopupPos({ x: null, y: null });
    setSelectedElement(null);
  };

  const handleCloseMenu = () => {
    setEditNodePopup(null);
    setEditNodePopupPos({ x: null, y: null });
    setSelectedElement(null);
  };

  if (!relation) {
    return null;
  }

  const renderRelationOptions = () => {
    return Object.entries(RELATION_GROUPS).map(([groupKey, relationTypes]) => (
      <optgroup key={groupKey} label={groupKey.replace(/_/g, ' ')}>
        {relationTypes.map(type => (
          <option
            key={type}
            value={type}
            title={relationDescriptions[type] || type}
          >
            {getRelationNameWithSymbols(type)}
          </option>
        ))}
      </optgroup>
    ));
  };

  const getRelationNameWithSymbols = (relationType) => {
    switch (relationType) {
      case RELATION_TYPES.RESP_ABSENCE:
        return `Resp. Existence ●—//—`;
      case RELATION_TYPES.RESP_EXISTENCE:
        return `Resp. Existence ●——`;
      case RELATION_TYPES.COEXISTENCE:
        return `Coexistence ●——●`;
      case RELATION_TYPES.NOT_COEXISTENCE:
        return `Not Coexistence ●—//—●`;
      case RELATION_TYPES.RESPONSE:
        return `Response ●——▶`;
      case RELATION_TYPES.NEG_RESPONSE:
        return `Neg. Response ●—//—▶`;
      case RELATION_TYPES.PRECEDENCE:
        return `Precedence ——▶●`;
      case RELATION_TYPES.NEG_PRECEDENCE:
        return `Neg. Precedence ——//—▶●`;
      case RELATION_TYPES.SUCCESSION:
        return `Succession ●—▶●`;
      case RELATION_TYPES.NEG_SUCCESSION:
        return `Neg. Succession ●—//—▶●`;
      case RELATION_TYPES.ALT_RESPONSE:
        return `Alt. Response ●==▶`;
      case RELATION_TYPES.NEG_ALT_RESPONSE:
        return `Neg. Alt. Response ●=//=▶`;
      case RELATION_TYPES.ALT_PRECEDENCE:
        return `Alt. Precedence  ==▶●`;
      case RELATION_TYPES.NEG_ALT_PRECEDENCE:
        return `Neg. Alt. Precedence ●=//=▶●`;
      case RELATION_TYPES.ALT_SUCCESSION:
        return `Alt. Succession ●==▶●`;
      case RELATION_TYPES.NEG_ALT_SUCCESSION:
        return `Neg. Alt. Succession ●=//=▶●`;
      case RELATION_TYPES.CHAIN_RESPONSE:
        return `Chain Response ●≡≡▶●`;
      case RELATION_TYPES.NEG_CHAIN_RESPONSE:
        return `Neg. Chain Response ●≡//≡▶●`;
      case RELATION_TYPES.CHAIN_PRECEDENCE:
        return `Chain Precedence ≡≡▶●`;
      case RELATION_TYPES.NEG_CHAIN_PRECEDENCE:
        return `Neg. Chain Precedence ●≡//≡▶●`;
      case RELATION_TYPES.CHAIN_SUCCESSION:
        return `Chain Succession ●≡≡▶●`;
      case RELATION_TYPES.NEG_CHAIN_SUCCESSION:
        return `Neg. Chain Succession ●≡//≡▶●`;
      default:
        return relationType;
    }
  };

  return (
    <div
      className="condec-edit-relation-sidebar"
      ref={popupRef}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 'min(240px, 25vw)',
        minWidth: '200px',
        background: '#fff',
        borderLeft: '1px solidrgb(255, 255, 255)',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '12px',
        overflowY: 'auto',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        className="condec-sidebar-header"
        style={{
          fontWeight: 600,
          fontSize: 'clamp(13px, 2vw, 15px)',
          color: '#1976d2',
          marginBottom: 10,
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          Edit Relation
        </div>
        <button
          onClick={handleCloseMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#666',
            padding: '2px'
          }}
          title="Close"
        >
          ×
        </button>
      </div>
      
      <div className="property-group" style={{ marginBottom: 10 }}>
        {/* Source-Target Direction Control */}
        <div className="relation-direction-control" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          margin: '0 0 10px 0',
          padding: '6px',
          background: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: 'clamp(10px, 1.2vw, 12px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sourceNode?.name || 'Source'}
          </div>
          {/* Single arrow button for direction */}
          <button 
            onClick={handleReverseRelation}
            style={{
              background: '#e3f2fd',
              border: '1px solid #1976d2',
              borderRadius: '50%',
              width: 'clamp(24px, 3vw, 28px)',
              height: 'clamp(24px, 3vw, 28px)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              minWidth: '24px',
              flexShrink: 0
            }}
            title="Reverse relation direction"
          >
            {/* Single arrow icon*/}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <div style={{ flex: 1, fontWeight: 'bold', fontSize: 'clamp(10px, 1.2vw, 12px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {targetNode?.name || 'Target'}
          </div>
        </div>
        
        {/* Source Node Selection */}
        <label style={{ display: 'block', marginBottom: 3, fontWeight: 500, fontSize: 'clamp(11px, 1.4vw, 13px)' }}>Source:</label>
        <select
          value={sourceNodeId}
          onChange={handleChangeSource}
          style={{
            width: '100%',
            padding: '4px',
            borderRadius: 3,
            border: '1px solid #ccc',
            fontSize: 'clamp(11px, 1.2vw, 12px)',
            marginBottom: 8
          }}
        >
          {nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.name || `Node ${node.id.slice(0, 6)}...`}
            </option>
          ))}
        </select>
        
        {/* Target Node Selection */}
        <label style={{ display: 'block', marginBottom: 3, fontWeight: 500, fontSize: 'clamp(11px, 1.4vw, 13px)' }}>Target:</label>
        <select
          value={targetNodeId}
          onChange={handleChangeTarget}
          style={{
            width: '100%',
            padding: '4px',
            borderRadius: 3,
            border: '1px solid #ccc',
            fontSize: 'clamp(11px, 1.2vw, 12px)',
            marginBottom: 8
          }}
        >
          {nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.name || `Node ${node.id.slice(0, 6)}...`}
            </option>
          ))}
        </select>
        
        {/* Relation Type Selection */}
        <label style={{ display: 'block', marginBottom: 3, fontWeight: 500, fontSize: 'clamp(11px, 1.4vw, 13px)' }}>Type:</label>
        <select
          value={relationType}
          onChange={handleChangeType}
          style={{
            width: '100%',
            padding: '4px',
            borderRadius: 3,
            border: '1px solid #ccc',
            fontSize: 'clamp(11px, 1.2vw, 12px)',
            marginBottom: 4
          }}
        >
          {renderRelationOptions()}
        </select>
        
        {/* Relation Description */}
        <div style={{
          padding: '4px',
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: 3,
          fontSize: 'clamp(10px, 1.1vw, 11px)',
          color: '#495057',
          lineHeight: '1.2',
          fontStyle: 'italic',
          maxHeight: '60px',
          overflowY: 'auto'
        }}>
          {relationDescriptions[relationType]}
        </div>
      </div>
      {/* Show/Hide Label Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0 10px 0', gap: 10 }}>
          <span style={{ fontWeight: 500, fontSize: 'clamp(11px, 1.2vw, 12px)' }}>
            Show Label
          </span>
          <button
            type="button"
            aria-pressed={showLabel}
            onClick={handleToggleShowLabel}
            style={{
              width: 38,
              height: 22,
              border: 'none',
              borderRadius: 12,
              background: showLabel ? '#1976d2' : '#ccc',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              padding: 0
            }}
            title={showLabel ? "Hide label" : "Show label"}
          >
            <span
              style={{
                display: 'block',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                position: 'absolute',
                left: showLabel ? 18 : 2,
                top: 2,
                transition: 'left 0.2s'
              }}
            />
          </button>
        </div>
    

      <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
        <button
          style={{
            width: '100%',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 3,
            padding: '10px 15px',
            cursor: 'pointer',
            fontSize: 'clamp(11px, 1.2vw, 12px)',
            marginBottom: '8px'
          }}
          onClick={handleDeleteRelation}
        >
          Delete Relation
        </button>
      </div>
    </div>
  );
}

export default RelationEditMenu;
