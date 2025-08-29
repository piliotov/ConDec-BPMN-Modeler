import { updateRelationsForNode } from '../relations/relationUtils';
import { getAlignmentGuides } from './index';
import { MoveNodeCommand } from '../commands/DiagramCommands';
import { 
  handleLassoMouseDown, 
  handleLassoMouseMove, 
  handleLassoMouseUp 
} from './lassoUtils';
import { 
  handleExtendedMultiDragMove, 
  handleTraditionalMultiDragMove,
  handleExtendedMultiDragUp,
  handleTraditionalMultiDragUp
} from './multiDragUtils';

/**
 * @param {Object} params
 * @param {Event} params.e 
 * @param {boolean} params.isPanning 
 * @param {Function} params.handlePanMove 
 * @param {boolean} params.lassoActive 
 * @param {Object} params.lassoStart 
 * @param {Object} params.lassoStartedOnCanvas 
 * @param {Object} params.multiDragStart 
 * @param {Object} params.diagram 
 * @param {number} params.zoom 
 * @param {Function} params.onNodeEdit 
 * @param {Function} params.onRelationEdit 
 * @param {Object} params.draggedElement 
 * @param {Function} params.setAlignmentGuides 
 * @param {Function} params.setMousePosition 
 * @param {Function} params.setRelationMouse 
 * @param {string} params.mode 
 * @param {Object} params.relationCreationState 
 * @param {Object} params.selectionBox 
 * @param {Function} params.onSelectionMouseMove 
 * @param {Object} params.svgRef 
 * @param {Object} params.canvasOffset 
 * @param {Function} params.setLassoBox 
 * @param {Object} params.props 
 * @param {Function} params.setMultiDragStart 
 */
export function handleCanvasMouseMove({
  e, isPanning, handlePanMove, lassoActive, lassoStart, lassoStartedOnCanvas,
  multiDragStart, diagram, zoom, onNodeEdit, onRelationEdit, draggedElement,
  setAlignmentGuides, setMousePosition, setRelationMouse, mode, relationCreationState,
  selectionBox, onSelectionMouseMove, svgRef, canvasOffset, setLassoBox, props,
  setMultiDragStart
}) {
    if (isPanning) {
    handlePanMove(e);
    return;
  }
  if (lassoActive && lassoStart && lassoStartedOnCanvas.current) {
    handleLassoMouseMove({
      e, lassoActive, lassoStart, lassoStartedOnCanvas, svgRef, canvasOffset,
      zoom, setLassoBox, diagram, props
    });
    return;
  }
  
  if (multiDragStart && diagram && Array.isArray(diagram.nodes)) {
    if (multiDragStart.type === 'extended' && multiDragStart.selectedElements) {
      handleExtendedMultiDragMove({
        multiDragStart, diagram, zoom, e, onNodeEdit, onRelationEdit, setMultiDragStart
      });
    }
    else if (multiDragStart.nodePositions) {
      handleTraditionalMultiDragMove({
        multiDragStart, diagram, zoom, e, onNodeEdit, onRelationEdit, setMultiDragStart
      });
    }
    return;
  }
  
  if (draggedElement && diagram && Array.isArray(diagram.nodes)) {
    const deltaX = (e.clientX - draggedElement.startX) / zoom;
    const deltaY = (e.clientY - draggedElement.startY) / zoom;
    const updatedNodes = diagram.nodes.map(node => {
      if (node.id === draggedElement.id) {
        return {
          ...node,
          x: draggedElement.elementX + deltaX,
          y: draggedElement.elementY + deltaY
        };
      }
      return node;
    });
    const draggedNode = updatedNodes.find(node => node.id === draggedElement.id);
    const updatedRelations = updateRelationsForNode(draggedNode, { ...diagram, nodes: updatedNodes });
    if (typeof onNodeEdit === 'function') {
      requestAnimationFrame(() => {
        onNodeEdit(updatedNodes);
      });
    }
    if (typeof onRelationEdit === 'function') {
      requestAnimationFrame(() => {
        onRelationEdit(updatedRelations);
      });
    }
    const guides = getAlignmentGuides(draggedNode, updatedNodes);
    setAlignmentGuides(guides);
  } else {
    setAlignmentGuides({ x: null, y: null });
    const rect = svgRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    if (((mode === 'addRelation' && relationCreationState.active) || 
         mode === 'connectFromNodeMenu') && !draggedElement) {
      setMousePosition({ x: currentX, y: currentY });
    }
    if (mode === 'addRelation' && relationCreationState.active && !draggedElement) {
      setRelationMouse({ x: currentX, y: currentY });
    }
    if (mode === 'select' && selectionBox) {
      onSelectionMouseMove && onSelectionMouseMove(e);
    }
  }
  if (props.onCanvasMouseMove) {
    props.onCanvasMouseMove(e);
  }
}

