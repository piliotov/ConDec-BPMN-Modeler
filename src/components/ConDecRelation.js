import React, { useState, useEffect } from 'react';
import { updateRelationWithFixedEndpoints, updateRelationWaypoints } from '../utils/relations/relationUtils';
import { UpdateRelationCommand } from '../utils/commands/DiagramCommands';

export function ConDecRelation({
  relation,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  onWaypointDrag,
  onWaypointDragEnd,
  canvasOffset,
  zoom,
  diagram,
  setDiagram,
  commandStack
}) {
  const [currentWaypoints, setCurrentWaypoints] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [isLabelDragging, setIsLabelDragging] = useState(false);
  const [labelDragOffset, setLabelDragOffset] = useState({ x: 0, y: 0 });
  const midIndex = Math.floor((currentWaypoints?.length || 0) / 2);
  const midPoint = currentWaypoints?.[midIndex] || { x: 0, y: 0 };
  const style = {
    stroke: isSelected ? '#1a73e8' : '#666',
    strokeWidth: isSelected ? 2 : 1.5,
    fillArrow: isSelected ? '#1a73e8' : '#666'
  };

  useEffect(() => {
    if (!relation || !sourceNode || !targetNode) return;
    const mockDiagram = {
      nodes: [sourceNode, targetNode],
      relations: [relation]
    };

    const updatedRelation = updateRelationWaypoints(
      { ...relation, waypoints: relation.waypoints || [
        { x: sourceNode.x, y: sourceNode.y },
        { x: targetNode.x, y: targetNode.y }
      ] },
      mockDiagram
    );
    setCurrentWaypoints(updatedRelation.waypoints);
  }, [relation, sourceNode, targetNode]);

  const handleWaypointMouseDown = (e, index) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedPoint(index);
  };

  const handlePathClick = (e) => {
    if (!isSelected) {
      onSelect(e);
      return;
    }
    e.stopPropagation();
    const svg = e.target.closest('svg') || document.querySelector('svg.condec-canvas');
    if (!svg) return;
    
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    const clickX = (svgPoint.x - canvasOffset.x) / zoom;
    const clickY = (svgPoint.y - canvasOffset.y) / zoom;
    let minDist = Infinity;
    let insertIndex = -1;
    
    for (let i = 0; i < currentWaypoints.length - 1; i++) {
      const p1 = currentWaypoints[i];
      const p2 = currentWaypoints[i + 1];
      const dist = distToSegment({x: clickX, y: clickY}, p1, p2);
      
      if (dist < minDist) {
        minDist = dist;
        insertIndex = i + 1;
      }
    }
    
    if (minDist < 10 / zoom && insertIndex !== -1) {
      const newWaypoints = [...currentWaypoints];
      newWaypoints.splice(insertIndex, 0, { x: clickX, y: clickY });
      if (commandStack && diagram && setDiagram) {
        const command = new UpdateRelationCommand(
          relation.id,
          { waypoints: newWaypoints },
          getDiagram,
          setDiagram
        );
        commandStack.execute(command);
      }
      setCurrentWaypoints(newWaypoints);
      if (onWaypointDrag) {
        onWaypointDrag(relation.id, newWaypoints, [{ ...relation, waypoints: newWaypoints }]);
        if (onWaypointDragEnd) {
          onWaypointDragEnd(relation.id);
        }
      }
    }
  };
  const distToSegment = (p, v, w) => {
    const sqr = x => x * x;
    const dist2 = (v, w) => sqr(v.x - w.x) + sqr(v.y - w.y);
    const l2 = dist2(v, w);
    if (l2 === 0) return dist2(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projection = {
      x: v.x + t * (w.x - v.x),
      y: v.y + t * (w.y - v.y)
    };
    
    return Math.sqrt(dist2(p, projection));
  };

  useEffect(() => {
    if (!isDragging || draggedPoint === null) return;
    
    const handleMouseMove = (e) => {
      if (!currentWaypoints) return;

      const svg = document.querySelector('svg.condec-canvas');
      if (!svg) return;
      
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      
      const x = (svgPoint.x - canvasOffset.x) / zoom;
      const y = (svgPoint.y - canvasOffset.y) / zoom;
      
      if (draggedPoint > 0 && draggedPoint < currentWaypoints.length - 1) {
        const newWaypoints = [...currentWaypoints];
        newWaypoints[draggedPoint] = { x, y };

        const mockDiagram = {
          nodes: [sourceNode, targetNode],
          relations: [relation]
        };
        const updatedRelation = updateRelationWithFixedEndpoints(
          relation,
          newWaypoints,
          mockDiagram
        );
        setCurrentWaypoints(updatedRelation.waypoints);

        if (onWaypointDrag) {
          onWaypointDrag(relation.id, updatedRelation.waypoints, [updatedRelation]);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedPoint(null);
      if (onWaypointDragEnd) {
        onWaypointDragEnd(relation.id);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedPoint, currentWaypoints, relation, onWaypointDrag, onWaypointDragEnd, canvasOffset, zoom, sourceNode, targetNode]);

  useEffect(() => {
    if (draggedPoint === null) return;
    const handleMouseMove = (e) => {
      const svg = document.querySelector('svg.condec-canvas');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const x = (mouseX - canvasOffset.x) / zoom;
      const y = (mouseY - canvasOffset.y) / zoom;
      if (draggedPoint > 0 && draggedPoint < currentWaypoints.length - 1) {
        const newWaypoints = [...currentWaypoints];
        newWaypoints[draggedPoint] = { x, y };
        const mockDiagram = {
          nodes: [sourceNode, targetNode],
          relations: [relation]
        };
        const updatedRelation = updateRelationWithFixedEndpoints(
          relation,
          newWaypoints,
          mockDiagram
        );
        setCurrentWaypoints(updatedRelation.waypoints);
        if (onWaypointDrag) {
          onWaypointDrag(relation.id, updatedRelation.waypoints, [updatedRelation]);
        }
      }
    };
    const handleMouseUp = () => {
      setDraggedPoint(null);
      if (onWaypointDragEnd) {
        onWaypointDragEnd(relation.id);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPoint, currentWaypoints, relation, sourceNode, targetNode, canvasOffset, zoom, onWaypointDrag, onWaypointDragEnd]);

  const handleLabelMouseDown = (e) => {
    if (!isSelected) return;
    e.stopPropagation();
    setIsLabelDragging(true);
    setLabelDragOffset({
      x: e.clientX - (midPoint.x * zoom + canvasOffset.x),
      y: e.clientY - (midPoint.y * zoom + canvasOffset.y)
    });
  };
  
  useEffect(() => {
    if (!isLabelDragging) return;
    
    const handleMouseMove = (e) => {
      const svg = document.querySelector('svg.condec-canvas');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newLabelX = (mouseX - canvasOffset.x) / zoom;
      const newLabelY = (mouseY - canvasOffset.y) / zoom;
      const dx = newLabelX - midPoint.x;
      const dy = newLabelY - midPoint.y;

      if (currentWaypoints.length >= 2) {
        const newWaypoints = [...currentWaypoints];
        
        for (let i = 1; i < newWaypoints.length - 1; i++) {
          newWaypoints[i] = {
            x: newWaypoints[i].x + dx,
            y: newWaypoints[i].y + dy
          };
        }
        const mockDiagram = {
          nodes: [sourceNode, targetNode],
          relations: [relation]
        };
        const updatedRelation = updateRelationWithFixedEndpoints(
          relation,
          newWaypoints,
          mockDiagram
        );

        setCurrentWaypoints(updatedRelation.waypoints);
        
        if (onWaypointDrag) {
          onWaypointDrag(relation.id, updatedRelation.waypoints, [updatedRelation]);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsLabelDragging(false);
      setLabelDragOffset({ x: 0, y: 0 });
      if (onWaypointDragEnd) {
        onWaypointDragEnd(relation.id, true);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLabelDragging, midPoint, currentWaypoints, relation, onWaypointDrag, onWaypointDragEnd, canvasOffset, zoom, sourceNode, targetNode]);

  const handleRelationClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(e);
    }
  };
  
  if (!relation || !currentWaypoints || currentWaypoints.length < 2) {
    return null;
  }
  
  const pathData = currentWaypoints.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${acc} L ${point.x} ${point.y}`;
  }, '');
  
  const arrowMarkerId = `arrow-${relation.id}`;
  
  return (
    <g className="condec-relation" style={{ pointerEvents: 'all' }}>
      {/* Define arrow marker */}
      <defs>
        <marker
          id={arrowMarkerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={5}
          markerHeight={5}
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={style.fillArrow} />
        </marker>
      </defs>
      
      {/* Main path - ensure it can be clicked to add anchor points */}
      <path
        d={pathData}
        stroke={style.stroke}
        strokeWidth={(style.strokeWidth + 10) / zoom}
        fill="none"
        opacity="0.01"
        onClick={isSelected ? handlePathClick : handleRelationClick} 
        pointerEvents="stroke"
        style={{ cursor: isSelected ? 'crosshair' : 'pointer' }}
      />
      
      {/* Visual path */}
      <path
        d={pathData}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth / zoom}
        fill="none"
        markerEnd={`url(#${arrowMarkerId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={relation.type?.includes('neg') ? `${4/zoom},${2/zoom}` : 'none'}
        pointerEvents="none" // Let the invisible wider path handle events
      />
      
      {/* Handle points - only visible when selected */}
      {isSelected && currentWaypoints.map((point, index) => (
        <circle
          key={`handle-${index}`}
          cx={point.x}
          cy={point.y}
          r={5 / zoom}
          fill="#fff"
          stroke="#1a73e8"
          strokeWidth={1.5 / zoom}
          onMouseDown={(e) => handleWaypointMouseDown(e, index)}
          style={{ cursor: 'move', pointerEvents: 'all' }}
        />
      ))}
      
      {/* Fixed label */}
      {(relation.showLabel !== false) && (
        <g 
          className="condec-relation-label" 
          transform={`translate(${midPoint.x},${midPoint.y})`}
          pointerEvents="all"
          style={{ cursor: isSelected ? 'move' : 'default' }}
          onMouseDown={handleLabelMouseDown}
        >
          {/* Background rect for the label */}
          <rect
            x={-40}
            y={-10}
            width={80} 
            height={20}
            fill={isSelected ? "rgba(255,255,255,0.7)" : "transparent"}
            stroke={isSelected ? "#1a73e8" : "transparent"}
            strokeWidth={isSelected ? 1/zoom : 0}
            rx={4/zoom}
            ry={4/zoom}
            pointerEvents="none"
          />
          
          <text
            fontSize={`${11/zoom}px`}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={style.stroke}
            fontWeight={isSelected ? "bold" : "normal"}
            pointerEvents="none"
          >
            {relation.type}
          </text>
        </g>
      )}
    </g>
  );
}
