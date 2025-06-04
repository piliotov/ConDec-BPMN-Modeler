import React, { useRef, useEffect, useState } from 'react';
import { CONSTRAINTS } from './ConDecNode';
import { validateNodeConstraint } from '../utils/node/nodeConstraintUtils';
import { countIncomingRelationsDeclare } from '../utils/relations/incomingRelationUtils';
import { UpdateNodeCommand, DeleteNodeCommand } from '../utils/commands/DiagramCommands';

const CONSTRAINT_CONFIG = {
  [CONSTRAINTS.ABSENCE]: {
    name: "Absence (0)",
    description: a => `Activity ${a} cannot be executed.`
  },
  [CONSTRAINTS.ABSENCE_N]: {
    name: "Absence (0..n)",
    description: (a, n) => `Activity ${a} can be executed at most ${n} times, i.e., the execution trace cannot contain ${n + 1} occurrences of ${a}.`
  },
  [CONSTRAINTS.EXISTENCE_N]: {
    name: "Existence (n..∗)",
    description: (a, n) => `Activity ${a} must be executed at least ${n} times.`
  },
  [CONSTRAINTS.EXACTLY_N]: {
    name: "Exactly (n)",
    description: (a, n) => `Activity ${a} must be executed exactly ${n} times.`
  },
  [CONSTRAINTS.INIT]: {
    name: "Init",
    description: a => `Activity ${a} must be the first executed activity.`
  }
};

