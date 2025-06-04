import { getBoundingBoxForMultiSelectedNodes, getBoundingBoxForMixedSelection } from './multiSelectionUtils';
import { getAlignmentGuidesForPoint, renderAlignmentGuidesSVG } from './alignmentUtils';
export function renderMultiSelectBoundingBox({ multiSelectedNodes, multiSelectedElements, zoom, diagram, multiDragStart }) {
  const hasExtendedSelection = multiSelectedElements && 
    (multiSelectedElements.relationPoints?.length > 0 || multiSelectedElements.naryDiamonds?.length > 0);
  if (hasExtendedSelection) {
    const totalElements = (multiSelectedElements.nodes?.length || 0) + 
                         (multiSelectedElements.relationPoints?.length || 0) + 
                         (multiSelectedElements.naryDiamonds?.length || 0);
    if (totalElements < 2) return null;
    let elementsToUse = multiSelectedElements;
    if (multiDragStart && diagram?.nodes && diagram?.relations) {
      elementsToUse = {
        ...multiSelectedElements,
        nodes: multiSelectedElements.nodes?.map(selectedNode => {
          const currentNode = diagram.nodes.find(n => n.id === selectedNode.id);
          return currentNode || selectedNode;
        }) || [],
        naryDiamonds: multiSelectedElements.naryDiamonds?.map(selectedDiamond => {
          const currentRelation = diagram.relations.find(r => r.id === selectedDiamond.relationId);
          return currentRelation?.diamondPos ? 
            { ...selectedDiamond, x: currentRelation.diamondPos.x, y: currentRelation.diamondPos.y } :
            selectedDiamond;
        }) || []
      };
    }
    const box = getBoundingBoxForMixedSelection(elementsToUse);
    if (!box) return null;
    return (
      <g className="multi-select-bounding-box">
        <rect
          x={box.x - 10}
          y={box.y - 10}
          width={box.width + 20}
          height={box.height + 20}
          fill="transparent"
          stroke="#4285f4"
          strokeWidth={2/zoom}
          strokeDasharray={`${4/zoom},${2/zoom}`}
          rx={8/zoom}
          pointerEvents="none"
        />
      </g>
    );
  } else {
    if (!multiSelectedNodes || multiSelectedNodes.length < 2) return null;
    let nodesToUse = multiSelectedNodes;
    if (multiDragStart && diagram?.nodes) {
      nodesToUse = multiSelectedNodes.map(selectedNode => {
        const currentNode = diagram.nodes.find(n => n.id === selectedNode.id);
        return currentNode || selectedNode;
      });
    }
    const box = getBoundingBoxForMultiSelectedNodes(nodesToUse);
    if (!box) return null;
    return (
      <g className="multi-select-bounding-box">
        <rect
          x={box.x - 10}
          y={box.y - 10}
          width={box.width + 20}
          height={box.height + 20}
          fill="transparent"
          stroke="#4285f4"
          strokeWidth={2/zoom}
          strokeDasharray={`${4/zoom},${2/zoom}`}
          rx={8/zoom}
          pointerEvents="none"
        />
      </g>
    );
  }
}
export function renderMultiSelectMenu({ multiSelectedNodes, multiSelectedElements, props, diagram, multiDragStart }) {
  const hasExtendedSelection = multiSelectedElements && 
    (multiSelectedElements.relationPoints?.length > 0 || multiSelectedElements.naryDiamonds?.length > 0);
  let box, totalElements;
  if (hasExtendedSelection) {
    totalElements = (multiSelectedElements.nodes?.length || 0) + 
                   (multiSelectedElements.relationPoints?.length || 0) + 
                   (multiSelectedElements.naryDiamonds?.length || 0);
    if (totalElements < 2) return null;
    let elementsToUse = multiSelectedElements;
    if (multiDragStart && diagram?.nodes && diagram?.relations) {
      elementsToUse = {
        ...multiSelectedElements,
        nodes: multiSelectedElements.nodes?.map(selectedNode => {
          const currentNode = diagram.nodes.find(n => n.id === selectedNode.id);
          return currentNode || selectedNode;
        }) || [],
        naryDiamonds: multiSelectedElements.naryDiamonds?.map(selectedDiamond => {
          const currentRelation = diagram.relations.find(r => r.id === selectedDiamond.relationId);
          return currentRelation?.diamondPos ? 
            { ...selectedDiamond, x: currentRelation.diamondPos.x, y: currentRelation.diamondPos.y } :
            selectedDiamond;
        }) || []
      };
    }
    box = getBoundingBoxForMixedSelection(elementsToUse);
  } else {
    if (!multiSelectedNodes || multiSelectedNodes.length < 2) return null;
    let nodesToUse = multiSelectedNodes;
    if (multiDragStart && diagram?.nodes) {
      nodesToUse = multiSelectedNodes.map(selectedNode => {
        const currentNode = diagram.nodes.find(n => n.id === selectedNode.id);
        return currentNode || selectedNode;
      });
    }
    box = getBoundingBoxForMultiSelectedNodes(nodesToUse);
  }
  if (!box) return null;
  const menuX = box.x + box.width + 18;
  const menuY = box.y - 32;
  function handleDeleteAll() {
    if (hasExtendedSelection) {
      if (typeof props.onDeleteMultiSelectedExtended === 'function') {
        props.onDeleteMultiSelectedExtended(multiSelectedElements);
      } else if (typeof props.onDeleteMultiSelected === 'function' && multiSelectedElements.nodes?.length > 0) {
        props.onDeleteMultiSelected(multiSelectedElements.nodes);
      }
    } else {
      if (typeof props.onDeleteMultiSelected === 'function') {
        props.onDeleteMultiSelected(multiSelectedNodes);
      }
    }
  }
  return (
    <foreignObject x={menuX} y={menuY} width={40} height={40} style={{ overflow: 'visible' }}>
      <div style={{
        background: 'none',
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
        padding: 0,
        color: '#1976d2',
        fontWeight: 500,
        fontSize: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 1000
      }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            borderRadius: 4,
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 4
          }}
          onClick={handleDeleteAll}
          tabIndex={0}
          title="Delete selected nodes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048"><path fill="currentColor" d="m387.16 644.33l128.932 1231.742h1024.733l118.83-1231.51h-1272.5zm144.374 130.007h985.481l-94.107 971.506h-789.33z"/><path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.344" d="m7.033 1040.98l.944 7.503m5.013-7.503l-.943 7.503" transform="matrix(96.7529 0 0 87.18526 55.328 -89814.987)"/><path fill="currentColor" d="M758.125 337.314L343.5 458.662v60.722h1361v-60.722l-419.687-121.348z"/><path fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="69.952" d="M793.259 211.429h461.482v168.06H793.26z"/></svg>
        </button>
      </div>
    </foreignObject>
  );
}
export function renderHologramNode({ mode, hologramNodePosition, diagram, zoom }) {
  if (mode !== 'addActivity' || !hologramNodePosition) return null;
  const guides = getAlignmentGuidesForPoint(hologramNodePosition, diagram?.nodes || []);
  const hologramPos = hologramNodePosition;
  const defaultWidth = 100;
  const defaultHeight = 50;
  return (
    <g className="hologram-node" style={{ pointerEvents: 'none' }}>
      {renderAlignmentGuidesSVG(guides, zoom)}
      <rect
        x={hologramPos.x - defaultWidth/2}
        y={hologramPos.y - defaultHeight/2}
        width={defaultWidth}
        height={defaultHeight}
        fill="rgba(26, 115, 232, 0.2)"
        stroke="#1a73e8"
        strokeWidth={2}
        strokeDasharray="5,5"
        rx={8}
        ry={8}
      />
      <text
        x={hologramPos.x}
        y={hologramPos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14px"
        fill="#1a73e8"
        style={{ userSelect: 'none' }}
      >
        New Activity
      </text>
    </g>
  );
}
export function renderLassoNode(node, zoom = 1) {
  if (!node) return null;
  return (
    <g
      key={`lasso-node-${node.id}`}
      className="lasso-node"
      transform={`translate(${node.x}, ${node.y})`}
    >
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="#1976d2"
        fontWeight="600"
        pointerEvents="none"
      >
        {node.name || ''}
      </text>
    </g>
  );
}
