import { getAllSelectableElementsInBox } from './multiSelectionUtils';

/**
 * @param {Object} params
 * @param {Event} params.e
 * @param {boolean} params.lassoActive
 * @param {Object} params.svgRef
 * @param {Object} params.canvasOffset
 * @param {number} params.zoom
 * @param {Function} params.setLassoStart
 * @param {Function} params.setLassoBox
 * @param {Object} params.lassoStartedOnCanvas
 * @param {Object} params.props
 */
export function handleLassoMouseDown({ e, lassoActive, svgRef, canvasOffset, zoom, setLassoStart, setLassoBox, lassoStartedOnCanvas, props }) {
  if (!lassoActive) return;
  if (e.button !== 0) return;
  if (!e.target.classList.contains('condec-canvas')) return;
  const rect = svgRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
  const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
  setLassoStart({ x, y });
  setLassoBox({ x, y, width: 0, height: 0 });
  lassoStartedOnCanvas.current = true;
  if (props.setSelectionBox) props.setSelectionBox(null);
  if (props.setMultiSelectedNodes) props.setMultiSelectedNodes([]);
  e.stopPropagation();
}

/**
 * @param {Object} params 
 * @param {Event} params.e 
 * @param {boolean} params.lassoActive 
 * @param {Object} params.lassoStart 
 * @param {Object} params.lassoStartedOnCanvas 
 * @param {Object} params.svgRef 
 * @param {Object} params.canvasOffset
 * @param {number} params.zoom
 * @param {Function} params.setLassoBox
 * @param {Object} params.props
 */
export function handleLassoMouseMove({ e, lassoActive, lassoStart, lassoStartedOnCanvas, svgRef, canvasOffset, zoom, setLassoBox, diagram, props }) {
  if (!lassoActive || !lassoStart || !lassoStartedOnCanvas.current) return;
  const rect = svgRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
  const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
  const box = {
    x: Math.min(lassoStart.x, x),
    y: Math.min(lassoStart.y, y),
    width: Math.abs(x - lassoStart.x),
    height: Math.abs(y - lassoStart.y)
  };
  setLassoBox(box);
  if (props.setSelectionBox) props.setSelectionBox(box);
  if (props.setMultiSelectedNodes && diagram?.nodes && diagram?.relations) {
    const selectedElements = getAllSelectableElementsInBox(diagram.nodes, diagram.relations, box);
    props.setMultiSelectedNodes(selectedElements.nodes);
    if (props.setMultiSelectedElements) {
      props.setMultiSelectedElements(selectedElements);
    }
  }
  
  e.stopPropagation();
}

/**
 * @param {Object} params
 * @param {Event} params.e
 * @param {boolean} params.lassoActive 
 * @param {Object} params.lassoStart 
 * @param {Object} params.lassoStartedOnCanvas 
 * @param {Object} params.lassoBox 
 * @param {Function} params.setLassoStart 
 * @param {Function} params.setLassoBox 
 * @param {Object} params.diagram
 * @param {Object} params.props
 */
export function handleLassoMouseUp({ e, lassoActive, lassoStart, lassoStartedOnCanvas, lassoBox, setLassoStart, setLassoBox, diagram, props }) {
  if (!lassoActive || !lassoStart || !lassoStartedOnCanvas.current) {
    setLassoStart(null);
    setLassoBox(null);
    lassoStartedOnCanvas.current = false;
    return;
  }

  const finalizedBox = lassoBox;
  setLassoStart(null);
  setLassoBox(null);
  lassoStartedOnCanvas.current = false;
  if (props.setSelectionBox) props.setSelectionBox(null);
  if (props.setMultiSelectedNodes && diagram?.nodes && diagram?.relations && finalizedBox) {
    const selectedElements = getAllSelectableElementsInBox(diagram.nodes, diagram.relations, finalizedBox);
    props.setMultiSelectedNodes(selectedElements.nodes);
    if (props.setMultiSelectedElements) {
      props.setMultiSelectedElements(selectedElements);
    }
  }
}

/**
 * @param {Object} lassoBox
 * @param {number} zoom 
 * @returns {JSX.Element|null}
 */
export function renderLassoBox(lassoBox, zoom) {
  if (!lassoBox) return null;
  return (
    <rect
      x={lassoBox.x}
      y={lassoBox.y}
      width={lassoBox.width}
      height={lassoBox.height}
      fill="rgba(66, 133, 244, 0.1)"
      stroke="#4285f4"
      strokeWidth={1/zoom}
      strokeDasharray={`${4/zoom},${2/zoom}`}
      pointerEvents="none"
    />
  );
}