export function NodeEditMenu({
  node,
  editNodePopupPos,
  setDragOffset,
  setDraggingEditPopup,
  setEditNodePopup,
  setEditNodePopupPos,
  diagram,
  setDiagram,
  commandStack,
  setSelectedElement,
  getDiagram
}) {
  const popupRef = useRef(null);
  const [formValues, setFormValues] = useState({
    name: node?.name || '',
    constraint: node?.constraint || 'none',
    constraintValue: node?.constraintValue || 1
  });

  useEffect(() => {
    if (node) {
      setFormValues({
        name: node.name || '',
        constraint: node.constraint || 'none',
        constraintValue: node.constraintValue || 1
      });
    }
  }, [node]);

  const stopPropagation = e => {
    e.stopPropagation();
  };

  useEffect(() => {
    const handler = e => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        e.stopPropagation();
        setEditNodePopup(null);
        setEditNodePopupPos({ x: null, y: null });
      }
    };
    
    document.addEventListener('mousedown', handler, true);
    
    return () => {
      document.removeEventListener('mousedown', handler, true);
    };
  }, [setEditNodePopup, setEditNodePopupPos]);

  if (!node) return null;

  const updateNode = (updates) => {
    if (!node?.id || !commandStack || !diagram) return;
    
    const command = new UpdateNodeCommand(node.id, updates, getDiagram, setDiagram);
    commandStack.execute(command);
  };

  const getConstraintStatus = () => {
    if (!node || !node.id || !window?.condecDiagramForValidation) return { valid: true };
    const diagram = window.condecDiagramForValidation;
    return validateNodeConstraint(node, diagram);
  };

  const constraintStatus = getConstraintStatus();

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormValues(prev => ({ ...prev, name }));
    updateNode({ name });
  };

  const handleConstraintChange = (e) => {
    const constraint = e.target.value === 'none' ? null : e.target.value;
    const constraintValue = constraint === CONSTRAINTS.ABSENCE_N || 
                            constraint === CONSTRAINTS.EXISTENCE_N || 
                            constraint === CONSTRAINTS.EXACTLY_N ? 1 : null;
    
    setFormValues(prev => ({ 
      ...prev, 
      constraint: e.target.value,
      constraintValue
    }));
    
    updateNode({ 
      constraint, 
      constraintValue
    });
  };

  const handleConstraintValueChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setFormValues(prev => ({ ...prev, constraintValue: value }));
      updateNode({ constraintValue: value });
    }
  };

  return (
    <div
      className="condec-edit-node-popup"
      ref={popupRef}
      style={{
        position: 'fixed',
        left: editNodePopupPos.x !== null ? editNodePopupPos.x : '50%',
        top: editNodePopupPos.y !== null ? editNodePopupPos.y : '50%',
        transform:
          editNodePopupPos.x === null && editNodePopupPos.y === null
            ? 'translate(-50%, -50%)'
            : undefined,
        zIndex: 3000,
        background: '#fff',
        border: constraintStatus && !constraintStatus.valid ? '2px solid #d32f2f' : '1.5px solid #1976d2',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        minWidth: 320,
        maxWidth: 400,
        padding: 24
      }}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onFocus={stopPropagation}
    >
      <div
        className="condec-edit-node-popup-header"
        style={{
          fontWeight: 600,
          fontSize: 16,
          color: '#1976d2',
          marginBottom: 16,
          cursor: 'move',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
        onMouseDown={e => {
          const rect = e.currentTarget.parentNode.getBoundingClientRect();
          setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          });
          setDraggingEditPopup(true);
        }}
      >
        Edit Activity Node
        {constraintStatus && !constraintStatus.valid && (
          <span title="Constraint violated" style={{ color: '#d32f2f', fontSize: 20, marginLeft: 8 }}>❗</span>
        )}
      </div>
      
      <div className="property-group" style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Name:</label>
        <input
          type="text"
          value={formValues.name}
          onChange={handleNameChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #ccc',
            fontSize: 14,
            background: constraintStatus && !constraintStatus.valid ? '#ffebee' : '#fff'
          }}
        />
      </div>

      <div className="property-group" style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Constraint:</label>
        <select
          value={formValues.constraint || 'none'}
          onChange={handleConstraintChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 4,
            border: '1px solid #ccc',
            fontSize: 14,
            background: constraintStatus && !constraintStatus.valid ? '#ffebee' : '#fff'
          }}
        >
          <option value="none">None</option>
          {Object.entries(CONSTRAINTS).map(([key, value]) => (
            <option key={value} value={value}>
              {CONSTRAINT_CONFIG[value]?.name || value}
            </option>
          ))}
        </select>
      </div>

      {formValues.constraint && ['absence_n', 'existence_n', 'exactly_n'].includes(formValues.constraint) && (
        <div className="property-group" style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Value (n):</label>
          <input
            type="number"
            min="1"
            step="1"
            value={formValues.constraintValue || 1}
            onChange={handleConstraintValueChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 14,
              background: constraintStatus && !constraintStatus.valid ? '#ffebee' : '#fff'
            }}
          />
        </div>
      )}

      {formValues.constraint && formValues.constraint !== 'none' && (
        <div className="constraint-explanation" style={{ 
          marginBottom: 12,
          padding: '8px 10px',
          backgroundColor: '#f8f9fa',
          borderRadius: 4,
          fontSize: 13
        }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 500 }}>Constraint Details:</p>
          <p style={{ margin: 0, color: '#555' }}>
            {(() => {
              const config = CONSTRAINT_CONFIG[formValues.constraint];
              if (!config) return null;
              if (typeof config.description === 'function') {
                if (formValues.constraint === CONSTRAINTS.ABSENCE_N || formValues.constraint === CONSTRAINTS.EXISTENCE_N || formValues.constraint === CONSTRAINTS.EXACTLY_N) {
                  return config.description(formValues.name || 'a', formValues.constraintValue || 1);
                }
                return config.description(formValues.name || 'a');
              }
              return config.description;
            })()}
          </p>
          <div style={{ 
            marginTop: 8,
            padding: '6px 8px',
            backgroundColor: constraintStatus?.valid ? '#e8f5e9' : '#ffebee',
            border: `1px solid ${constraintStatus?.valid ? '#a5d6a7' : '#ef9a9a'}`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            color: constraintStatus?.valid ? '#2e7d32' : '#c62828'
          }}>
            <span style={{ marginRight: 6 }}>
              {constraintStatus?.valid ?
                `✓ Valid (${countIncomingRelationsDeclare(node, window?.condecDiagramForValidation?.relations || [])} incoming)` :
                <span style={{ fontWeight: 'bold' }}>⚠️ Invalid</span>}
            </span>
            {!constraintStatus?.valid && (
              <span>{constraintStatus.message}</span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          style={{
            flex: 1,
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14
          }}
          onClick={() => {
            if (!commandStack || !diagram) return;
            const command = new DeleteNodeCommand(node.id, getDiagram, setDiagram);
            commandStack.execute(command);
            setEditNodePopup(null);
            setEditNodePopupPos({ x: null, y: null });
          }}
        >
          Delete
        </button>
        <button
          style={{
            flex: 1,
            background: '#f5f5f5',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: 4,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14
          }}
          onClick={() => {
            setEditNodePopup(null);
            setEditNodePopupPos({ x: null, y: null });
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}