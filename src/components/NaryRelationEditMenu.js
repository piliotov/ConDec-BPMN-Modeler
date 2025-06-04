import React, { useRef, useEffect, useState } from 'react';
import { UpdateRelationCommand, DeleteRelationCommand } from '../utils/commands/DiagramCommands';

export function NaryRelationEditMenu({
  relation,
  nodes,
  diagram,
  setDiagram,
  commandStack,
  setSelectedElement,
  getDiagram
}) {
  const popupRef = useRef(null);
  const [constraintN, setConstraintN] = useState(relation?.n || 1);
  const [selectedNodeIds, setSelectedNodeIds] = useState(relation?.activities || []);
  
  useEffect(() => {
    if (relation) {
      setConstraintN(relation.n || 1);
      setSelectedNodeIds(relation.activities || []);
    }
  }, [relation]);

  const getNodeName = (nodeId) => {
    const node = nodes?.find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  };

  const handleChangeConstraintN = (e) => {
    const newN = parseInt(e.target.value) || 1;
    const maxN = selectedNodeIds.length;
    const clampedN = Math.max(1, Math.min(newN, maxN));
    
    setConstraintN(clampedN);
    
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { n: clampedN }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleAddNode = (nodeId) => {
    if (selectedNodeIds.includes(nodeId)) return;
    
    const newNodeIds = [...selectedNodeIds, nodeId];
    setSelectedNodeIds(newNodeIds);
    
    const newMaxN = newNodeIds.length;
    const newN = Math.min(constraintN, newMaxN);
    setConstraintN(newN);
    
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { 
      activities: newNodeIds,
      n: newN
    }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleRemoveNode = (nodeId) => {
    const newNodeIds = selectedNodeIds.filter(id => id !== nodeId);
    setSelectedNodeIds(newNodeIds);
    
    const newMaxN = newNodeIds.length;
    const newN = Math.min(constraintN, newMaxN);
    setConstraintN(newN);
    
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { 
      activities: newNodeIds,
      n: newN
    }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const handleDeleteRelation = () => {
    if (!commandStack || !diagram) return;
    const command = new DeleteRelationCommand(relation.id, getDiagram, setDiagram);
    commandStack.execute(command);
    setSelectedElement(null);
  };

  const handleCloseMenu = () => {
    setSelectedElement(null);
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    if (!commandStack || !diagram) return;
    const command = new UpdateRelationCommand(relation.id, { type: newType }, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  if (!relation || (relation.type !== 'choice' && relation.type !== 'Ex_choice')) {
    return null;
  }

  const availableNodes = nodes?.filter(node => !selectedNodeIds.includes(node.id)) || [];

  return (
    <div
      className="condec-edit-nary-relation-sidebar"
      ref={popupRef}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '300px',
        background: '#fff',
        borderLeft: '1px solid #1976d2',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '20px',
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
          fontSize: 16,
          color: '#1976d2',
          marginBottom: 16,
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Edit N-ary Constraint
          <select
            value={relation.type}
            onChange={handleTypeChange}
            style={{
              marginLeft: 12,
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #1976d2',
              fontSize: 14,
              color: '#1976d2',
              background: '#f5faff',
              fontWeight: 500
            }}
          >
            <option value="choice">Choice</option>
            <option value="Ex_choice">Ex_choice</option>
          </select>
        </div>
        <button
          onClick={handleCloseMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#666',
            padding: '4px'
          }}
          title="Close"
        >
          ×
        </button>
      </div>
      
      <div className="property-group" style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Choose exactly:
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 16 }}>
          <input
            type="number"
            min="1"
            max={selectedNodeIds.length}
            value={constraintN}
            onChange={handleChangeConstraintN}
            style={{
              width: '60px',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 14
            }}
          />
          <span style={{ fontSize: 14, color: '#666' }}>
            out of {selectedNodeIds.length} activities
          </span>
        </div>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
          Selected Activities:
        </label>
        <div style={{ 
          border: '1px solid #ccc',
          borderRadius: 4,
          padding: '8px',
          marginBottom: 16,
          minHeight: '100px',
          background: '#f9f9f9'
        }}>
          {selectedNodeIds.length === 0 ? (
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              No activities selected
            </div>
          ) : (
            selectedNodeIds.map(nodeId => (
              <div
                key={nodeId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  margin: '2px 0',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 3,
                  fontSize: 14
                }}
              >
                <span>{getNodeName(nodeId)}</span>
                <button
                  onClick={() => handleRemoveNode(nodeId)}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 3,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                  title="Remove from constraint"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {availableNodes.length > 0 && (
          <>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Add Activity:
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddNode(e.target.value);
                  e.target.value = '';
                }
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                marginBottom: 16
              }}
              defaultValue=""
            >
              <option value="">Select activity to add...</option>
              {availableNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name || `Node ${node.id.slice(0, 6)}...`}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <button
          style={{
            width: '100%',
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: '8px'
          }}
          onClick={handleDeleteRelation}
        >
          Delete N-ary Constraint
        </button>
      </div>
    </div>
  );
}

export default NaryRelationEditMenu;