/**
 * @param {Object} params
 * @param {Event} params.e 
 * @param {boolean} params.lassoActive 
 * @param {Object} params.lassoStart 
 * @param {Object} params.lassoStartedOnCanvas 
 * @param {Object} params.multiDragStart 
 * @param {Object} params.diagram 
 * @param {number} params.zoom 
 * @param {Function} params.onNodeEdit 
 * @param {Function} params.onRelationEdit 
 * @param {Object} params.commandStack
 * @param {Function} params.setDiagram 
 * @param {boolean} params.isPanning 
 * @param {Function} params.handlePanEnd 
 * @param {Object} params.draggedElement 
 * @param {Function} params.setDraggedElement 
 * @param {Object} params.connectFromNodeMenu 
 * @param {Function} params.setConnectFromNodeMenu 
 * @param {Function} params.setAlignmentGuides 
 * @param {Object} params.lassoBox 
 * @param {Function} params.setLassoStart 
 * @param {Function} params.setLassoBox 
 * @param {Object} params.props 
 * @param {Function} params.setMultiDragStart 
 */
export function handleCanvasMouseUp({
  e,lassoActive,lassoStart,lassoStartedOnCanvas,multiDragStart,diagram,zoom,onNodeEdit,onRelationEdit,commandStack,setDiagram,isPanning,handlePanEnd,draggedElement,setDraggedElement,connectFromNodeMenu,setConnectFromNodeMenu,setAlignmentGuides,lassoBox,setLassoStart,setLassoBox,props,setMultiDragStart,getDiagram
}) {
  if (lassoActive && lassoStart && lassoStartedOnCanvas.current) {
    handleLassoMouseUp({
      e, lassoActive, lassoStart, lassoStartedOnCanvas, lassoBox,
      setLassoStart, setLassoBox, diagram, props
    });
    return;
  }
  
  if (multiDragStart && diagram && Array.isArray(diagram.nodes)) {
    if (multiDragStart.type === 'extended' && multiDragStart.selectedElements) {
      handleExtendedMultiDragUp({
        multiDragStart, diagram, zoom, onNodeEdit, onRelationEdit, commandStack, setDiagram, props, getDiagram
      });
    }
    else if (multiDragStart.nodePositions) {
      handleTraditionalMultiDragUp({
        multiDragStart, diagram, zoom, onNodeEdit, commandStack, setDiagram, props, getDiagram
      });
    }
    setMultiDragStart(null);
    return;
  }
  
  if (isPanning) {
    handlePanEnd();
  }
  if (draggedElement && draggedElement.id) {
    const deltaX = (e.clientX - draggedElement.startX) / zoom;
    const deltaY = (e.clientY - draggedElement.startY) / zoom;
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      const newPosition = {
        x: draggedElement.elementX + deltaX,
        y: draggedElement.elementY + deltaY
      };
      if (commandStack && setDiagram && getDiagram) {
        const command = new MoveNodeCommand(
          draggedElement.id,
          newPosition,
          getDiagram,
          setDiagram,
          draggedElement.originalPosition
        );
        commandStack.execute(command);
      }
    }
    setDraggedElement(null);
    setAlignmentGuides({ x: null, y: null });
    return;
  }
  if (connectFromNodeMenu && connectFromNodeMenu.sourceId) {
    const targetElement = e.target.closest('.condec-node');
    if (targetElement) {
      const targetId = targetElement.getAttribute('data-node-id');
      if (targetId && targetId !== connectFromNodeMenu.sourceId) {
        props.onRelationCreate && props.onRelationCreate(connectFromNodeMenu.sourceId, targetId);
      }
    }
    setConnectFromNodeMenu(null);
    if (props.setMode) props.setMode('hand');
  }
  setAlignmentGuides({ x: null, y: null });
}

/**
 * @param {Object} params 
 * @param {Event} params.e 
 * @param {string} params.mode 
 * @param {Function} params.handlePanStart 
 * @param {boolean} params.lassoActive 
 * @param {Object} params.svgRef 
 * @param {Object} params.canvasOffset 
 * @param {number} params.zoom 
 * @param {Function} params.setLassoStart 
 * @param {Function} params.setLassoBox 
 * @param {Object} params.lassoStartedOnCanvas 
 * @param {Object} params.props 
 */
export function handleCanvasMouseDown({
  e, mode, handlePanStart, lassoActive, svgRef, canvasOffset, zoom,
  setLassoStart, setLassoBox, lassoStartedOnCanvas, props
}) {
  if (mode === 'hand' && e.button === 0 && e.target.classList.contains('condec-canvas')) {
    handlePanStart(e);
    return;
  }
  
  if (mode === 'select' && lassoActive) {
    handleLassoMouseDown({
      e, lassoActive, svgRef, canvasOffset, zoom, setLassoStart, setLassoBox,
      lassoStartedOnCanvas, props
    });
    return;
  }
  
  if (props.onCanvasMouseDown) {
    props.onCanvasMouseDown(e);
  }
}
