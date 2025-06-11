import React from 'react';
import { ConDecRelation } from '../../components/ConDecRelations';
import { ConDecNode } from '../../components/ConDecNode';
import { ConDecNodeMenu } from '../../components/FloatingNodeMenu';
import { calculateIntersectionPoint } from '../relations/geometryUtils';

export const renderDiagramElements = ({
  diagram,
  selectedElement,
  multiSelectedNodes,
  mode,
  zoom,
  naryStartNode,
  naryMouse,
  relationCreationState,
  relationMouse,
  connectFromNodeMenu,
  nodeSizes,
  props,
  handleNodeInteractionStart,
  handleNaryDiamondInteractionStart,
  handleWaypointDrag,
  handleWaypointDragEnd,
  handleAlignmentCheck,
  handleNodeSize,
  canvasOffset,
  commandStack,
  setDiagram,
  setConnectFromNodeMenu,
  setRelationCreationState,
  setRelationMouse,
  onNaryRelationClick,
  getNodeCenter,
  getNodeEdgePoint,
  renderAlignmentGuides,
  narySelectedNodes = [],
}) => {
  if (!diagram || !diagram.nodes || !diagram.relations) return null;
  
  const nodes = [...diagram.nodes];
  const relations = [...diagram.relations];
  
  const selectedNodeId = selectedElement?.type === 'node' ? selectedElement.element.id : null;
  const selectedRelationId = selectedElement?.type === 'relation' ? selectedElement.element.id : null;
  
  relations.sort((a, b) => {
    if (a.id === selectedRelationId) return 1; 
    if (b.id === selectedRelationId) return -1;
    return 0;
  });
  
  nodes.sort((a, b) => {
    if (a.id === selectedNodeId) return 1; 
    if (b.id === selectedNodeId) return -1;
    return 0;
  });
  const naryDiamondsArr = [];
  relations.forEach(relation => {
    if ((relation.type === 'choice' || relation.type === 'Ex_choice') && relation.activities && Array.isArray(relation.activities) && relation.activities.length > 0) {
      let diamondPos = relation.diamondPos;
      if (!diamondPos) {
        const activityNodes = relation.activities.map(id => nodes.find(n => n.id === id)).filter(Boolean);
        if (activityNodes.length > 0) {
          const avgX = activityNodes.reduce((sum, n) => sum + n.x, 0) / activityNodes.length;
          const avgY = activityNodes.reduce((sum, n) => sum + n.y, 0) / activityNodes.length;
          diamondPos = { x: avgX, y: avgY };
          if (props.onRelationEdit && diagram && Array.isArray(diagram.relations)) {
            setTimeout(() => {
              const updatedRelations = diagram.relations.map(r =>
                r.id === relation.id ? { ...relation, diamondPos } : r
              );
              props.onRelationEdit(updatedRelations);
            }, 0);
          }
        }
      }
      if (!diamondPos) return; 
      const isSelected =
        !multiSelectedNodes.length &&
        selectedElement &&
        selectedElement.type === 'relation' &&
        selectedElement.element.id === relation.id;
      let fillColor = '#f7fafd';
      if (relation.type === 'Ex_choice') fillColor = '#183153';
      naryDiamondsArr.push(
        <g key={`nary-diamond-${relation.id}`} className="nary-relation-diamond">
          {/* N-ary connecting lines (behind diamond) */}
          <g className="nary-relation-lines">
            {relation.activities.map((nodeId, index) => {
              const node = nodes.find(n => n.id === nodeId);
              if (!node) return null;
              const nodeEdgePoint = calculateIntersectionPoint(
                { x: diamondPos.x, y: diamondPos.y },
                { x: node.x, y: node.y },
                node.width || 100,
                node.height || 50
              );
              return (
                <line
                  key={`nary-line-${nodeId}-${index}`}
                  x1={diamondPos.x}
                  y1={diamondPos.y}
                  x2={nodeEdgePoint.x}
                  y2={nodeEdgePoint.y}
                  stroke={isSelected ? "#1976d2" : "#666"}
                  strokeWidth={(isSelected ? 2 : 1.5) / zoom}
                  pointerEvents="none"
                />
              );
            })}
          </g>
          {/* Constraint label above the diamond */}
          <text
            x={diamondPos.x}
            y={diamondPos.y - 20}
            textAnchor="middle"
            dominantBaseline="baseline"
            fontSize={`${12/zoom}px`}
            fontWeight="bold"
            fill="#183153"
            pointerEvents="none"
            style={{ userSelect: 'none' }}
          >
            {relation.n} of {relation.activities.length}
          </text>
          {/* Diamond shape */}
          <polygon
            points={`${diamondPos.x},${diamondPos.y - 8} ${diamondPos.x + 18},${diamondPos.y} ${diamondPos.x},${diamondPos.y + 8} ${diamondPos.x - 18},${diamondPos.y}`}
            fill={fillColor}
            stroke={isSelected ? "#1976d2" : "#183153"}
            strokeWidth={(isSelected ? 2 : 1.5) / zoom}
            data-alignment-x={diamondPos.x}
            data-alignment-y={diamondPos.y}
            className="alignment-target nary-diamond"
            onMouseDown={(e) => {
              if (mode === 'hand' && e.button === 0) {
                handleNaryDiamondInteractionStart(relation.id, diamondPos.x, diamondPos.y, e);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (props.onSelectElement) {
                props.onSelectElement('relation', relation.id);
              }
              if (props.onNaryRelationClick) {
                props.onNaryRelationClick(relation, e);
              }
            }}
            style={{ 
              cursor: mode === 'hand' ? 'move' : (mode === 'nary' && naryStartNode ? 'pointer' : 'default')
            }}
          />
        </g>
      );
    }
  });

  const relationElements = relations.map(relation => {
    if (relation.type === 'choice' && relation.activities && Array.isArray(relation.activities)) {
      return null;
    }
    const sourceNode = nodes.find(n => n.id === relation.sourceId);
    const targetNode = nodes.find(n => n.id === relation.targetId);
    if (!sourceNode || !targetNode) return null;
    const isSelected =
      !multiSelectedNodes.length &&
      selectedElement &&
      selectedElement.type === 'relation' &&
      selectedElement.element.id === relation.id;
    const handleRelationClick =
      mode === 'nary' && naryStartNode
        ? (e) => {
            e.stopPropagation();
            onNaryRelationClick && onNaryRelationClick(relation, e);
          }
        : (e) => {
            e.stopPropagation();
            if (mode === 'select' && props.onSelectElement) {
              props.onSelectElement('relation', relation.id);
              return;
            }
            props.onSelectElement('relation', relation.id);
          };
    return (
      <ConDecRelation
        key={relation.id}
        relation={relation}
        sourceNode={sourceNode}
        targetNode={targetNode}
        isSelected={isSelected}
        onSelect={handleRelationClick}
        calculateIntersectionPoint={calculateIntersectionPoint}
        onWaypointDrag={handleWaypointDrag}
        onWaypointDragEnd={handleWaypointDragEnd}
        canvasOffset={canvasOffset}
        zoom={zoom}
        diagram={diagram}
        setDiagram={setDiagram}
        commandStack={commandStack}
        allNodes={nodes}
        onAlignmentCheck={handleAlignmentCheck}
      />
    );
  });

  const nodeElements = nodes.map(node => {
    const isSelected = !multiSelectedNodes.length && selectedElement &&
      selectedElement.type === 'node' &&
      selectedElement.element.id === node.id;
    const isMultiSelected = multiSelectedNodes && multiSelectedNodes.find(n => n.id === node.id);
    const isNarySelected = narySelectedNodes && narySelectedNodes.includes(node.id);
    return (
      <React.Fragment key={node.id}>
        <ConDecNode
          node={node}
          isSelected={isSelected}
          isMultiSelected={!!isMultiSelected}
          isNarySelected={isNarySelected}
          mode={props.mode}
          onSelect={(e) => {
            // addRelation mode
            if (props.mode === 'addRelation') {
              if (!relationCreationState.active) {
                // First click: set source node
                if (diagram && Array.isArray(diagram.nodes)) {
                  const sourceNode = diagram.nodes.find(n => n.id === node.id);
                  setRelationCreationState({
                    active: true,
                    sourceNode,
                    sourceId: node.id
                  });
                  setRelationMouse(null);
                }
                return;
              } else if (
                relationCreationState.active &&
                node.id !== relationCreationState.sourceId
              ) {
                if (props.onRelationCreate) {
                  props.onRelationCreate(relationCreationState.sourceId, node.id);
                }
                setRelationCreationState({
                  active: false,
                  sourceNode: null,
                  sourceId: null
                });
                setRelationMouse(null);
                return;
              }
              return;
            }
            if (props.mode === 'nary') {
              if (props.onSelectElement) props.onSelectElement('node', node.id, e);
            } else {
              props.onSelectElement && props.onSelectElement('node', node.id);
            }
          }}
          onDoubleClick={() => {}}
          onDragStart={e => handleNodeInteractionStart(node.id, e)}
          onMenu={null}
          onRename={(newName, clearEditing) => {
            if (clearEditing) {
              if (typeof props.onNodeRename === 'function') {
                props.onNodeRename(node.id, newName);
              }
            } else {
              const updatedNodes = diagram.nodes.map(n =>
                n.id === node.id
                  ? { ...n, name: newName }
                  : n
              );
              if (typeof props.onNodeEdit === 'function') {
                props.onNodeEdit(updatedNodes);
              }
            }
          }}
          onRenameBlur={() => {}}
          onSize={size => handleNodeSize(node.id, size)}
        />
      </React.Fragment>
    );
  });
  let nodeMenu = null;
  if (
    selectedElement &&
    selectedElement.type === 'node' &&
    (!multiSelectedNodes || !multiSelectedNodes.length)
  ) {
    let node = nodes.find(n => n.id === selectedElement.element.id);
    if (node && nodeSizes[node.id]) {
      node = { ...node, ...nodeSizes[node.id] };
    }
    if (node) {
      nodeMenu = (
        <ConDecNodeMenu
          node={node}
          diagram={diagram}
          onEdit={props.onNodeMenuEdit}
          onDelete={props.onNodeMenuDelete}
          onAppend={props.onAppend}
          onClose={props.onNodeMenuClose}
          zoom={zoom}
          onConnect={(node) => {
            setConnectFromNodeMenu({ 
              sourceId: node.id,
              sourceNode: node
            });
            if (props.setMode) props.setMode('connectFromNodeMenu');
          }}
        />
      );
    }
  }

  let temporaryRelation = null;
  if (
    props.mode === 'addRelation' &&
    relationCreationState.active &&
    relationCreationState.sourceNode &&
    relationMouse
  ) {
    const sourceNode = relationCreationState.sourceNode;
    const sourceCenter = getNodeCenter(sourceNode);
    const targetPoint = {
      x: (relationMouse.x - (props.canvasOffset?.x || 0)) / (props.zoom || 1),
      y: (relationMouse.y - (props.canvasOffset?.y || 0)) / (props.zoom || 1)
    };
    const dx = targetPoint.x - sourceCenter.x;
    const dy = targetPoint.y - sourceCenter.y;
    const start = getNodeEdgePoint(sourceNode, dx, dy);
    temporaryRelation = (
      <>
        <line
          x1={start.x}
          y1={start.y}
          x2={targetPoint.x}
          y2={targetPoint.y}
          stroke="#1a73e8"
          strokeWidth="1.5"
          strokeDasharray="5,5"
          markerEnd="url(#arrow)"
          style={{ pointerEvents: 'none' }}
        />
        <circle
          cx={start.x}
          cy={start.y}
          r="3"
          fill="#1a73e8"
          style={{ pointerEvents: 'none' }}
        />
      </>
    );
  }

  else if (
    props.mode === 'connectFromNodeMenu' &&
    connectFromNodeMenu &&
    connectFromNodeMenu.sourceNode &&
    props.mousePosition
  ) {
    const sourceNode = connectFromNodeMenu.sourceNode;
    const sourceCenter = getNodeCenter(sourceNode);
    const targetPoint = {
      x: (props.mousePosition.x - (props.canvasOffset?.x || 0)) / (props.zoom || 1),
      y: (props.mousePosition.y - (props.canvasOffset?.y || 0)) / (props.zoom || 1)
    };
    const dx = targetPoint.x - sourceCenter.x;
    const dy = targetPoint.y - sourceCenter.y;
    const start = getNodeEdgePoint(sourceNode, dx, dy);
    temporaryRelation = (
      <>
        <line
          x1={start.x}
          y1={start.y}
          x2={targetPoint.x}
          y2={targetPoint.y}
          stroke="#1a73e8"
          strokeWidth="1.5"
          strokeDasharray="5,5"
          markerEnd="url(#arrow)"
          style={{ pointerEvents: 'none' }}
        />
        <circle
          cx={start.x}
          cy={start.y}
          r="3"
          fill="#1a73e8"
          style={{ pointerEvents: 'none' }}
        />
      </>
    );
  }

  return (
    <>
      {renderAlignmentGuides()}
      {naryDiamondsArr}
      {relationElements}
      {/* N-ary mode: draw dashed arrow from start node to mouse */}
      {mode === 'nary' && naryStartNode && naryMouse && (
        <line
          x1={naryStartNode.x}
          y1={naryStartNode.y}
          x2={naryMouse.x}
          y2={naryMouse.y}
          stroke="#1976d2"
          strokeWidth={2}
          strokeDasharray="6,6"
          markerEnd="url(#arrow)"
          pointerEvents="none"
        />
      )}
      {temporaryRelation}
      {nodeElements}
      {nodeMenu}
    </>
  );
};
