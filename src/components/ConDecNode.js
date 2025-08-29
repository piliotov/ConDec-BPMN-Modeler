import React, { useState, useRef, useEffect } from 'react';
import { validateNodeConstraint } from '../utils/node/nodeConstraintUtils';
export const NODE_TYPES = {
  ACTIVITY: 'activity'
};
export const CONSTRAINTS = {
  ABSENCE: 'absence',
  ABSENCE_N: 'absence_n',
  EXISTENCE_N: 'existence_n',
  EXACTLY_N: 'exactly_n',
  INIT: 'init'
};
export function ConDecNode({
  node,
  isSelected,
  isMultiSelected,
  isNarySelected,
  mode,
  onSelect,
  onDoubleClick,
  onDragStart,
  onRename,
  onRenameBlur,
  onSize,
  zoom = 1, // Add zoom prop
}) {
  const [editing, setEditing] = useState(!!node.editing);
  const [editValue, setEditValue] = useState(node.name);
  const inputRef = useRef();
  const isConstraintViolated = () => {
    if (!node.constraint) return false;
    if (window?.condecDiagramForValidation) {
      const result = validateNodeConstraint(node, window.condecDiagramForValidation);
      return !result.valid;
    }
    const incomingCount = node.incomingRelationsCount || 0;
    switch(node.constraint) {
      case CONSTRAINTS.ABSENCE:
        return incomingCount > 0;
      case CONSTRAINTS.ABSENCE_N:
        return incomingCount > (node.constraintValue || 0);
      case CONSTRAINTS.EXISTENCE_N:
        return incomingCount < (node.constraintValue || 0);
      case CONSTRAINTS.EXACTLY_N:
        return incomingCount !== (node.constraintValue || 0);
      case CONSTRAINTS.INIT:
        return incomingCount > 0;
      default:
        return false;
    }
  };

  const constraintViolated = isConstraintViolated();
  useEffect(() => {
    setEditValue(node.name);
    if (node.editing) setEditing(true);
  }, [node.name, node.editing]);

  // --- Prevent node deletion with Backspace when editing name ---
  useEffect(() => {
    if (!editing) return;
    const handleKeyDown = (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && inputRef.current && document.activeElement === inputRef.current) {
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [editing]);

  const finishEditing = () => {
    setEditing(false);
    if (editValue.trim() && editValue !== node.name) {
      onRename(editValue.trim(), true);
    } else if (node.editing) {
      onRename(node.name, true);
    }
    if (onRenameBlur) onRenameBlur();
  };

  const wrapText = (text, maxWidth, fontSize = 12) => {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          if (word.length > maxCharsPerLine) {
            const chunks = word.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [word];
            lines.push(...chunks.slice(0, -1));
            currentLine = chunks[chunks.length - 1];
          } else {
            currentLine = word;
          }
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [''];
  };
  const nodeWidth = 100;
  const nodeHeight = 50;
  const padding = 8;
  const textMaxWidth = nodeWidth - (padding * 2);
  const wrappedLines = wrapText(node.name || '', textMaxWidth, 12);
  const lineHeight = 14;
  const totalTextHeight = wrappedLines.length * lineHeight;
  const textStartY = -(totalTextHeight / 2) + (lineHeight / 2);
  let constraintNotation = null;
  if (node.constraint) {
    switch(node.constraint) {
      case CONSTRAINTS.ABSENCE:
        constraintNotation = (
          <text x={0} y={-nodeHeight/2-10} textAnchor="middle" fontSize="10px">0</text>
        );
        break;
      case CONSTRAINTS.ABSENCE_N:
        constraintNotation = (
          <text x={0} y={-nodeHeight/2-10} textAnchor="middle" fontSize="10px">
            0..{node.constraintValue || "n"}
          </text>
        );
        break;
      case CONSTRAINTS.EXISTENCE_N:
        constraintNotation = (
          <text x={0} y={-nodeHeight/2-10} textAnchor="middle" fontSize="10px">
            {node.constraintValue || "n"}..∗
          </text>
        );
        break;
      case CONSTRAINTS.EXACTLY_N:
        constraintNotation = (
          <text x={0} y={-nodeHeight/2-10} textAnchor="middle" fontSize="10px">
            {node.constraintValue || "n"}
          </text>
        );
        break;
      case CONSTRAINTS.INIT:
        constraintNotation = (
          <text x={0} y={-nodeHeight/2-10} textAnchor="middle" fontSize="10px">
            init
          </text>
        );
        break;
      default:
        break;
    }
  }

  return (
    <g
      className="condec-node"
      data-node-id={node.id}
      transform={`translate(${node.x}, ${node.y})`}
      onClick={(e) => { 
        e.stopPropagation();
        onSelect(e); 
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
        if (onDoubleClick) onDoubleClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(e);
      }}
      style={{ pointerEvents: 'all' }}
    >
      <rect
        x={-nodeWidth/2}
        y={-nodeHeight/2}
        width={nodeWidth}
        height={nodeHeight}
        rx="5"
        ry="5"
        fill={constraintViolated ? "#ffebee" : (isNarySelected ? "#e3f2fd" : "#ffffff")}
        stroke={constraintViolated ? '#d32f2f' : (isSelected ? '#1a73e8' : (isNarySelected ? '#1976d2' : '#000'))}
        strokeWidth={constraintViolated ? 2.5 : (isSelected ? 2.5 : (isNarySelected ? 2.5 : 1.5))}
        fillOpacity={0.95}
        style={{ cursor: mode === 'addRelation' ? 'crosshair' : 'pointer' }}
      />

      {/* Constraint violation indicator */}
      {constraintViolated && (
        <g>
          <circle
            cx={nodeWidth/2 - 10}
            cy={-nodeHeight/2 + 10}
            r={8}
            fill="#d32f2f"
            stroke="#fff"
            strokeWidth="1"
          />
          <text
            x={nodeWidth/2 - 10}
            y={-nodeHeight/2 + 10}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10px"
            fill="#fff"
            style={{ userSelect: 'none' }}
          >
            !
          </text>
        </g>
      )}
      
      {constraintNotation}
      {editing ? (
        <foreignObject
          x={-nodeWidth/2}
          y={-nodeHeight/2 + 12}
          width={nodeWidth}
          height={30}
          style={{ 
            overflow: 'visible',
            pointerEvents: 'auto'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${12/zoom}px`,
              fontWeight: 'normal',
              padding: `${4/zoom}px`,
              border: 'none',
              borderRadius: `${4/zoom}px`,
              textAlign: 'center',
              backgroundColor: '#fff',
              boxShadow: `0 ${2/zoom}px ${4/zoom}px rgba(0,0,0,0.2)`,
              outline: 'none',
              boxSizing: 'border-box',
              margin: 0,
            }}
            onChange={e => setEditValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={e => {
              e.stopPropagation(); // Prevent event bubbling
              if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
                setEditValue(node.name);
                if (onRenameBlur) onRenameBlur();
                if (node.editing) {
                  onRename(node.name, true);
                }
              }
            }}
          />
        </foreignObject>
      ) : (
        <>
          {wrappedLines.map((line, index) => (
            <text
              key={index}
              x={0}
              y={textStartY + (index * lineHeight)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill={isSelected ? "#1976d2" : (isNarySelected ? "#1976d2" : "#333")}
              fontWeight={isSelected ? "600" : (isNarySelected ? "600" : "normal")}
              pointerEvents="none"
              style={{
                userSelect: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {line}
            </text>
          ))}
        </>
      )}
    </g>
  );
}
