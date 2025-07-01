import React, { useState, useEffect } from 'react';
import BpmnModeler from './BpmnModeler';
import ConDecModeler from './ConDecModeler';

const VIEW_MODE_STORAGE_KEY = 'modeler-view-mode';
const VIEW_MODES = { SPLIT: 'split', BPMN: 'bpmn', CONDEC: 'condec' };

const ViewModeButton = ({ active, onClick, children }) => (
  <button className={`view-mode-btn${active ? ' active' : ''}`} onClick={onClick}>
    {children}
  </button>
);

const SplitModelers = ({ loadedFile, onBackToLanding }) => {
  const [viewMode, setViewMode] = useState(
    localStorage.getItem(VIEW_MODE_STORAGE_KEY) || VIEW_MODES.SPLIT
  );
  useEffect(() => { localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode); }, [viewMode]);

  const renderViewModeButtons = () => (
    <div className="view-mode-buttons">
      <button 
        className="back-to-home-btn"
        onClick={onBackToLanding}
        title="Back to Home"
      >
        ← Landing Page
      </button>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flex: 1 }}>
        {Object.entries(VIEW_MODES).map(([key, mode]) => (
          <ViewModeButton
            key={mode}
            active={viewMode === mode}
            onClick={() => setViewMode(mode)}
          >
            {mode === 'split' ? 'Split View' : mode === 'bpmn' ? 'BPMN' : 'ConDec'}
          </ViewModeButton>
        ))}
      </div>
    </div>
  );

  return (
    <div className="split-modeler-container" style={{
      width: '100vw',
      height: '100vh',
      minHeight: 0,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="view-mode-controls">{renderViewModeButtons()}</div>
      <div
        className={`modelers-container ${viewMode}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: viewMode === VIEW_MODES.SPLIT ? 'row' : 'column',
          width: '100%',
          height: '100%',
          minHeight: 0,
          minWidth: 0
        }}
      >
        {(viewMode === VIEW_MODES.SPLIT) && (
          <>
            <div className="modeler-half" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <BpmnModeler loadedFile={loadedFile} />
            </div>
            <div className="modeler-half" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <ConDecModeler width="100%" height="100%" loadedFile={loadedFile} />
            </div>
          </>
        )}
        {(viewMode === VIEW_MODES.BPMN) && (
          <div className="modeler-full" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <BpmnModeler loadedFile={loadedFile} />
          </div>
        )}
        {(viewMode === VIEW_MODES.CONDEC) && (
          <div className="modeler-full" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <ConDecModeler width="100%" height="100%" loadedFile={loadedFile} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitModelers;