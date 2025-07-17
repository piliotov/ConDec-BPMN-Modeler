import  { useEffect, useState, useCallback, useRef } from 'react';
import '../styles/ConDecModeler.css';
import '../styles/ModelerButtons.css';
import { ConDecCanvas } from './ConDecCanvas';
import { snapNodeDuringDrag } from '../utils/modeler/gridUtil';
import { initialDiagram } from '../utils/modeler/diagramUtils';
import { isRelationAllowed, RELATION_TYPES } from '../utils/relations/relationUtils';
import { addNode } from '../utils/node/nodeUtils';
import { appendActivityAndConnect } from '../utils/modeler/append-action';
import RelationEditMenu from './RelationEditMenu';
import { NodeEditMenu } from './NodeEditMenu';
import { calculateNodeEditMenuPosition } from '../utils/menu/menuPositioningUtils';
import { importDeclareTxtWithLayout, importDeclareXmlWithLayout, importDeclareJsonWithLayout } from '../utils/modeler/declareImportUtils';
import { NaryRelationEditMenu } from './NaryRelationEditMenu';
import { CommandStack } from '../utils/commands/CommandStack';
import { 
  DeleteNodeCommand, 
  UpdateNodeCommand,
  CreateRelationCommand,
  CreateNaryFromBinaryCommand,
  DeleteRelationCommand,
  AppendActivityCommand,
  ImportDiagramCommand,
  MoveNodeCommand,
  DeleteMultipleNodesCommand
} from '../utils/commands/DiagramCommands';

const LOCAL_STORAGE_KEY = 'condec-diagram';

