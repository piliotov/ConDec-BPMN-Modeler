import React, { useState, useEffect } from 'react';
import { generatePath } from '../utils/relations/geometryUtils';
import { getRelationVisual, getRelationLabel } from '../utils/relations/relationUtils';
import { getRelationMarkerIds } from '../utils/relations/relationIconUtils';
import { NaryRelation } from './NaryRelation';
export { RELATION_TYPES } from '../utils/relations/relationUtils';
export function ConDecRelation({
  relation,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  calculateIntersectionPoint,
  onWaypointDrag,
  onWaypointDragEnd,
  canvasOffset = { x: 0, y: 0 },
  zoom = 1,
  allNodes: allNodesProp,
  onAlignmentCheck
}) {
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState(null);
  const [currentWaypoints, setCurrentWaypoints] = useState([]);
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);
  const [labelOffset, setLabelOffset] = useState(relation.labelOffset || { x: 0, y: 0 });
  const dragOffsetRef = React.useRef(null);
  const relationLabel = getRelationLabel(relation.type);
  const { style, negation, pathStyle } = getRelationVisual(relation.type, isSelected);
  const { startMarkerId, endMarkerId } = getRelationMarkerIds(relation.type, isSelected);
  let pathData = '';
  if (currentWaypoints.length >= 2) {
    pathData = generatePath(currentWaypoints);
  }
  useEffect(() => {
    if (!sourceNode || !targetNode) return;
    const waypoints = relation.waypoints || [];
    const sourcePoint = { x: sourceNode.x, y: sourceNode.y };
    const targetPoint = { x: targetNode.x, y: targetNode.y };
    const sourceEdgePoint = calculateIntersectionPoint(targetPoint, sourcePoint);
    const targetEdgePoint = calculateIntersectionPoint(sourcePoint, targetPoint);
    const points = waypoints.length > 0 ? waypoints : [
      { x: sourceEdgePoint.x, y: sourceEdgePoint.y },
      { x: targetEdgePoint.x, y: targetEdgePoint.y }
    ];
    setCurrentWaypoints(points);
    if (relation.labelOffset) {
      setLabelOffset(relation.labelOffset);
    }
  }, [relation, sourceNode, targetNode, calculateIntersectionPoint]);

  useEffect(() => {
    if (draggedWaypointIndex === null || currentWaypoints.length === 0) return;
    const handleWaypointDrag = (e) => {
      e.stopPropagation();
      const svg = e.target.closest('svg') || document.querySelector('svg.condec-canvas');
      if (!svg) return;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      const updatedWaypoints = [...currentWaypoints];
      updatedWaypoints[draggedWaypointIndex] = {
        x: (svgPoint.x - canvasOffset.x) / zoom,
        y: (svgPoint.y - canvasOffset.y) / zoom
      };
      if (typeof onWaypointDrag === 'function') {
        const mockDiagram = { nodes: [sourceNode, targetNode], relations: [relation] };
        const updatedRelation = require('../utils/relations/relationUtils').updateRelationWithFixedEndpoints(
          relation,
          updatedWaypoints,
          mockDiagram
        );
        setCurrentWaypoints(updatedRelation.waypoints);
        onWaypointDrag(relation.id, updatedRelation.waypoints, [updatedRelation]);
      } else {
        setCurrentWaypoints(updatedWaypoints);
      }
      if (typeof onAlignmentCheck === 'function') {
        onAlignmentCheck(updatedWaypoints[draggedWaypointIndex], relation.id);
      }
    };
    const handleWaypointDragEnd = (e) => {
      e.stopPropagation();
      setDraggedWaypointIndex(null);
      if (onWaypointDragEnd) {
        onWaypointDragEnd(relation.id);
      }
      if (typeof onAlignmentCheck === 'function') {
        onAlignmentCheck(null, relation.id);
      }
    };
    window.addEventListener('mousemove', handleWaypointDrag);
    window.addEventListener('mouseup', handleWaypointDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleWaypointDrag);
      window.removeEventListener('mouseup', handleWaypointDragEnd);
    };
  }, [draggedWaypointIndex, currentWaypoints, relation, sourceNode, targetNode, canvasOffset, zoom, onWaypointDrag, onWaypointDragEnd, onAlignmentCheck]);

  useEffect(() => {
    if (!isDraggingLabel) return;
    const handleLabelDrag = (e) => {
      e.stopPropagation();
      const svg = document.querySelector('svg.condec-canvas');
      if (!svg) return;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
      if (dragOffsetRef.current === null) {
        const midPoint = getPathMidpoint(currentWaypoints);
        const labelX = midPoint?.x + (labelOffset?.x || 0);
        const labelY = midPoint?.y + (labelOffset?.y || 0);
        dragOffsetRef.current = {
          x: svgPoint.x - labelX,
          y: svgPoint.y - labelY
        };
      }
      const midPoint = getPathMidpoint(currentWaypoints);
      const newOffset = {
        x: (svgPoint.x - dragOffsetRef.current.x) - midPoint.x,
        y: (svgPoint.y - dragOffsetRef.current.y) - midPoint.y
      };
      setLabelOffset(newOffset);
      if (onWaypointDrag) {
        const updatedRelation = {
          ...relation,
          labelOffset: newOffset
        };
        onWaypointDrag(relation.id, currentWaypoints, [updatedRelation]);
      }
      if (typeof onAlignmentCheck === 'function') {
        onAlignmentCheck({ x: midPoint.x + newOffset.x, y: midPoint.y + newOffset.y }, relation.id);
      }
    };
    const handleLabelDragEnd = (e) => {
      e.stopPropagation();
      setIsDraggingLabel(false);
      dragOffsetRef.current = null;
      if (onWaypointDragEnd) {
        onWaypointDragEnd(relation.id, true);
      }
      if (typeof onAlignmentCheck === 'function') {
        onAlignmentCheck(null, relation.id);
      }
    };
    window.addEventListener('mousemove', handleLabelDrag);
    window.addEventListener('mouseup', handleLabelDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleLabelDrag);
      window.removeEventListener('mouseup', handleLabelDragEnd);
    };
  }, [isDraggingLabel, relation, currentWaypoints, onWaypointDrag, onWaypointDragEnd, labelOffset, onAlignmentCheck]);
  if (relation.activities && Array.isArray(relation.activities) && relation.activities.length > 1) {
    return (
      <NaryRelation
        relation={relation}
        allNodes={allNodesProp}
        zoom={zoom}
        canvasOffset={canvasOffset}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    );
  }

  if (!sourceNode || !targetNode || currentWaypoints.length < 2) {
    return null;
  }

  const midPoint = getPathMidpoint(currentWaypoints);
  const labelX = midPoint?.x + (labelOffset?.x || 0);
  const labelY = midPoint?.y + (labelOffset?.y || 0);

  function getPathMidpoint(points) {
    if (points.length < 2) return points[0] || { x: 0, y: 0 };

    let totalLength = 0;
    const segmentLengths = [];
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      const len = Math.hypot(dx, dy);
      segmentLengths.push(len);
      totalLength += len;
    }
    if (totalLength === 0) return points[0];

    let midDist = totalLength / 2;
    let acc = 0;
    for (let i = 0; i < segmentLengths.length; i++) {
      if (acc + segmentLengths[i] >= midDist) {
        const remain = midDist - acc;
        const ratio = remain / segmentLengths[i];
        const x = points[i].x + (points[i + 1].x - points[i].x) * ratio;
        const y = points[i].y + (points[i + 1].y - points[i].y) * ratio;
        return { x, y };
      }
      acc += segmentLengths[i];
    }
    return points[points.length - 1];
  }

  const controlPointSize = 8 / zoom;
  
  const handleWaypointMouseDown = (index, e) => {
    e.stopPropagation();
    setDraggedWaypointIndex(index);
  };
  
  const handleAddWaypoint = (index, midX, midY, e) => {
    e.stopPropagation();
    const newWaypoints = [...currentWaypoints];
    newWaypoints.splice(index + 1, 0, { x: midX, y: midY });
    
    setCurrentWaypoints(newWaypoints);
    
    if (onWaypointDrag) {
      onWaypointDrag(relation.id, newWaypoints);
      if (onWaypointDragEnd) {
        onWaypointDragEnd(relation.id);
      }
    }
  };

  const handleLabelMouseDown = (e) => {
    e.stopPropagation();
    setIsDraggingLabel(true);
  };
  
  const handleRelationClick = (e) => {
    e.stopPropagation();
    if (draggedWaypointIndex === null) {
      onSelect(e);
    }
  };

  function trimWaypoints(pts, trimLen) {
    if (pts.length < 2 || trimLen <= 0) return pts;
    let totalLength = 0;
    const segLens = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      const len = Math.hypot(dx, dy);
      segLens.push(len);
      totalLength += len;
    }
    if (totalLength === 0) return pts;

    if (totalLength < trimLen * 2) return pts;

    let remain = trimLen;
    let i = 0;
    let start = { ...pts[0] };
    while (remain > 0 && i < segLens.length) {
      if (segLens[i] > remain) {
        const ratio = remain / segLens[i];
        start = {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * ratio,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * ratio
        };
        break;
      }
      remain -= segLens[i];
      i++;
    }

    remain = trimLen;
    let j = segLens.length - 1;
    let end = { ...pts[pts.length - 1] };
    while (remain > 0 && j >= 0) {
      if (segLens[j] > remain) {
        const ratio = remain / segLens[j];
        end = {
          x: pts[j + 1].x - (pts[j + 1].x - pts[j].x) * ratio,
          y: pts[j + 1].y - (pts[j + 1].y - pts[j].y) * ratio
        };
        break;
      }
      remain -= segLens[j];
      j--;
    }

    const newPts = [];
    if (i === j + 1) {
      newPts.push(start, end);
    } else {
      newPts.push(start);
      for (let k = i + 1; k <= j + 1; k++) {
        newPts.push(pts[k]);
      }
      newPts.push(end);
    }
    return newPts;
  }

  function offsetPolyline(points, offset) {
    if (points.length < 2 || offset === 0) return points.map(pt => ({ ...pt }));
    const out = [];
    for (let i = 0; i < points.length; i++) {
      let dx = 0, dy = 0;
      if (i === 0) {
        dx = points[1].x - points[0].x;
        dy = points[1].y - points[0].y;
      } else if (i === points.length - 1) {
        dx = points[i].x - points[i - 1].x;
        dy = points[i].y - points[i - 1].y;
      } else {
        const dx1 = points[i].x - points[i - 1].x;
        const dy1 = points[i].y - points[i - 1].y;
        const dx2 = points[i + 1].x - points[i].x;
        const dy2 = points[i + 1].y - points[i].y;
        const len1 = Math.hypot(dx1, dy1);
        const len2 = Math.hypot(dx2, dy2);
        let nx1 = 0, ny1 = 0, nx2 = 0, ny2 = 0;
        if (len1 > 0) {
          nx1 = -dy1 / len1;
          ny1 = dx1 / len1;
        }
        if (len2 > 0) {
          nx2 = -dy2 / len2;
          ny2 = dx2 / len2;
        }
        const nx = nx1 + nx2;
        const ny = ny1 + ny2;
        const nlen = Math.hypot(nx, ny);
        if (nlen > 0) {
          out.push({
            x: points[i].x + (nx / nlen) * offset,
            y: points[i].y + (ny / nlen) * offset
          });
          continue;
        } else {
          dx = dx1 + dx2;
          dy = dy1 + dy2;
        }
      }
      const len = Math.hypot(dx, dy);
      if (len === 0) {
        out.push({ ...points[i] });
      } else {
        const nx = -dy / len;
        const ny = dx / len;
        out.push({
          x: points[i].x + nx * offset,
          y: points[i].y + ny * offset
        });
      }
    }
    return out;
  }

  function getMarkerOffsetForId(markerId, isEnd = false, startMarkerId = null) {
    if (!markerId) return 0;
    if (
      isEnd &&
      markerId.includes('arrow-ball') &&
      startMarkerId &&
      startMarkerId.includes('ball')
    ) {
      return 25;
    }
    if (markerId.includes('arrow-ball')) return isEnd ? 18 : 13;
    if (markerId.includes('arrow')) return isEnd ? 16 : 8;
    if (markerId.includes('ball')) return isEnd ? 14 : 7;
    return 0;
  }

  function trimBothEndsDiff(pts, trimStart, trimEnd) {
    if ((!trimStart && !trimEnd) || pts.length < 2) return pts;
    let trimmed = pts;
    if (trimStart) trimmed = trimWaypoints(trimmed, trimStart);
    if (trimEnd) trimmed = trimWaypoints(trimmed.slice().reverse(), trimEnd).slice().reverse();
    return trimmed;
  }

  function renderRelationLabel(relation, midPoint, zoom) {
    if (relation.showLabel === false) return null;
    const labelYOffset = -10; 
    return (
      <text
        x={labelX}
        y={labelY + labelYOffset}
        fontSize="11px"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={style.stroke}
        fontWeight={isSelected ? "bold" : "normal"}
        pointerEvents="none"
        style={{
          userSelect: "none"
        }}
      >
        {relationLabel}
      </text>
    );
  }

  return (
    <g 
      className="condec-relation"
      onMouseDown={handleRelationClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Add invisible alignment target at midpoint for alignment system */}
      <circle
        cx={midPoint?.x}
        cy={midPoint?.y}
        r="3"
        fill="none"
        className="alignment-target relation-midpoint"
        data-alignment-x={midPoint?.x}
        data-alignment-y={midPoint?.y}
        pointerEvents="none"
      />

      {/* Invisible wider path for easier selection - always rendered first */}
      <path
        d={pathData}
        stroke="none"
        strokeWidth={10/zoom}
        fill="none"
        pointerEvents="stroke"
      />

      {/* Main center path with markers (always render for markers, even if alt, but invisible for alt) */}
      {(pathStyle !== 'alt') && (
        <path
          d={generatePath(currentWaypoints)}
          fill="none"
          {...style}
          markerEnd={endMarkerId}
          markerStart={startMarkerId}
          pointerEvents="none"
        />
      )}

      {/* For alt: render a center path only for markers */}
      {pathStyle === 'alt' && (startMarkerId || endMarkerId) && (
        <path
          d={generatePath(currentWaypoints)}
          fill="none"
          stroke="none"
          strokeWidth={style.strokeWidth || 1.5}
          markerEnd={endMarkerId}
          markerStart={startMarkerId}
          pointerEvents="none"
        />
      )}

      {/* Parallel lines for alt/chain, trimmed at ends, no markers */}
      {(() => {
        const offset = 3; // px
        // Use larger trim for side lines so they end before markers
        const trimStart = getMarkerOffsetForId(startMarkerId, false);
        const trimEnd = getMarkerOffsetForId(endMarkerId, true, startMarkerId);

        function trimSideLine(pts) {
          return trimBothEndsDiff(pts, trimStart, trimEnd);
        }

        if (pathStyle === 'chain') {
          return [-offset, offset].map((off, i) => (
            <path
              key={`chain-parallel-${i}`}
              d={generatePath(trimSideLine(offsetPolyline(currentWaypoints, off)))}
              fill="none"
              {...style}
              pointerEvents="none"
            />
          ));
        }
        if (pathStyle === 'alt') {
          return [offset, -offset].map((off, i) => (
            <path
              key={`alt-parallel-${i}`}
              d={generatePath(trimSideLine(offsetPolyline(currentWaypoints, off)))}
              fill="none"
              {...style}
              pointerEvents="none"
            />
          ));
        }
        return null;
      })()}

      {/* Render negation marker at midpoint */}
      {negation && (() => {
        let angle = 0;
        if (currentWaypoints.length >= 2) {
          let totalLength = 0;
          const segmentLengths = [];
          for (let i = 0; i < currentWaypoints.length - 1; i++) {
            const dx = currentWaypoints[i + 1].x - currentWaypoints[i].x;
            const dy = currentWaypoints[i + 1].y - currentWaypoints[i].y;
            const len = Math.hypot(dx, dy);
            segmentLengths.push(len);
            totalLength += len;
          }
          let midDist = totalLength / 2;
          let acc = 0;
          for (let i = 0; i < segmentLengths.length; i++) {
            if (acc + segmentLengths[i] >= midDist) {
              const dx = currentWaypoints[i + 1].x - currentWaypoints[i].x;
              const dy = currentWaypoints[i + 1].y - currentWaypoints[i].y;
              angle = Math.atan2(dy, dx) * 180 / Math.PI;
              break;
            }
            acc += segmentLengths[i];
          }
        }
        return (
          <g
            transform={`translate(${midPoint.x},${midPoint.y}) rotate(${angle})`}
            pointerEvents="none"
          >
            <line x1={-3} y1={-12} x2={-3} y2={12} stroke={style.stroke} strokeWidth={1.2} />
            <line x1={3} y1={-12} x2={3} y2={12} stroke={style.stroke} strokeWidth={1.2} />
          </g>
        );
      })()}
            {/* Draggable Label */}
      {(relation.showLabel !== false) && (
        <g 
          className="condec-relation-label" 
          cursor={isSelected ? "move" : "pointer"}
          onMouseDown={isSelected ? handleLabelMouseDown : handleRelationClick}
          pointerEvents="all"
        >
          {/* Background rect for easier selection - only render when selected */}
          {isSelected && (
            <rect
              x={labelX - 40}
              y={labelY - 18}
              width={80} 
              height={15}
              fill="rgba(255,255,255,0.7)"
              stroke="#1a73e8"
              strokeWidth={1}
              strokeDasharray="2,1"
              rx={4}
              ry={4}
              pointerEvents="all"
            />
          )}
          {renderRelationLabel(relation, midPoint, zoom)}
        </g>
      )}

      {/* Control points */}
      {isSelected && currentWaypoints.map((point, index) => (
        <g key={`wp-group-${index}`}>
          <rect
            x={point.x - controlPointSize/2}
            y={point.y - controlPointSize/2}
            width={controlPointSize}
            height={controlPointSize}
            fill={draggedWaypointIndex === index ? "#f44336" : "#1a73e8"}
            stroke="#fff"
            strokeWidth={1/zoom}
            cursor="move"
            onMouseDown={(e) => handleWaypointMouseDown(index, e)}
            pointerEvents="all"
          />
          {/* Remove button for interior waypoints */}
          {index > 0 && index < currentWaypoints.length - 1 && (
            <g
              style={{ cursor: 'pointer' }}
              onMouseDown={e => {
                e.stopPropagation();
                // Remove this waypoint and update relation with fixed endpoints
                const newWaypoints = currentWaypoints.filter((_, i) => i !== index);
                // Use updateRelationWithFixedEndpoints to recalc endpoints
                if (typeof onWaypointDrag === 'function') {
                  // Use a mock diagram for endpoint calculation
                  const mockDiagram = { nodes: [sourceNode, targetNode], relations: [relation] };
                  const updatedRelation = require('../utils/relations/relationUtils').updateRelationWithFixedEndpoints(
                    relation,
                    newWaypoints,
                    mockDiagram
                  );
                  setCurrentWaypoints(updatedRelation.waypoints);
                  onWaypointDrag(relation.id, updatedRelation.waypoints, [updatedRelation]);
                  if (typeof onWaypointDragEnd === 'function') {
                    onWaypointDragEnd(relation.id);
                  }
                }
              }}
            >
              <circle
                cx={point.x}
                cy={point.y - 14 / zoom}
                r={6 / zoom}
                fill="#fff"
                stroke="#f44336"
                strokeWidth={1/zoom}
              />
              <text
                x={point.x}
                y={point.y - 14 / zoom + 2/zoom}
                textAnchor="middle"
                fontSize={`${10/zoom}px`}
                fill="#f44336"
                fontWeight="bold"
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                ×
              </text>
            </g>
          )}
        </g>
      ))}
      
      {/* Add waypoint button (middle of each segment) - only when selected */}
      {isSelected && currentWaypoints.length > 1 && currentWaypoints.slice(0, -1).map((point, idx) => {
        const nextPoint = currentWaypoints[idx + 1];
        const midX = (point.x + nextPoint.x) / 2;
        const midY = (point.y + nextPoint.y) / 2;
        return (
          <circle
            key={`add-wp-${idx}`}
            cx={midX}
            cy={midY}
            r={controlPointSize / 2}
            fill="#ffffff"
            stroke="#1a73e8"
            strokeWidth={1/zoom}
            cursor="pointer"
            opacity={0.7}
            onMouseDown={(e) => handleAddWaypoint(idx, midX, midY, e)}
            pointerEvents="all"
          />
        );
      })}
    </g>
  );
}
