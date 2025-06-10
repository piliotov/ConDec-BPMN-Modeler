import React from 'react';
import '../styles/LandingPage.css';

const LandingPage = ({ onStartModeling, onLoadFile }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const fileName = file.name.toLowerCase();
        
        let fileType;
        if (fileName.endsWith('.bpmn')) {
          fileType = 'bpmn';
        } else if (fileName.endsWith('.xml')) {
          fileType = 'condec-xml';
        } else if (fileName.endsWith('.txt')) {
          fileType = 'condec-txt';
        } else if (fileName.endsWith('.json')) {
          fileType = 'condec-json';
        } else {
          alert('Unsupported file type. Please select .bpmn files for BPMN or .xml, .txt, .json files for ConDec.');
          return;
        }
        
        onLoadFile(content, fileType, file.name);
      };
      reader.readAsText(file);
    }
  };

  const features = [
    {
      title: "ConDec Modeling",
      description: "Create constraint-based declarative models with drag-and-drop nodes, multiple relation types, and intuitive editing.",
    },
    {
      title: "BPMN 2.0 Support", 
      description: "Full BPMN modeling capabilities with standard notation, XML import/export, and professional diagramming tools.",
    },
    {
      title: "Split View Mode",
      description: "Work with both ConDec and BPMN diagrams simultaneously in a split-screen interface for comprehensive modeling.",
    },
    {
      title: "Professional Tools",
      description: "Undo/redo, keyboard shortcuts, zoom/pan, context menus, and all the features you expect from modern modeling tools.",
    }
  ];

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container">
          <h1 className="landing-title">
            ConDec & BPMN Modeler
          </h1>
          <p className="landing-subtitle">
            Modeling tool for constraint-based declarative processes and BPMN 2.0
          </p>
        </div>
      </header>

      <main className="landing-main">
        <div className="container">
          <section className="quick-actions">
            <div className="action-cards">
              <div className="action-card primary">
                <h3>Create New Model</h3>
                <p>Start fresh with a blank canvas for ConDec or BPMN modeling</p>
                <button 
                  className="action-button primary"
                  onClick={() => onStartModeling('new')}
                >
                  Start Modeling
                </button>
              </div>
              
              <div className="action-card">
                <h3>Upload Existing File</h3>
                <p>Import BPMN (.bpmn) or ConDec files (.xml, .txt, .json) to continue working</p>
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".bpmn,.xml,.txt,.json"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="action-button">
                    Choose File
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="features-section">
            <h2>Features</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section">
            <h2>About the Tool</h2>
            <div className="about-content">
              <div className="about-text">
                <h3>What is ConDec?</h3>
                <p>
                  ConDec (Constraint-based Declarative) modeling allows you to define business processes 
                  through constraints and rules rather than explicit control flow. It's perfect for 
                  flexible, knowledge-intensive processes where the exact sequence of activities may vary.
                </p>
                
                <h3>BPMN Integration</h3>
                <p>
                  Business Process Model and Notation (BPMN) provides a standardized graphical notation 
                  for modeling business processes. Our tool supports the full BPMN 2.0 specification 
                  with professional modeling capabilities.
                </p>

                <h3>Best of Both Worlds</h3>
                <p>
                  Use our split-view mode to work with both paradigms simultaneously, allowing you to 
                  model processes from different perspectives and leverage the strengths of each approach.
                </p>
              </div>
            </div>
          </section>

          <section className="formats-section">
            <h2>Supported Formats</h2>
            <div className="formats-list">
              <div className="format-item">
                <strong>Import BPMN:</strong> .bpmn
              </div>
              <div className="format-item">
                <strong>Export BPMN:</strong> .bpmn, .svg
              </div>
              <div className="format-item">
                <strong>Import ConDec:</strong> .xml, .txt, .json
              </div>
              <div className="format-item">
                <strong>Export ConDec:</strong> .json, .svg
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="container">
          <p>Built for professional process modeling</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
