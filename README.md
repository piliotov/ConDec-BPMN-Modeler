# ConDec & BPMN Modeler

A web-based modeling tool for creating and editing ConDec (Constraint-based Declarative) and BPMN (Business Process Model and Notation) diagrams. This project provides a modern, interactive UI for process modeling, supporting both Declare and BPMN paradigms, with professional features collected from the best practice in the business tools.

---

## Features

- **Split View:** Work with ConDec and BPMN diagrams side-by-side, or focus on one at a time.
- **ConDec Modeler:**
  - Drag-and-drop activity nodes.
  - Add, edit, and delete nodes and relations.
  - Support for various constraint types (Absence, Existence, Init, etc.).
  - Inline renaming, constraint editing, and position adjustment.
  - Undo/redo support.
  - Keyboard shortcuts for fast modeling.
  - Zoom and pan the canvas.
  - Context menu for quick node actions (edit, append, delete).
- **BPMN Modeler:**
  - Full BPMN 2.0 modeling via [bpmn-js](https://github.com/bpmn-io/bpmn-js).
  - Save/load diagrams from local storage.
  - Export as BPMN XML or SVG.
  - Import BPMN XML files.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piliotov/BDM.git
   cd BDM
   ```

2. **If you do not have npm installed (Linux):**
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```
   You can check your installation with:
   ```bash
   node -v
   npm -v
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npm start
```

- The app will open in your default browser at [http://localhost:3000](http://localhost:3000).
- Hot reloading is enabled for rapid development.

---

## Usage

### Main Interface

- **View Modes:** Use the buttons at the top to switch between Split View, BPMN Only, or ConDec Only.
- **ConDec Modeler:**
  - **Palette (left):** Select tools for hand (pan) (key:H), select (multi-select) (key-S), add relation, or add activity.
  - **Canvas:** Drag nodes, create relations, or select elements.
  - **Context Menu:** left-click a node to use the floating menu to edit, append, or delete.
  - **Properties Panel:** Edit node or relation properties in detail with the wrench icon in the loating menu.
  - **Export/Import:** Use the top bar to export diagrams as XML or SVG, or import from XML.
  - **Keyboard Shortcuts:**
    - `H`: Hand tool (pan)
    - `S`: Select tool (multi-select)
    - `Delete`/`Backspace`: Delete selected element
    - `Ctrl+Z`/`Cmd+Z`: Undo
    - `Escape`: Cancel current action
- **BPMN Modeler:**
  - Use the BPMN palette and canvas as in standard BPMN tools.
  - Export/import BPMN XML and SVG.

### Saving and Loading

- **Local Storage:** Diagrams are automatically saved in your browser's local storage.
- **Export:** Download diagrams as XML (ConDec) or BPMN XML (BPMN), or as SVG images.
- **Import:** Load diagrams from files using the import buttons.

---

## Project Structure

```
src/
  components/         # React components for UI and modelers
  styles/             # CSS styles
  utils/              # Utility functions (geometry, canvas, diagram logic)
  App.js              # Main app entry
  index.js            # React entry point
  ...
public/
  index.html          # HTML entry point
```

---

## Troubleshooting

- If the app does not start, ensure Node.js and npm are installed and up to date.
- For issues with diagram import/export, check the file format and browser console for errors.
- If you encounter a bug, please contact me on [ilia.panayotov@tum.de](ilia.panayotov@tum.de) with steps to reproduce.

---

## Acknowledgements

- [bpmn-js](https://github.com/bpmn-io/bpmn-js) for BPMN modeling.
- [React](https://reactjs.org/) for the UI framework.


---

## Contact

For questions or support, please use my email: [ilia.panayotov@tum.de](ilia.panayotov@tum.de).

