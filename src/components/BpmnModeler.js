import React, { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js-properties-panel/dist/assets/properties-panel.css';
import '../styles/ModelerButtons.css';

const LOCAL_STORAGE_KEY = 'bpmn-diagram';
const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">\n  <bpmn:process id="Process_1" isExecutable="false">\n    <bpmn:startEvent id="StartEvent_1" />\n  </bpmn:process>\n  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">\n      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">\n        <dc:Bounds x="173" y="102" width="36" height="36" />\n      </bpmndi:BPMNShape>\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</bpmn:definitions>`;

const ModelerButton = ({ onClick, title, children, ...props }) => (
  <button className="modeler-btn" style={{
    background: "#f7fafd",
    border: "1px solid #b0b8c1",
    color: "#1a2233"
  }} onClick={onClick} title={title} {...props}>{children}</button>
);

const BpmnModeler = ({ loadedFile }) => {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);

  useEffect(() => {
    function checkReady() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerReady(true);
        }
      }
    }
    checkReady();
    window.addEventListener('resize', checkReady);
    return () => window.removeEventListener('resize', checkReady);
  }, []);

  useEffect(() => {
    if (!containerReady) return;
    const modeler = new BpmnJS({ container: containerRef.current });
    modelerRef.current = modeler;

    let diagramToLoad = initialDiagram;
    if (loadedFile && loadedFile.fileType === 'bpmn') {
      diagramToLoad = loadedFile.content;
    } else {
      const savedDiagram = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDiagram) {
        diagramToLoad = savedDiagram;
      }
    }

    modeler.importXML(diagramToLoad).then(() => modeler.get('canvas').zoom('fit-viewport'));

    const eventBus = modeler.get('eventBus');
    eventBus.on(['element.changed', 'shape.added', 'shape.removed', 'connection.added', 'connection.removed'], () => {
      modeler.saveXML({ format: true }).then(({ xml }) => localStorage.setItem(LOCAL_STORAGE_KEY, xml));
    });

    return () => modeler.destroy();
  }, [containerReady, loadedFile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        modelerRef.current?.get('commandStack').undo();
        e.preventDefault();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        const selection = modelerRef.current?.get('selection').get();
        if (selection && selection.length > 0) {
          modelerRef.current.get('modeling').removeElements(selection);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [containerReady]);

  const handleSave = () => modelerRef.current?.saveXML({ format: true }).then(({ xml }) => {
    const link = document.createElement('a');
    link.href = 'data:application/bpmn+xml;charset=UTF-8,' + encodeURIComponent(xml);
    link.download = 'diagram.bpmn';
    link.click();
  });

  const handleExportSVG = () => modelerRef.current?.saveSVG().then(({ svg }) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
  });

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file || !modelerRef.current) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target.result;
      modelerRef.current.importXML(xml).then(() => {
        modelerRef.current.get('canvas').zoom('fit-viewport');
        localStorage.setItem(LOCAL_STORAGE_KEY, xml);
      }).catch(() => alert('Could not import the BPMN file. It might be invalid.'));
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleNew = () => modelerRef.current?.importXML(initialDiagram).then(() => {
    modelerRef.current.get('canvas').zoom('fit-viewport');
  });

  const handleCenterCanvas = () => {
    if (modelerRef.current) {
      const canvas = modelerRef.current.get('canvas');
      if (canvas && typeof canvas.zoom === 'function') {
        canvas.zoom('fit-viewport');
      }
    }
  };

  return (
    <div className="modeler-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: "#f4f7fb" }}>
      <div className="button-container" style={{ background: "#f7fafd", borderBottom: "1px solid #e3eaf3" }}>
        <ModelerButton onClick={handleNew} title="New BPMN Diagram">New</ModelerButton>
        <ModelerButton onClick={handleSave} title="Export BPMN XML">Export</ModelerButton>
        <ModelerButton onClick={handleExportSVG} title="Export SVG">Export SVG</ModelerButton>
        <ModelerButton onClick={handleCenterCanvas} title="Center Canvas">Center Canvas</ModelerButton>
        <label className="modeler-btn import" title="Import BPMN XML">
          Import
          <input type="file" accept=".bpmn,.xml" onChange={handleImport} />
        </label>
      </div>
      <div className="modeler-container" style={{ width: '100%', flex: 1, minHeight: 0, paddingBottom: '30px' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
};

export default BpmnModeler;