const ConDecModeler = ({ width = '100%', height = '100%', style = {}, loadedFile }) => {

  const [diagram, setDiagram] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [newRelation, setNewRelation] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('hand');
  const [editNodePopup, setEditNodePopup] = useState(null);
  const [editNodePopupPos, setEditNodePopupPos] = useState({ x: null, y: null });
  const [draggingEditPopup, setDraggingEditPopup] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [multiSelectedNodes, setMultiSelectedNodes] = useState([]);
  const [multiSelectedElements, setMultiSelectedElements] = useState({ nodes: [], relationPoints: [], naryDiamonds: [] });
  const [naryStartNode, setNaryStartNode] = useState(null);
  const [naryMouse, setNaryMouse] = useState(null);
  const [hologramNodePosition, setHologramNodePosition] = useState(null);
  const [editMenuSize, setEditMenuSize] = useState({ width: 320, height: 430 });

  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);

  const [narySelectedNodes, setNarySelectedNodes] = useState([]);
  const [naryDiamondPos, setNaryDiamondPos] = useState(null);

  const handleMenuSizeChange = useCallback((size) => {
    if (size && size.width && size.height) {
      setEditMenuSize(size);
      if (editNodePopup && editNodePopup.node) {
        const newPos = calculateNodeEditMenuPosition(
          editNodePopup.node, 
          zoom, 
          canvasOffset, 
          canvasRef, 
          size
        );
        setEditNodePopupPos(newPos);
      }
    }
  }, [editNodePopup, zoom, canvasOffset]);

  const canvasRef = useRef(null);
  const importBtnRef = useRef(null);
  
  const commandStackRef = useRef(new CommandStack());

  const wrapperStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    flex: 1,
    position: 'relative',
    background: '#fff'
  };

  useEffect(() => {
    window.condecDiagramForValidation = diagram;
    return () => { window.condecDiagramForValidation = undefined; };
  }, [diagram]);

  const renderPalette = () => (
    <div
      className="condec-palette condec-palette-left"
      style={{
        position: 'absolute',
        left: '18px',
        top: '18px',
        width: '48px',
        background: '#f3f4f7',
        border: '1px solid #b0b8c1',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(24,49,83,0.10)',
        zIndex: 20,
        padding: '6px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: 'auto'
      }}
    >
      <div
        className="palette-group"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center',
          padding: 0
        }}
      >
        <div
          className={`palette-entry ${mode === 'hand' ? 'active' : ''}`}
          onClick={() => setMode('hand')}
          title="Hand Tool (H)"
          style={{
            cursor: 'pointer',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            margin: 0,
            padding: 0
          }}
        >
          <svg width="26" height="26" viewBox="0 0 2000 2000" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="2000" height="2000" rx="8" fill="none"/>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000" width="2000" height="2000">
              <path fill="none" stroke={mode === 'hand' ? "#1976d2" : "#222"} strokeWidth="67.5" d="M806.673 1750.205h621.961c22.031-70.25 62.033-342.206 146.35-560.816c109.703-284.426 222.535-533.47 79.188-558.11c-114.053-22.16-164.268 222.17-239.25 378.398c0 0-.735-152.653-1.608-319.073c-.925-176.455 20.91-388.517-71.236-381.548c-95.054-6.969-102.434 176.632-127.533 313.704C1187.657 769.598 1163 921.667 1163 921.667s-25.608-129.884-43.734-309.888c-16.45-163.37-23.671-382.574-120.066-378.476c-114.205-4.098-91.583 212.301-89.508 386.42c1.627 136.477-3.108 300.727-3.108 300.727s-61.033-149.246-92.487-232.773c-62.058-160.334-116.378-320.83-230.62-269.78c-101.186 47.595-9.532 225.224 39.893 407.56c43.362 159.965 86.72 332.892 86.72 332.892s-293.095-367.544-429.6-246.644c-120.896 113.1 66.75 220.16 245.33 434.345c101.267 121.459 208.574 310.194 280.852 404.155z"/>
            </svg>
          </svg>
        </div>
        <div
          className={`palette-entry ${mode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
          title="Select Tool (S)"
          style={{
            cursor: 'pointer',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            margin: 0,
            padding: 0
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 2000 2000">
            <g fill="none" stroke={mode === 'select' ? "#1976d2" : "#222"}>
              <path strokeLinejoin="round" strokeWidth="205.238" d="M1304.97 699.019H868.856"/>
              <path strokeWidth="80" d="M1566.732 696.368h285.2v273.246m.001 592.034v273.247h-277.985m277.304-652.426v153.246m-1140.123 228.21v273.247h277.984m209.817 0h165.201"/>
              <path strokeLinejoin="round" strokeWidth="205.238" d="M708.49 104.8v436.115m0 323.815v436.114M545.042 699.019H108.927"/>
            </g>
          </svg>
        </div>
        <div
          className={`palette-entry ${mode === 'addRelation' ? 'active' : ''}`}
          onClick={() => setMode('addRelation')}
          title="Add Relation"
          style={{
            cursor: 'pointer',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            margin: 0,
            padding: 0
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 2048 2048">
            <path fill={mode === 'addRelation' ? "#1976d2" : "#222"} d="M1866.407 206.692s-585.454 298.724-882.844 438.406c63.707 58.178 122.963 120.927 184.437 181.407c-302.353 306.387-604.71 612.769-907.062 919.156c22.172 21.16 44.327 42.309 66.5 63.469c302.352-306.388 604.71-612.738 907.062-919.125c61.588 61.37 122.828 123.086 184.438 184.437c158.845-312.83 447.469-867.75 447.469-867.75z"/>
          </svg>
        </div>
        <div
          className={`palette-entry ${mode === 'addActivity' ? 'active' : ''}`}
          onClick={() => setMode('addActivity')}
          title="Add Activity"
          style={{
            cursor: 'pointer',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            margin: 0,
            padding: 0
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 2048 2048">
            <rect width="17.563" height="14.478" x="1.23" y="1035.052" fill="none" stroke={mode === 'addActivity' ? "#1976d2" : "#222"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.034" rx="2.759" transform="translate(55.328 -99820.702) scale(96.7529)"/>
          </svg>
        </div>
        <div
          className={`palette-entry ${mode === 'nary' ? 'active' : ''}`}
          onClick={() => {
            setMode('nary');
            setNaryStartNode(null);
            setNaryMouse(null);
            setNarySelectedNodes([]);
          }}
          title="N-ary (Choice) Relation"
          style={{
            cursor: 'pointer',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'transparent',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: 'none',
            margin: 0,
            padding: 0
          }}
        >
          <svg viewBox="0 0 56 56" width="26" height="26" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(90deg)' }}>
            <path d="M 27.9883 52 C 29.2774 52 29.9336 51.1328 31.2461 49.3516 L 45.2383 30.6719 C 45.8711 29.8047 46.2461 28.9375 46.2461 28 C 46.2461 27.0390 45.8711 26.1953 45.2383 25.3281 L 31.2461 6.6250 C 29.9336 4.8672 29.2774 4.0000 27.9883 4.0000 C 26.7227 4.0000 26.0664 4.8672 24.7539 6.6250 L 10.7617 25.3281 C 10.1289 26.1953 9.7539 27.0390 9.7539 28 C 9.7539 28.9375 10.1289 29.8047 10.7617 30.6719 L 24.7539 49.3516 C 26.0664 51.1328 26.7227 52 27.9883 52 Z M 27.9883 47.0547 C 27.8945 47.0547 27.8242 46.9844 27.7774 46.8672 L 14.2070 28.6328 C 13.9961 28.3750 13.9727 28.1875 13.9727 28 C 13.9727 27.8125 13.9961 27.6250 14.2070 27.3672 L 27.7774 9.1094 C 27.8242 9.0156 27.8945 8.9453 27.9883 8.9453 C 28.1055 8.9453 28.1758 9.0156 28.2227 9.1094 L 41.7930 27.3672 C 42.0039 27.6250 42.0274 27.8125 42.0274 28 C 42.0274 28.1875 42.0039 28.3750 41.7930 28.6328 L 28.2227 46.8672 C 28.1758 46.9844 28.1055 47.0547 27.9883 47.0547 Z"
              fill={mode === 'nary' ? "#1976d2" : "#222"}
            />
          </svg>
        </div>
      </div>
    </div>
  );

  const centerView = useCallback(() => {
    const container = document.querySelector('.condec-canvas-container');
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      setCanvasOffset({ 
        x: width * 0.15,
        y: height * 0.10
      });
    }
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.querySelector('.condec-canvas-container');
      if (container && !isCanvasInitialized) {
        centerView();
        setIsCanvasInitialized(true);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isCanvasInitialized, centerView]);

  useEffect(() => {
    if (loadedFile && loadedFile.fileType.startsWith('condec-')) {
      try {
        let diagram;
        if (loadedFile.fileType === 'condec-xml') {
          diagram = importDeclareXmlWithLayout(loadedFile.content);
        } else if (loadedFile.fileType === 'condec-txt') {
          diagram = importDeclareTxtWithLayout(loadedFile.content);
        } else if (loadedFile.fileType === 'condec-json') {
          diagram = importDeclareJsonWithLayout(loadedFile.content);
        }
        if (diagram) {
          setDiagram(diagram);
          setTimeout(() => centerView(), 100);
          return;
        }
      } catch (e) {
        console.error('Error loading file:', e);
        alert(`Error loading file: ${e.message}`);
      }
    }

    const savedDiagram = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDiagram) {
      try {
        setDiagram(JSON.parse(savedDiagram));
      } catch (e) {
        console.error('Error parsing saved diagram:', e);
        setDiagram(initialDiagram);
      }
    } else {
      setDiagram(initialDiagram);
    }
  }, [loadedFile, centerView]);

  useEffect(() => {
    if (diagram) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(diagram));
    }
  }, [diagram]);

  useEffect(() => {
    function handleWheel(e) {
      const canvas = document.querySelector('.condec-canvas');
      if ((e.ctrlKey || e.metaKey) && canvas && canvas.contains(e.target)) {
        e.preventDefault();
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }, []);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const canvas = document.querySelector('.condec-canvas');
    if (canvas) {
      canvas.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, []);

  const getCommandStack = useCallback(() => {
    return commandStackRef.current;
  }, []);

  const getDiagram = useCallback(() => {
    return diagram;
  }, [diagram]);

  const handleUndo = useCallback(() => {
    const commandStack = getCommandStack();
    if (commandStack.canUndo()) {
      commandStack.undo();
    }
  }, [getCommandStack]);

  const handleRedo = useCallback(() => {
    const commandStack = getCommandStack();
    if (commandStack.canRedo()) {
      commandStack.redo();
    }
  }, [getCommandStack]);

  const handleDelete = useCallback(() => {
    if (!selectedElement || !diagram) return;

    const commandStack = getCommandStack();

    if (selectedElement.type === 'node') {
      const nodeId = selectedElement.element.id;
      const command = new DeleteNodeCommand(nodeId, getDiagram, setDiagram);
      commandStack.execute(command);
    } else if (selectedElement.type === 'relation') {
      const relationId = selectedElement.element.id;
      const command = new DeleteRelationCommand(relationId, getDiagram, setDiagram);
      commandStack.execute(command);
    }

    setSelectedElement(null);
  }, [selectedElement, diagram, getCommandStack, getDiagram]);

  const handleDeleteMultiSelected = (nodesToDelete) => {
    if (!nodesToDelete || nodesToDelete.length === 0) return;
    
    const commandStack = getCommandStack();
    const nodeIds = nodesToDelete.map(n => n.id);
    
    const command = new DeleteMultipleNodesCommand(nodeIds, getDiagram, setDiagram);
    commandStack.execute(command);
    
    setMultiSelectedNodes([]);
  };

  const handleDeleteMultiSelectedExtended = (selectedElements) => {
    if (!selectedElements) return;
    
    const { nodes: nodesToDelete = [], naryDiamonds: relationDiamondsToDelete = [] } = selectedElements;
    
    if (nodesToDelete.length === 0 && relationDiamondsToDelete.length === 0) return;
    
    const commandStack = getCommandStack();
    
    if (nodesToDelete.length > 0) {
      const nodeIds = nodesToDelete.map(node => node.id);
      const nodeCommand = new DeleteMultipleNodesCommand(nodeIds, getDiagram, setDiagram);
      commandStack.execute(nodeCommand);
    }
    
    relationDiamondsToDelete.forEach(diamond => {
      const relationCommand = new DeleteRelationCommand(diamond.relationId, getDiagram, setDiagram);
      commandStack.execute(relationCommand);
    });
    
    setMultiSelectedNodes([]);
    setMultiSelectedElements({ nodes: [], relationPoints: [], naryDiamonds: [] });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        handleUndo();
        e.preventDefault();
      } else if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || 
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        handleRedo();
        e.preventDefault();
      }
      if ((e.key === 'Delete' && selectedElement) || (e.key === 'Backspace' && selectedElement)) {
        handleDelete();
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        setMode('hand');
        setNewRelation(null);
        e.preventDefault();
      }
      if (e.key === 'h' || e.key === 'H') {
        setMode('hand');
      }
      if (e.key === 's' || e.key === 'S') {
        setMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, handleDelete, handleUndo, handleRedo]);

  // Clear nary selected nodes when mode changes away from 'nary'
  useEffect(() => {
    if (mode !== 'nary' && narySelectedNodes.length > 0) {
      setNarySelectedNodes([]);
    }
  }, [mode, narySelectedNodes]);

  const handleNodeClickNaryMode = (nodeId) => {
    setNarySelectedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  };

  const handleCanvasClickNaryMode = (e) => {
    if (narySelectedNodes.length < 2) return;
    const selectedNodes = diagram?.nodes?.filter(n => narySelectedNodes.includes(n.id));
    if (!selectedNodes || selectedNodes.length < 2) return;
    const avgX = selectedNodes.reduce((sum, n) => sum + n.x, 0) / selectedNodes.length;
    const avgY = selectedNodes.reduce((sum, n) => sum + n.y, 0) / selectedNodes.length;
    setNaryDiamondPos({ x: avgX, y: avgY });
  };

  useEffect(() => {
    if (!naryDiamondPos || narySelectedNodes.length < 2) return;
    const newRelation = {
      id: `nary_${Date.now()}`,
      type: 'choice',
      activities: [...narySelectedNodes],
      n: 1,
      diamondPos: { ...naryDiamondPos }
    };
    const commandStack = getCommandStack();
    const command = new CreateNaryFromBinaryCommand(null, newRelation, getDiagram, setDiagram);
    commandStack.execute(command);
    setSelectedElement({
      type: 'relation',
      element: newRelation
    });
    setMode('hand');
    setNarySelectedNodes([]);
    setNaryDiamondPos(null);
  }, [naryDiamondPos, narySelectedNodes, getCommandStack, getDiagram]);

  const handleElementSelect = (elementType, elementId, e) => {
    if (mode === 'nary' && elementType === 'node') {
      handleNodeClickNaryMode(elementId);
      return;
    }
    const element = elementType === 'node'
      ? diagram.nodes.find(n => n.id === elementId)
      : diagram.relations.find(r => r.id === elementId);

    setSelectedElement({
      type: elementType,
      element: element
    });
    if (mode !== 'select') {
      setMode('hand');
    }
  };

  const handleNodeDragStart = (nodeId, e) => {
    const node = diagram.nodes.find(n => n.id === nodeId);
    
    setDraggedElement({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      elementX: node ? node.x : 0,
      elementY: node ? node.y : 0,
      originalPosition: { x: node ? node.x : 0, y: node ? node.y : 0 }
    });
  };

  const handleNodeDrag = (nodeId, dragEvent) => {
    if (!diagram || !nodeId || !draggedElement) return;
    
    const deltaX = (dragEvent.clientX - draggedElement.startX) / zoom;
    const deltaY = (dragEvent.clientY - draggedElement.startY) / zoom;
    
    const newNode = {
      ...diagram.nodes.find(n => n.id === nodeId),
      x: draggedElement.elementX + deltaX,
      y: draggedElement.elementY + deltaY
    };
    
    const snappedNode = snapNodeDuringDrag(newNode, 0, 0, 10);
    
    const guides = require('../utils/canvas/alignmentUtils').getAlignmentGuidesForPoint(
      { x: snappedNode.x, y: snappedNode.y }, 
      diagram.nodes.filter(n => n.id !== nodeId),
      diagram.relations
    );
    
    if (guides.x !== null) snappedNode.x = guides.x;
    if (guides.y !== null) snappedNode.y = guides.y;
    
    const updatedNodes = diagram.nodes.map(n => 
      n.id === nodeId ? snappedNode : n
    );
    setDiagram({
      ...diagram, 
      nodes: updatedNodes
    });
  };

  const handleMouseUpWithCommands = (e) => {
    if (draggedElement && draggedElement.id) {
      const deltaX = (e.clientX - draggedElement.startX) / zoom;
      const deltaY = (e.clientY - draggedElement.startY) / zoom;
      
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        const currentNode = diagram.nodes.find(n => n.id === draggedElement.id);
        if (currentNode && draggedElement.originalPosition) {
          const command = new MoveNodeCommand(
            draggedElement.id,
            { x: currentNode.x, y: currentNode.y },
            getDiagram,
            setDiagram,
            draggedElement.originalPosition
          );
          commandStackRef.current.execute(command);
        }
      }
      
      setDraggedElement(null);
    }
  };

  const handleNodeRename = (nodeId, newName) => {
    if (!newName || !newName.trim() || !diagram) return;
    
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node || node.name === newName.trim()) return;
    
    const commandStack = getCommandStack();
    const command = new UpdateNodeCommand(nodeId, { 
      name: newName.trim(), 
      editing: undefined 
    }, getDiagram, setDiagram);
    commandStack.execute(command);
    
    const updatedNode = { ...node, name: newName.trim(), editing: undefined };
    setSelectedElement({ 
      type: 'node', 
      element: updatedNode 
    });
  };

  const handleAddNode = e => {
    const result = addNode(e, mode, getDiagram, canvasOffset, zoom, getCommandStack, setDiagram);
    if (!result) return;
    
    setSelectedElement({ type: 'node', element: result.newNode });
    setMode('hand');
  };

  const handleRelationCreate = (sourceId, targetId) => {
    const existingRelation = diagram?.relations?.find(
      r => r.sourceId === sourceId && 
          r.targetId === targetId && 
          r.type === RELATION_TYPES.RESP_EXISTENCE
    );

    if (existingRelation) {
      setSelectedElement({
        type: 'relation',
        element: existingRelation
      });
      setNewRelation(null);
      return;
    }

    if (!isRelationAllowed(diagram, sourceId, targetId, RELATION_TYPES.RESP_EXISTENCE)) {
      alert('Cannot create this relation due to target constraints.');
      setNewRelation(null);
      return;
    }

    const sourceNode = diagram.nodes.find(n => n.id === sourceId);
    const targetNode = diagram.nodes.find(n => n.id === targetId);

    if (!sourceNode || !targetNode) {
      setNewRelation(null);
      return;
    }

    const startPoint = calculateIntersectionPoint(
      sourceNode,
      targetNode,
      sourceNode.width || 100,
      sourceNode.height || 50
    );
    const endPoint = calculateIntersectionPoint(
      targetNode,
      sourceNode,
      targetNode.width || 100,
      targetNode.height || 50
    );

    const waypoints = [
      { x: startPoint.x, y: startPoint.y },
      { x: endPoint.x, y: endPoint.y }
    ];
    
    const newRelationObj = {
      id: `relation_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: RELATION_TYPES.RESP_EXISTENCE,
      sourceId,
      targetId,
      waypoints
    };

    const commandStack = getCommandStack();
    const command = new CreateRelationCommand(newRelationObj, getDiagram, setDiagram);
    commandStack.execute(command);

    setSelectedElement({
      type: 'relation',
      element: newRelationObj
    });
    
    setNewRelation(null);
  };

  const handleRelationEdit = updatedRelations => {
    setDiagram(prev => ({ ...prev, relations: updatedRelations }));
  };
  
  const handleAppendActivity = useCallback((node) => {
    if (!diagram || !node) return;
    const commandStack = getCommandStack();
    const result = appendActivityAndConnect(node, getDiagram());
    if (!result) return;
    const { newNode, updatedDiagram } = result;
    const newRelation = updatedDiagram.relations[updatedDiagram.relations.length - 1];
    const command = new AppendActivityCommand(node, newNode, newRelation, getDiagram, setDiagram);
    commandStack.execute(command);
    setSelectedElement({ type: 'node', element: newNode });
  }, [diagram, getCommandStack, getDiagram]);

  const handleCanvasMouseDown = (e) => {
    if (mode === 'select') {
      handleSelectionMouseDown(e);
    }
  };

  const handleSelectionMouseDown = (e) => {
  };

  const handleSelectionMouseMove = (e) => {
  };

  const handleSelectionMouseUp = (e) => {
  };

  const handleCanvasWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const svg = document.querySelector('.condec-canvas');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const mouseY = (e.clientY - rect.top - canvasOffset.y) / zoom;

      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
      let newZoom = zoom * zoomFactor;
      newZoom = Math.max(0.2, Math.min(3, newZoom));

      setCanvasOffset(prev => ({
        x: prev.x - (mouseX * (newZoom - zoom)),
        y: prev.y - (mouseY * (newZoom - zoom))
      }));

      setZoom(newZoom);
    }
  };

  const handleExportJSON = () => {
    if (!diagram) return;
    const jsonString = JSON.stringify(diagram, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'condec-diagram.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const calculateDiagramBounds = (diagram) => {
    if (!diagram || !diagram.nodes || diagram.nodes.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    const allPoints = [];
    
    // Add all node bounds
    diagram.nodes.forEach(node => {
      const nodeWidth = node.width || 100;
      const nodeHeight = node.height || 50;
      allPoints.push(
        { x: node.x - nodeWidth/2, y: node.y - nodeHeight/2 },
        { x: node.x + nodeWidth/2, y: node.y + nodeHeight/2 }
      );
    });

    // Add all relation waypoints
    if (diagram.relations) {
      diagram.relations.forEach(relation => {
        if (relation.waypoints && relation.waypoints.length > 0) {
          relation.waypoints.forEach(waypoint => {
            allPoints.push({ x: waypoint.x, y: waypoint.y });
          });
        }
        
        // Add n-ary diamond positions
        if (relation.diamondPos) {
          allPoints.push({ x: relation.diamondPos.x, y: relation.diamondPos.y });
        }
      });
    }

    if (allPoints.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    const padding = 50; // Add some padding around the diagram
    const left = Math.min(...allPoints.map(p => p.x)) - padding;
    const right = Math.max(...allPoints.map(p => p.x)) + padding;
    const top = Math.min(...allPoints.map(p => p.y)) - padding;
    const bottom = Math.max(...allPoints.map(p => p.y)) + padding;

    return {
      x: left,
      y: top,
      width: Math.max(right - left, 400), // Minimum width
      height: Math.max(bottom - top, 300)  // Minimum height
    };
  };

  const handleExportSVG = () => {
    if (!diagram) return;
    
    // Calculate the bounds of the entire diagram
    const bounds = calculateDiagramBounds(diagram);
    
    // Get the current SVG element
    const originalSvg = document.querySelector('.condec-canvas');
    if (!originalSvg) return;

    // Create a new SVG element for export with calculated dimensions
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    exportSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    exportSvg.setAttribute('version', '1.1');
    exportSvg.setAttribute('width', bounds.width);
    exportSvg.setAttribute('height', bounds.height);
    exportSvg.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);

    // Copy all the defs (markers, patterns, etc.) from the original SVG
    const originalDefs = originalSvg.querySelector('defs');
    if (originalDefs) {
      const clonedDefs = originalDefs.cloneNode(true);
      // Ensure all markers in defs have explicit fill colors for PDF compatibility
      const markers = clonedDefs.querySelectorAll('marker');
      markers.forEach(marker => {
        const paths = marker.querySelectorAll('path');
        const circles = marker.querySelectorAll('circle');
        const lines = marker.querySelectorAll('line');
        
        paths.forEach(path => {
          if (!path.getAttribute('fill') || path.getAttribute('fill') === 'currentColor') {
            path.setAttribute('fill', '#555555');
          }
        });
        circles.forEach(circle => {
          if (!circle.getAttribute('fill') || circle.getAttribute('fill') === 'currentColor') {
            circle.setAttribute('fill', '#555555');
          }
        });
        lines.forEach(line => {
          if (!line.getAttribute('stroke') || line.getAttribute('stroke') === 'currentColor') {
            line.setAttribute('stroke', '#555555');
          }
        });
      });
      exportSvg.appendChild(clonedDefs);
    }

    // Create a group element to contain all diagram elements without viewport transforms
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Find the main diagram group in the original SVG (the one with the transform)
    const originalGroup = originalSvg.querySelector('g[transform]');
    if (originalGroup) {
      // Copy all children of the transformed group, but without the viewport transform
      Array.from(originalGroup.children).forEach(child => {
        // Skip alignment guides and UI elements we don't want in the export
        if (child.classList.contains('alignment-guides') || 
            child.classList.contains('multi-select-bounding-box') ||
            child.classList.contains('selection-box') ||
            child.classList.contains('lasso-box') ||
            child.classList.contains('hologram-node')) {
          return;
        }
        group.appendChild(child.cloneNode(true));
      });
    }

    exportSvg.appendChild(group);

    // Serialize and download
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(exportSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'condec-diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCanvasClick = (e) => {
    if (mode === 'nary') {
      if (e.target.classList.contains('condec-canvas')) {
        handleCanvasClickNaryMode(e);
      }
      return;
    }
    if (mode === 'select' && e.target.classList.contains('condec-canvas')) {
      setMultiSelectedNodes([]);
      setMultiSelectedElements({ nodes: [], relationPoints: [], naryDiamonds: [] });
      setMode('hand');
      return;
    }
    
    if (mode === 'hand' && e.target.classList.contains('condec-canvas')) {
      setMultiSelectedNodes([]);
      setMultiSelectedElements({ nodes: [], relationPoints: [], naryDiamonds: [] });
    }
    
    if (e.target.classList.contains('condec-canvas') && mode === 'addActivity') {
      handleAddNode(e);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (mode === 'nary' && naryStartNode) {
      const svg = document.querySelector('.condec-canvas');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setNaryMouse({
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom
      });
    }
    
    if (mode === 'addActivity' && !selectionBox) {
      const svg = document.querySelector('.condec-canvas');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setHologramNodePosition({
        x: (e.clientX - rect.left - canvasOffset.x) / zoom,
        y: (e.clientY - rect.top - canvasOffset.y) / zoom
      });
    } else if (selectionBox) {
      setHologramNodePosition(null);
    }
  };

  const handleNaryRelationClick = (relation, event) => {
    if (mode !== 'nary' || !naryStartNode) return;
    if (!relation.sourceId || !relation.targetId) return;
    
    const a = diagram.nodes.find(n => n.id === relation.sourceId);
    const b = diagram.nodes.find(n => n.id === relation.targetId);
    if (!a || !b) return;
    
    const activities = [a.id, b.id, naryStartNode.id];
    const uniqueActivities = [...new Set(activities)];
    
    const newRelation = {
      id: `nary_${Date.now()}`,
      type: 'choice',
      activities: uniqueActivities,
      n: 1
    };
    
    const commandStack = getCommandStack();
    const command = new CreateNaryFromBinaryCommand(relation, newRelation, getDiagram, setDiagram);
    commandStack.execute(command);
    
    setSelectedElement({
      type: 'relation',
      element: newRelation
    });
    
    setMode('hand');
    setNaryStartNode(null);
    setNaryMouse(null);
  };

  useEffect(() => {
    if (!draggingEditPopup) return;
    const handleMouseMove = (e) => {
      setEditNodePopupPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };
    const handleMouseUp = () => setDraggingEditPopup(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingEditPopup, dragOffset]);

  useEffect(() => {
    function handleWheel(e) {
      const canvas = document.querySelector('.condec-canvas');
      if (
        canvas &&
        canvas.contains(e.target) &&
        !e.ctrlKey &&
        !e.metaKey &&
        (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) > 0)
      ) {
        setCanvasOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
        e.preventDefault();
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel, { passive: false });
    };
  }, []);

  return (
    <div className="condec-modeler-wrapper" style={wrapperStyle}>
      <div className="button-container">
        <button 
          className="modeler-btn"
          onClick={() => {
            const container = document.querySelector('.condec-canvas-container');
            if (container) {
              const { width, height } = container.getBoundingClientRect();
              const nodeX = (width * 0.1) / zoom;
              const nodeY = (height * 0.05) / zoom;
              
              const newNode = {
                id: `node_${Date.now()}`,
                name: '',
                x: nodeX,
                y: nodeY,
                type: 'activity'
              };
              
              const newDiagram = {
                nodes: [newNode],
                relations: []
              };
              centerView();
              setDiagram(newDiagram);
              setSelectedElement({ type: 'node', element: newNode });
            }
          }} 
          title="New Diagram"
        >
          New
        </button>
        <button 
          className="modeler-btn"
          onClick={handleExportJSON}
          title="Export Diagram (JSON)"
        >
          Export JSON
        </button>
        <button 
          className="modeler-btn"
          onClick={handleExportSVG} 
          title="Export SVG"
        >
          Export SVG
        </button>
        <button
          className="modeler-btn"
          onClick={centerView}
          title="Reset View to Top-Left"
        >
          Center Canvas
        </button>
        <button
          className="modeler-btn import"
          style={{  }}
          onClick={e => {
            e.stopPropagation();
            setShowImportDropdown(v => !v);
            }}
            title="Import diagram"
            type="button"
            ref={importBtnRef}
          >
            Import
          </button>
          {showImportDropdown && importBtnRef.current && (
            <div style={{
            position: 'absolute',
            top: importBtnRef.current.offsetTop + importBtnRef.current.offsetHeight,
            left: importBtnRef.current.offsetLeft,
            background: '#1976d2',
            border: '1px solid #1976d2',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(25,118,210,0.12)',
            zIndex: 1000,
            minWidth: 180,
            color: '#fff',
            padding: 0
            }}>
            <label style={{ display: 'block', padding: '8px 16px', cursor: 'pointer', color: '#fff' }}>
              Import XML
              <input type="file" accept=".xml" style={{ display: 'none' }} onChange={async (event) => {
              const file = event.target.files[0];
              if (!file) return;
              if (!window.confirm('Importing will overwrite your current model. Continue?')) {
                event.target.value = null;
                setShowImportDropdown(false);
                return;
              }
              const text = await file.text();
              try {
                const importedDiagram = importDeclareXmlWithLayout(text);
                const commandStack = getCommandStack();
                const command = new ImportDiagramCommand(importedDiagram, getDiagram, setDiagram);
                commandStack.execute(command);
                setSelectedElement(null);
              } catch (e) {
                alert('Invalid XML file.');
              }
              setShowImportDropdown(false);
              event.target.value = null;
              }} />
            </label>
            <label style={{ display: 'block', padding: '8px 16px', cursor: 'pointer', color: '#fff' }}>
              Import TXT
              <input type="file" accept=".txt" style={{ display: 'none' }} onChange={async (event) => {
              const file = event.target.files[0];
              if (!file) return;
              if (!window.confirm('Importing will overwrite your current model. Continue?')) {
                event.target.value = null;
                setShowImportDropdown(false);
                return;
              }
              const text = await file.text();
              try {
                const importedDiagram = importDeclareTxtWithLayout(text);
                const commandStack = getCommandStack();
                const command = new ImportDiagramCommand(importedDiagram, getDiagram, setDiagram);
                commandStack.execute(command);
                setSelectedElement(null);
              } catch (e) {
                alert(e && e.stack ? e.stack : (e && e.message ? e.message : String(e)));
              }
              setShowImportDropdown(false);
              event.target.value = null;
              }} />
            </label>
            <label style={{ display: 'block', padding: '8px 16px', cursor: 'pointer', color: '#fff' }}>
              Import JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={async (event) => {
              const file = event.target.files[0];
              if (!file) return;
              if (!window.confirm('Importing will overwrite your current model. Continue?')) {
                event.target.value = null;
                setShowImportDropdown(false);
                return;
              }
              const text = await file.text();
              try {
                const importedDiagram = importDeclareJsonWithLayout(text);
                const commandStack = getCommandStack();
                const command = new ImportDiagramCommand(importedDiagram, getDiagram, setDiagram);
                commandStack.execute(command);
                setSelectedElement(null);
              } catch (e) {
                alert('Invalid JSON file.');
              }
              setShowImportDropdown(false);
              event.target.value = null;
              }} />
            </label>
            </div>
          )}
          </div>
      <div className="condec-modeler-container" style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
        onClick={e => {
          if (showImportDropdown) {
            if (
              importBtnRef.current &&
              !importBtnRef.current.contains(e.target)
            ) {
              setShowImportDropdown(false);
            }
          }
        }}
      >
        <ConDecCanvas
          ref={canvasRef}
          diagram={diagram}
          selectedElement={selectedElement}
          mode={mode}
          onSelectElement={handleElementSelect}
          onNodeRename={handleNodeRename}
          onRelationCreate={handleRelationCreate}
          onNodeEdit={updatedNodes => setDiagram({ ...diagram, nodes: updatedNodes })}
          onRelationEdit={handleRelationEdit}
          newRelation={newRelation}
          setNewRelation={setNewRelation}
          mousePosition={mousePosition}
          setMousePosition={setMousePosition}
          draggedElement={draggedElement}
          setDraggedElement={setDraggedElement}
          onCanvasClick={handleCanvasClick}
          canvasOffset={canvasOffset}
          setCanvasOffset={setCanvasOffset}
          onCanvasMouseDown={handleCanvasMouseDown}
          onSelectionMouseMove={handleSelectionMouseMove}
          onSelectionMouseUp={handleSelectionMouseUp}
          zoom={zoom}
          onCanvasWheel={handleCanvasWheel}
          selectionBox={selectionBox}
          setSelectionBox={setSelectionBox}
          multiSelectedNodes={multiSelectedNodes}
          setMultiSelectedNodes={setMultiSelectedNodes}
          multiSelectedElements={multiSelectedElements}
          setMultiSelectedElements={setMultiSelectedElements}
          onNodeMenuEdit={node => {
            setEditNodePopup({ node: { ...node } });
            const pos = calculateNodeEditMenuPosition(node, zoom, canvasOffset, canvasRef, editMenuSize);
            setEditNodePopupPos(pos);
          }}
          onNodeMenuDelete={handleDelete}
          onNodeMenuClose={() => setSelectedElement(null)}
          isPanning={isPanning}
          setIsPanning={setIsPanning}
          panStart={panStart}
          setPanStart={setPanStart}
          panOrigin={panOrigin}
          setPanOrigin={setPanOrigin}
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onAppend={handleAppendActivity}
          setMode={setMode}
          onDeleteMultiSelected={handleDeleteMultiSelected}
          onDeleteMultiSelectedExtended={handleDeleteMultiSelectedExtended}
          naryStartNode={naryStartNode}
          setNaryStartNode={setNaryStartNode}
          naryMouse={naryMouse}
          onNaryRelationClick={handleNaryRelationClick}
          onCanvasMouseMove={handleCanvasMouseMove}
          hologramNodePosition={hologramNodePosition}
          commandStack={getCommandStack()}
          setDiagram={setDiagram}
          getDiagram={getDiagram}
          onMouseUpWithCommands={handleMouseUpWithCommands}
          narySelectedNodes={narySelectedNodes}
        />
        {editNodePopup && (
          <NodeEditMenu
            node={editNodePopup.node}
            editNodePopupPos={editNodePopupPos}
            setDragOffset={setDragOffset}
            setDraggingEditPopup={setDraggingEditPopup}
            setEditNodePopup={setEditNodePopup}
            setEditNodePopupPos={setEditNodePopupPos}
            diagram={diagram}
            setDiagram={setDiagram}
            commandStack={getCommandStack()}
            setSelectedElement={setSelectedElement}
            getDiagram={getDiagram}
            onMenuSizeChange={handleMenuSizeChange}
          />
        )}
        {selectedElement && selectedElement.type === 'relation' && (
          <>
            {(selectedElement.element.type === 'choice' || selectedElement.element.type === 'Ex_choice') ? (
              <NaryRelationEditMenu
                relation={selectedElement.element}
                nodes={diagram.nodes}
                diagram={diagram}
                setDiagram={setDiagram}
                commandStack={getCommandStack()}
                setSelectedElement={setSelectedElement}
                getDiagram={getDiagram}
              />
            ) : (
              <RelationEditMenu
                relation={selectedElement.element}
                nodes={diagram.nodes}
                setEditNodePopup={setEditNodePopup}
                setEditNodePopupPos={setEditNodePopupPos}
                diagram={diagram}
                setDiagram={setDiagram}
                commandStack={getCommandStack()}
                setSelectedElement={setSelectedElement}
                getDiagram={getDiagram}
              />
            )}
          </>
        )}
        {renderPalette()}
      </div>
    </div>
  );
};

export default ConDecModeler;

const calculateIntersectionPoint = (source, target, width = 100, height = 50) => {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return source;
  const nx = dx / length;
  const ny = dy / length;
  const rx = (source.width || 100) / 2;
  const ry = (source.height || 50) / 2;
  const denom = Math.sqrt((nx * nx) / (rx * rx) + (ny * ny) / (ry * ry));
  return {
    x: source.x + (nx / denom),
    y: source.y + (ny / denom)
  };
};