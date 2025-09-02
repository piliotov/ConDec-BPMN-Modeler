import React, { useRef, useState, useImperativeHandle, useEffect } from 'react';
import {
  useCanvasPanning,
  RelationMarkers,
  endConnectMode,
  getConnectModeState,
  getNodeCenter,
  getNodeEdgePoint,
  renderLassoNode,
  renderMultiSelectBoundingBox,
  renderMultiSelectMenu,
  renderHologramNode,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  handleCanvasMouseDown,
  renderDiagramElements
} from '../utils/canvas';
import { getAlignmentGuidesForPoint, renderAlignmentGuidesSVG } from '../utils/canvas/alignmentUtils';


export const ConDecCanvas = React.forwardRef(({
  diagram,
  selectedElement,
  mode,
  onSelectElement,
  onNodeRename,
  onRelationCreate,
  onNodeEdit,
  onRelationEdit,
  newRelation,
  setNewRelation,
  mousePosition,
  setMousePosition,
  draggedElement,
  setDraggedElement,
  onCanvasClick,
  canvasOffset = { x: 0, y: 0 },
  setCanvasOffset,
  onCanvasMouseDown,
  onSelectionMouseMove,
  onSelectionMouseUp,
  zoom = 1,
  onCanvasWheel,
  selectionBox,
  setSelectionBox,
  multiSelectedNodes = [],
  setMultiSelectedNodes,
  multiSelectedElements = [],
  setMultiSelectedElements,
  onNodeMenuEdit,
  onNodeMenuDelete,
  onNodeMenuClose,
  isPanning,
  setIsPanning,
  panStart,
  setPanStart,
  panOrigin,
  setPanOrigin,
  onNodeDragStart,
  onNodeDrag,
  onAppend,
  setMode,
  onDeleteMultiSelected,
  onDeleteMultiSelectedExtended,
  naryStartNode,
  setNaryStartNode,
  naryMouse,
  onNaryRelationClick,
  onCanvasMouseMove,
  hologramNodePosition,
  commandStack,
  setDiagram,
  getDiagram,
  onMouseUpWithCommands,
  narySelectedNodes,
  refreshKey
}, ref) => {

  const svgRef = useRef();

  useImperativeHandle(ref, () => svgRef.current, []);

  // Cleanup effect to remove any orphaned elements when refreshKey changes
  useEffect(() => {
    if (svgRef.current) {
      // Remove any orphaned or duplicate elements
      const svg = svgRef.current;
      
      // Clean up all types of ghost elements
      const elementsToClean = [
        '[data-cleanup="true"]',
        '.orphaned',
        '.ghost',
        '.duplicate',
        '[data-ghost="true"]',
        // Clean up any elements that might be duplicated
        'g[class*="duplicate"]',
        'path[class*="duplicate"]',
        'rect[class*="duplicate"]'
      ];
      
      elementsToClean.forEach(selector => {
        const elements = svg.querySelectorAll(selector);
        elements.forEach(elem => elem.remove());
      });
      
      // More aggressive cleanup: remove any elements without proper React keys
      const allGroups = svg.querySelectorAll('g');
      allGroups.forEach(group => {
        // If a group doesn't have proper data attributes and seems orphaned
        if (!group.getAttribute('transform') && 
            !group.className.baseVal && 
            !group.hasChildNodes()) {
          group.remove();
        }
      });
    }
  }, [refreshKey]);

  const props = {
    diagram,
    selectedElement,
    mode,
    onSelectElement,
    onNodeRename,
    onRelationCreate,
    onNodeEdit,
    onRelationEdit,
    newRelation,
    setNewRelation,
    mousePosition,
    setMousePosition,
    draggedElement,
    setDraggedElement,
    onCanvasClick,
    canvasOffset,
    setCanvasOffset,
    onCanvasMouseDown,
    onSelectionMouseMove,
    onSelectionMouseUp,
    zoom,
    onCanvasWheel,
    selectionBox,
    setSelectionBox,
    multiSelectedNodes,
    setMultiSelectedNodes,
    multiSelectedElements,
    setMultiSelectedElements,
    onNodeMenuEdit,
    onNodeMenuDelete,
    onNodeMenuClose,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    panOrigin,
    setPanOrigin,
    onNodeDragStart,
    onNodeDrag,
    onAppend,
    setMode,
    onDeleteMultiSelected,
    onDeleteMultiSelectedExtended,
    naryStartNode,
    setNaryStartNode,
    naryMouse,
    onNaryRelationClick,
    onCanvasMouseMove,
    hologramNodePosition,
    commandStack,
    setDiagram,
    getDiagram,
    onMouseUpWithCommands,
    narySelectedNodes,
    refreshKey
  };

  const [alignmentGuides, setAlignmentGuides] = useState({ x: null, y: null });
  const [connectFromNodeMenu, setConnectFromNodeMenu] = useState(null);
  const [relationCreationState, setRelationCreationState] = useState({
    active: false,
    sourceNode: null,
    sourceId: null
  });
  const [relationMouse, setRelationMouse] = useState(null);
  const [draggedDiamond, setDraggedDiamond] = useState(null);
  const [nodeSizes, setNodeSizes] = useState({});

  const handleNodeSize = (nodeId, size) => {
    setNodeSizes(prev => {
      if (!size || !nodeId) return prev;
      if (prev[nodeId] && prev[nodeId].width === size.width && prev[nodeId].height === size.height) return prev;
      return { ...prev, [nodeId]: size };
    });
    if (props.onNodeSizeChange) {
      props.onNodeSizeChange(nodeId, size);
    }
  };

  const { handlePanStart, handlePanMove, handlePanEnd } = useCanvasPanning({
    setCanvasOffset,
    setIsPanning,
    setPanStart,
    setPanOrigin,
    canvasOffset,
    zoom
  });

  const [lassoStart, setLassoStart] = useState(null);
  const [lassoBox, setLassoBox] = useState(null);
  const lassoActive = mode === 'select';
  const lassoStartedOnCanvas = useRef(false);
  const [multiDragStart, setMultiDragStart] = useState(null);

  const handleNodeInteractionStart = (nodeId, e) => {
    const hasExtendedSelection = multiSelectedElements && 
      (multiSelectedElements.relationPoints?.length > 0 || multiSelectedElements.naryDiamonds?.length > 0);
    
    if (hasExtendedSelection) {
      const totalElements = (multiSelectedElements.nodes?.length || 0) + 
                           (multiSelectedElements.relationPoints?.length || 0) + 
                           (multiSelectedElements.naryDiamonds?.length || 0);
      const nodeInSelection = multiSelectedElements.nodes?.find(n => n.id === nodeId);
      
      if (totalElements > 1 && nodeInSelection) {
        setMultiDragStart({
          type: 'extended',
          startX: e.clientX,
          startY: e.clientY,
          selectedElements: {
            nodes: multiSelectedElements.nodes?.map(n => ({ id: n.id, x: n.x, y: n.y })) || [],
            relationPoints: multiSelectedElements.relationPoints?.map(rp => ({ 
              relationId: rp.relationId, 
              waypointIndex: rp.waypointIndex, 
              x: rp.x, 
              y: rp.y 
            })) || [],
            naryDiamonds: multiSelectedElements.naryDiamonds?.map(nd => ({ 
              relationId: nd.relationId, 
              x: nd.x, 
              y: nd.y 
            })) || []
          }
        });
        e.stopPropagation();
        return;
      }
    }
    else if (multiSelectedNodes && multiSelectedNodes.length > 1 && multiSelectedNodes.find(n => n.id === nodeId)) {
      setMultiDragStart({
        type: 'nodes',
        nodeIds: multiSelectedNodes.map(n => n.id),
        startX: e.clientX,
        startY: e.clientY,
        nodePositions: multiSelectedNodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
      });
      e.stopPropagation();
      return;
    }
    if (mode === 'select') {
      if (props.onSelectElement) {
        props.onSelectElement('node', nodeId);
      }
      if (diagram && Array.isArray(diagram.nodes)) {
        const foundNode = diagram.nodes.find(n => n.id === nodeId);
        setDraggedElement({
          id: nodeId,
          startX: e.clientX,
          startY: e.clientY,
          elementX: foundNode ? foundNode.x : 0,
          elementY: foundNode ? foundNode.y : 0
        });
      }
      e.stopPropagation();
      return;
    }
    if (mode === 'hand') {
      if (diagram && Array.isArray(diagram.nodes)) {
        const foundNode = diagram.nodes.find(n => n.id === nodeId);
        setDraggedElement({
          id: nodeId,
          startX: e.clientX,
          startY: e.clientY,
          elementX: foundNode ? foundNode.x : 0,
          elementY: foundNode ? foundNode.y : 0,
          originalPosition: { x: foundNode ? foundNode.x : 0, y: foundNode ? foundNode.y : 0 }
        });
      }
      e.stopPropagation();
      return;
    }
    if (mode === 'addRelation') {
      if (!relationCreationState.active && diagram && Array.isArray(diagram.nodes)) {
        const sourceNode = diagram.nodes.find(n => n.id === nodeId);
        setRelationCreationState({
          active: true,
          sourceNode,
          sourceId: nodeId
        });
      }
    }
  };

  const handleNaryDiamondInteractionStart = (relationId, x, y, e) => {
    const hasExtendedSelection = multiSelectedElements && 
      (multiSelectedElements.relationPoints?.length > 0 || multiSelectedElements.naryDiamonds?.length > 0);
    
    if (hasExtendedSelection) {
      const totalElements = (multiSelectedElements.nodes?.length || 0) + 
                           (multiSelectedElements.relationPoints?.length || 0) + 
                           (multiSelectedElements.naryDiamonds?.length || 0);
      const diamondInSelection = multiSelectedElements.naryDiamonds?.find(nd => 
        nd.relationId === relationId);
      
      if (totalElements > 1 && diamondInSelection) {
        setMultiDragStart({
          type: 'extended',
          startX: e.clientX,
          startY: e.clientY,
          selectedElements: {
            nodes: multiSelectedElements.nodes?.map(n => ({ id: n.id, x: n.x, y: n.y })) || [],
            relationPoints: multiSelectedElements.relationPoints?.map(rp => ({ 
              relationId: rp.relationId, 
              waypointIndex: rp.waypointIndex, 
              x: rp.x, 
              y: rp.y 
            })) || [],
            naryDiamonds: multiSelectedElements.naryDiamonds?.map(nd => ({ 
              relationId: nd.relationId, 
              x: nd.x, 
              y: nd.y 
            })) || []
          }
        });
        e.stopPropagation();
        return;
      }
    }
  
    if (mode !== 'hand') return;
    e.stopPropagation();
    
    const relation = diagram?.relations?.find(r => r.id === relationId);
    if (!relation) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    setDraggedDiamond({
      relationId: relation.id,
      startX,
      startY,
      originalPos: { ...relation.diamondPos }
    });
  };

  const handleWaypointDrag = (relationId, waypoints, updatedRelations) => {
    if (!relationId) return;
    
    requestAnimationFrame(() => {
      if (updatedRelations && diagram && Array.isArray(diagram.relations)) {
        const mergedRelations = diagram.relations.map(rel => {
          const updatedRel = updatedRelations.find(r => r.id === rel.id);
          return updatedRel || rel;
        });
        onRelationEdit && onRelationEdit(mergedRelations);
        return;
      }
      if (diagram && Array.isArray(diagram.relations)) {
        const relationToUpdate = diagram.relations.find(rel => rel.id === relationId);
        if (!relationToUpdate) return;
        const updatedRelation = {
          ...relationToUpdate,
          waypoints: waypoints
        };
        const updatedRelationsList = diagram.relations.map(rel =>
          rel.id === relationId ? updatedRelation : rel
        );
        onRelationEdit && onRelationEdit(updatedRelationsList);
      }
    });
  };

  const handleWaypointDragEnd = (relationId, isLabelDrag = false, prevWaypoints = null) => {
    if (!relationId) return;
    if (typeof onRelationEdit === 'function' && diagram && Array.isArray(diagram.relations)) {
      const relation = diagram.relations.find(r => r.id === relationId);
      const updatedRelations = diagram.relations.map(r =>
        r.id === relationId ? relation : r
      );
      onRelationEdit(updatedRelations);
    }
  };

  const handleAlignmentCheck = (point, relationId = null) => {
    if (diagram && Array.isArray(diagram.nodes) && Array.isArray(diagram.relations)) {
      const guides = getAlignmentGuidesForPoint(point, diagram.nodes, diagram.relations);
      setAlignmentGuides(guides);
    }
  };

  function renderAlignmentGuides() {
    return renderAlignmentGuidesSVG(alignmentGuides, zoom);
  }

  const renderDiagramElementsWrapper = () => {
    return renderDiagramElements({
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
      setConnectFromNodeMenu,
      setRelationCreationState,
      setRelationMouse,
      onNaryRelationClick,
      getNodeCenter,
      getNodeEdgePoint,
      renderAlignmentGuides,
      narySelectedNodes
    });
  };

  const handleMouseMoveWrapper = (e) => {
    if (draggedElement && diagram && Array.isArray(diagram.nodes) && Array.isArray(diagram.relations)) {
      const deltaX = (e.clientX - draggedElement.startX) / zoom;
      const deltaY = (e.clientY - draggedElement.startY) / zoom;
      
      const newPosition = {
        x: draggedElement.elementX + deltaX,
        y: draggedElement.elementY + deltaY
      };
      
      const otherNodes = diagram.nodes.filter(n => n.id !== draggedElement.id);
      const guides = getAlignmentGuidesForPoint(newPosition, otherNodes, diagram.relations);
      setAlignmentGuides(guides);
    }

    handleCanvasMouseMove({
      e,
      isPanning,
      handlePanMove,
      lassoActive,
      lassoStart,
      lassoStartedOnCanvas,
      multiDragStart,
      diagram,
      zoom,
      onNodeEdit,
      onRelationEdit,
      draggedElement,
      setAlignmentGuides,
      setMousePosition,
      setRelationMouse,
      mode,
      relationCreationState,
      selectionBox,
      onSelectionMouseMove,
      svgRef,
      canvasOffset,
      setLassoBox,
      props,
      setMultiDragStart,
      getDiagram
    });
  };

  const handleMouseUpWrapper = (e) => {
    handleCanvasMouseUp({
      e,
      lassoActive,
      lassoStart,
      lassoStartedOnCanvas,
      multiDragStart,
      diagram,
      zoom,
      onNodeEdit,
      onRelationEdit,
      commandStack,
      setDiagram,
      isPanning,
      handlePanEnd,
      draggedElement,
      setDraggedElement,
      connectFromNodeMenu,
      setConnectFromNodeMenu,
      setAlignmentGuides,
      lassoBox,
      setLassoStart,
      setLassoBox,
      props,
      setMultiDragStart,
      getDiagram
    });
  };

  const handleCanvasClick = (e) => {
    if (!e.target.classList.contains('condec-canvas')) {
      return;
    }

    if (e.button === 0) {
      if (mode !== 'select' && props.setMode) {
        props.setMode('hand');
      }

      if (relationCreationState.active) {
        setRelationCreationState({
          active: false,
          sourceNode: null,
          sourceId: null,
          tempWaypoints: null
        });
        setRelationMouse(null);
        return;
      }

      if (connectFromNodeMenu) {
        setConnectFromNodeMenu(null);
        return;
      }

      if (props.setNaryStartNode) {
        props.setNaryStartNode(null);
      }
      if (props.setNaryMouse) {
        props.setNaryMouse(null);
      }

      if (mode === 'select') {
        return;
      }

      if (props.setMultiSelectedNodes && multiSelectedNodes && multiSelectedNodes.length > 0) {
        props.setMultiSelectedNodes([]);
      }

      if (selectedElement && props.onSelectElement) {
        props.onSelectElement(null);
      }

      if (getConnectModeState().isActive) {
        endConnectMode();
        return;
      }
    }

    if (onCanvasClick) onCanvasClick(e);
  };

  const handleCanvasMouseDownWrapper = (e) => {
    handleCanvasMouseDown({
      e,
      mode,
      handlePanStart,
      lassoActive,
      svgRef,
      canvasOffset,
      zoom,
      setLassoStart,
      setLassoBox,
      lassoStartedOnCanvas,
      props
    });
  };

  useEffect(() => {
    if (!draggedDiamond || !diagram || !Array.isArray(diagram.relations)) return;
    
    let animationFrameId = null;
    let pendingUpdate = null;
    
    const handleMouseMove = (e) => {
      const deltaX = (e.clientX - draggedDiamond.startX) / zoom;
      const deltaY = (e.clientY - draggedDiamond.startY) / zoom;
      const newPos = {
        x: draggedDiamond.originalPos.x + deltaX,
        y: draggedDiamond.originalPos.y + deltaY
      };
      
      if (diagram && Array.isArray(diagram.nodes) && Array.isArray(diagram.relations)) {
        const otherRelations = diagram.relations.filter(r => r.id !== draggedDiamond.relationId);
        const guides = getAlignmentGuidesForPoint(newPos, diagram.nodes, otherRelations);
        setAlignmentGuides(guides);
        
        if (guides.x !== null) newPos.x = guides.x;
        if (guides.y !== null) newPos.y = guides.y;
      }
      
      pendingUpdate = {
        relationId: draggedDiamond.relationId,
        newPos: newPos
      };
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        if (pendingUpdate && onRelationEdit) {
          const updatedRelations = diagram.relations.map(r =>
            r.id === pendingUpdate.relationId
              ? { ...r, diamondPos: pendingUpdate.newPos }
              : r
          );
          onRelationEdit(updatedRelations);
          pendingUpdate = null;
        }
      });
    };
    
    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      
      if (pendingUpdate && onRelationEdit) {
        const updatedRelations = diagram.relations.map(r =>
          r.id === pendingUpdate.relationId
            ? { ...r, diamondPos: pendingUpdate.newPos }
            : r
        );
        onRelationEdit(updatedRelations);
        pendingUpdate = null;
      }
      
      setDraggedDiamond(null);
      setAlignmentGuides({ x: null, y: null });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [draggedDiamond, diagram, onRelationEdit, zoom]);

  const renderHologramNodeWrapper = () => {
    return renderHologramNode({
      mode: props.mode,
      hologramNodePosition: props.hologramNodePosition,
      diagram,
      zoom
    });
  };

  let cursorStyle = 'default';
  if (mode === 'hand') {
    cursorStyle = isPanning ? 'grabbing' : (draggedElement ? 'grabbing' : 'grab');
  } else if (mode === 'select') {
    cursorStyle = 'crosshair';
  } else if (mode === 'addRelation') {
    cursorStyle = relationCreationState.active ? 'crosshair' : 'pointer';
  } else if (mode === 'connectFromNodeMenu') {
    cursorStyle = connectFromNodeMenu ? 'crosshair' : 'pointer';
  } else if (props.mode === 'addActivity') {
    cursorStyle = 'crosshair';
  }

  return (
    <div className="condec-canvas-container" style={{ flex: 1, position: 'relative' }}>
      {(mode === 'nary') && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(25, 118, 210, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 1000,
            pointerEvents: 'none',
            fontSize: '14px'
          }}
        >
          {!naryStartNode
            ? 'Select 2 or more Activities to create a new choice constraint, then press on te canvas to place it'
            : 'Click on a relation to create a new choice constraint or click on an existing choice constraint to add activities'}
        </div>
      )}
      {(connectFromNodeMenu || relationCreationState.active) && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(25, 118, 210, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 1000,
            pointerEvents: 'none',
            fontSize: '14px'
          }}
        >
          {relationCreationState.active ? 
            "Click on a target node to create relation or click on canvas to cancel" :
            "Click on a target node to create relation or click on empty space to cancel"}
        </div>
      )}
      
      <svg
        ref={svgRef}
        className="condec-canvas"
        width="100%"
        height="100%"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMoveWrapper}
        onMouseUp={handleMouseUpWrapper}
        onMouseDown={handleCanvasMouseDownWrapper}
        onWheel={onCanvasWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: cursorStyle, userSelect: 'none' }}
      >
        <RelationMarkers key={`markers-${refreshKey}`} />
        <g key={`main-group-${refreshKey}`} transform={`translate(${canvasOffset.x},${canvasOffset.y}) scale(${zoom})`}>
          {alignmentGuides.x !== null && (
            <line
              x1={alignmentGuides.x}
              y1={-10000}
              x2={alignmentGuides.x}
              y2={10000}
              stroke="#1976d2"
              strokeWidth={1.5/zoom}
              strokeDasharray="4,2"
              pointerEvents="none"
            />
          )}
          {alignmentGuides.y !== null && (
            <line
              x1={-10000}
              y1={alignmentGuides.y}
              x2={10000}
              y2={alignmentGuides.y}
              stroke="#1976d2"
              strokeWidth={1.5/zoom}
              strokeDasharray="4,2"
              pointerEvents="none"
            />
          )}
        {renderDiagramElementsWrapper()}
        {renderHologramNodeWrapper()}
        {renderMultiSelectBoundingBox({ multiSelectedNodes, multiSelectedElements, zoom, diagram, multiDragStart })}
        {renderMultiSelectMenu({ multiSelectedNodes, multiSelectedElements, props, zoom, diagram, multiDragStart })}
        {mode === 'select' && selectionBox && (
          <rect
            x={selectionBox.x}
            y={selectionBox.y}
            width={selectionBox.width}
            height={selectionBox.height}
            fill="rgba(66, 133, 244, 0.1)"
            stroke="#4285f4"
            strokeWidth={1/zoom}
            strokeDasharray={`${4/zoom},${2/zoom}`}
            pointerEvents="none"
          />
        )}
        {renderLassoNode(lassoBox, zoom)}
        </g>
      </svg>
    </div>
  );
});