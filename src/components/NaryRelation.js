import React, { useState, useEffect } from 'react';

export function NaryMenu({ relation, x, y, zoom, canvasOffset, onSave, onCancel }) {
  const [n, setN] = useState(relation.n || 1);
  const [type, setType] = useState(relation.type || 'choice');

  useEffect(() => {
    setType(relation.type || 'choice');
    setN(relation.n || 1);
  }, [relation.type, relation.n]);

  const handleSave = () => {
    const updatedRelation = {
      ...relation,
      n: parseInt(n),
      type
    };
    onSave(updatedRelation);
  };

  const screenX = x * zoom + canvasOffset.x;
  const screenY = y * zoom + canvasOffset.y;

  return (
    <div
      style={{
        position: 'absolute',
        left: screenX + 20,
        top: screenY - 50,
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '200px'
      }}
    >
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>N-ary Constraint</h4>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Type:
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: '100%', padding: '4px', fontWeight: 'bold', color: '#1976d2' }}
        >
          <option value="choice">Choice</option>
          <option value="Ex_choice">Exclusive Choice</option>
        </select>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Choose {n} out of {relation.activities?.length || 0} activities:
        </label>
        <input
          type="number"
          min="1"
          max={relation.activities?.length || 1}
          value={n}
          onChange={(e) => setN(e.target.value)}
          style={{ width: '60px', padding: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Activities:
        </label>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {relation.activities?.join(', ') || 'None'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #ccc',
            background: '#fff',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #1976d2',
            background: '#1976d2',
            color: '#fff',
            borderRadius: '2px',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function NaryRelation({ relation, allNodes, zoom, canvasOffset, isSelected, onSelect, handleNaryDiamondInteractionStart }) {
  if (!relation.activities || !Array.isArray(relation.activities) || !relation.diamondPos) {
    return null;
  }

  return (
    <g className="nary-relation">
      {relation.activities.map((activityName, index) => {
        const node = allNodes.find(n => n.name === activityName || n.id === activityName);
        if (!node) return null;
        
        return (
          <line
            key={`nary-line-${index}`}
            x1={node.x}
            y1={node.y}
            x2={relation.diamondPos.x}
            y2={relation.diamondPos.y}
            stroke={isSelected ? "#1976d2" : "#666"}
            strokeWidth={(isSelected ? 2 : 1.5)}
            pointerEvents="none"
          />
        );
    })}
    
    <g
      transform={`translate(${relation.diamondPos.x},${relation.diamondPos.y}) scale(0.7) rotate(90)`}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      data-alignment-x={relation.diamondPos.x}
      data-alignment-y={relation.diamondPos.y}
      className="alignment-target nary-diamond"
      onMouseDown={(e) => {
        e.stopPropagation();
        if (handleNaryDiamondInteractionStart) {
          handleNaryDiamondInteractionStart(relation.id, relation.diamondPos.x, relation.diamondPos.y, e);
        }
      }}
    >
      <path
        d="M 27.9883 52 C 29.2774 52 29.9336 51.1328 31.2461 49.3516 L 45.2383 30.6719 C 45.8711 29.8047 46.2461 28.9375 46.2461 28 C 46.2461 27.0390 45.8711 26.1953 45.2383 25.3281 L 31.2461 6.6250 C 29.9336 4.8672 29.2774 4.0000 27.9883 4.0000 C 26.7227 4.0000 26.0664 4.8672 24.7539 6.6250 L 10.7617 25.3281 C 10.1289 26.1953 9.7539 27.0390 9.7539 28 C 9.7539 28.9375 10.1289 29.8047 10.7617 30.6719 L 24.7539 49.3516 C 26.0664 51.1328 26.7227 52 27.9883 52 Z M 27.9883 47.0547 C 27.8945 47.0547 27.8242 46.9844 27.7774 46.8672 L 14.2070 28.6328 C 13.9961 28.3750 13.9727 28.1875 13.9727 28 C 13.9727 27.8125 13.9961 27.6250 14.2070 27.3672 L 27.7774 9.1094 C 27.8242 9.0156 27.8945 8.9453 27.9883 8.9453 C 28.1055 8.9453 28.1758 9.0156 28.2227 9.1094 L 41.7930 27.3672 C 42.0039 27.6250 42.0274 27.8125 42.0274 28 C 42.0274 28.1875 42.0039 28.3750 41.7930 28.6328 L 28.2227 46.8672 C 28.1758 46.9844 28.1055 47.0547 27.9883 47.0547 Z"
        fill="#f7fafd"
        stroke={isSelected ? "#1976d2" : "#183153"}
        strokeWidth={isSelected ? 2 : 1.5}
      />
    </g>
    
      <text
        x={relation.diamondPos.x}
        y={relation.diamondPos.y + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10px"
        fill={isSelected ? "#1976d2" : "#183153"}
        fontWeight={isSelected ? "bold" : "normal"}
        pointerEvents="none"
      >
        {relation.n}/{relation.activities.length}
      </text>
    </g>
  );
}
