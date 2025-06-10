# ConDec & BPMN Modeler

A web-based modeling tool that seamlessly integrates **ConDec (Constraint-based Declarative)** and **BPMN (Business Process Model and Notation)** paradigms in a single application. This dual-paradigm approach allows users to model business processes from different perspectives without switching between multiple tools. The online platform allows the users to save time installing and using outfdated software not compatible with modeler devices. 

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)

## Key Features

### **Dual Modeling Paradigms**
- **ConDec Modeler**: Constraint-based declarative process modeling with comprehensive Declare semantics
- **BPMN Modeler**: Full BPMN 2.0 support with standard notation elements
- **Split View**: Work with both paradigms simultaneously in a side-by-side interface

### **Advanced ConDec Capabilities**
- **Activity Nodes**: Create, edit, and position activities with drag-and-drop functionality
- **Constraint Types**: Complete support for declarative constraints:
  - `ABSENCE` - Activity cannot be executed
  - `ABSENCE_N` - Activity can be executed at most N times
  - `EXISTENCE_N` - Activity must be executed at least N times
  - `EXACTLY_N` - Activity must be executed exactly N times
  - `INIT` - Activity must be the first to execute
- **Relation Types**: Full Declare relation catalog:
  - Response, Precedence, Succession
  - Alternate variants (Alt-Response, Alt-Precedence, Alt-Succession)
  - Chain variants (Chain-Response, Chain-Precedence, Chain-Succession)
  - Negative relations (Neg-Response, Neg-Precedence, etc.)
  - Special relations (Coexistence, Not-Coexistence, Resp-Absence)
- **N-ary Relations**: Choice and Exclusive Choice constraints for multiple activities

### **Professional UI/UX**
- **Interactive Canvas**: Zoom, pan, and navigate large diagrams with ease
- **Inline Editing**: Double-click nodes for instant renaming
- **Context Menus**: Left-click access to properties and actions
- **Visual Validation**: Real-time constraint violation indicators
- **Keyboard Shortcuts**: 
  - `H` - Hand tool (pan mode)
  - `S` - Select tool
  - `Ctrl+Z/Cmd+Z` - Undo
  - `Ctrl+Y/Cmd+Y/Ctrl+Shift+Z` - Redo
  - `Delete/Backspace` - Delete selected elements
  - `Escape` - Cancel current action

### **Comprehensive Import/Export**
- **ConDec Formats**:
  - Import: XML, TXT (Declare Python dictionaries), JSON
  - Export: JSON, SVG
- **BPMN Formats**:
  - Import: BPMN XML
  - Export: BPMN XML, SVG
- **Automatic Layout**: Smart positioning for imported diagrams(only ConDec diagrams with .txt and .xml will use this feature).

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [User Guide](#user-guide)
4. [Technical Architecture](#technical-architecture)
5. [Constraint Semantics](#constraint-semantics)
6. [Import/Export Formats](#importexport-formats)
7. [Development](#development)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

## Installation
This set up is needed if you want to run the tool locally, in case you don't want, you can use the link in this repo for the online version. 
### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**

### Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piliotov/ConDec-BPMN-Modeler.git
   cd ConDec-BPMN-Modeler
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Linux Installation (if Node.js not installed)
```bash
sudo apt update
sudo apt install nodejs npm
```

## Quick Start

### Creating Your First ConDec Model

1. **Launch the application** and select "Start Modeling"
2. **Choose view mode**: Split View, BPMN only or ConDec only
3. **In the ConDec panel**:
   - Click the activity tool and place nodes on the canvas
   - Select the relation tool and connect activities
   - Double-click nodes to rename them
   - Left-click for context menu options

### Creating Your First BPMN Model

1. **In the BPMN panel**:
   - Use the standard BPMN palette on the left
   - Drag and drop BPMN elements onto the canvas
   - Connect elements using the connection tool
   - Configure properties via the properties panel

## User Guide

### Interface Overview

#### View Modes
- **Split View**: Both modelers visible side-by-side
- **ConDec Only**: Full-screen ConDec modeling
- **BPMN Only**: Full-screen BPMN modeling

#### ConDec Modeler Components

**Toolbar (Top)**
- `New` - Create a new diagram
- `Export JSON` - Save diagram as JSON file
- `Export SVG` - Export visual representation
- `Center Canvas` - Reset view to origin
- `Import` - Load diagrams from files

**Palette (Left)**
- Hand Tool (H) - Pan and navigate the canvas
- Select Tool (S) - Select and multi-select elements
- Relation Tool - Create connections between activities
- Activity Tool - Add new activity nodes
- N-ary Tool - Create choice relations between multiple activities

**Canvas (Center)**
- Primary workspace for modeling
- Supports zoom with mouse wheel
- Pan with hand tool or middle mouse button

### Working with Constraints

#### Applying Constraints to Activities

1. **Left-click an activity** to open the context menu
2. **Select "Edit"** to open the properties panel
3. **Choose constraint type** from the dropdown:
   - **None** - No constraint
   - **Absence (0)** - Activity cannot occur
   - **Absence (0..n)** - At most N occurrences
   - **Existence (n..∗)** - At least N occurrences
   - **Exactly (n)** - Exactly N occurrences
   - **Init** - Must be first activity

4. **Set constraint value** (for parametric constraints)

#### Understanding Constraint Violations

Activities with violated constraints display:
- Red border around the node
- Red exclamation mark (!) indicator
- Detailed violation message in properties

### Working with Relations

#### Creating Relations

1. **Select the relation tool** from the palette
2. **Click the source activity**
3. **Click the target activity**
4. **The relation is created** with default type (Response)

#### Editing Relations

1. **Left-click a relation** to access properties
2. **Change relation type** from extensive dropdown menu
3. **Adjust visual properties** (label position, waypoints)

#### Relation Categories

**Positive Relations** (enable behavior):
- Response, Precedence, Succession
- Alternate variants
- Chain variants
- Coexistence, Responded Existence

**Negative Relations** (restrict behavior):
- Neg-Response, Neg-Precedence, Neg-Succession
- Neg-Alternate variants
- Neg-Chain variants
- Not-Coexistence, Resp-Absence

### Advanced Features

#### Multi-Selection Operations
- **Drag multiple nodes** simultaneously
- **Delete multiple elements** with Delete key

#### Waypoint Editing
- **Click and drag** relation waypoints to reshape connections
- **Left-click** in the blue circles when a relation is selected to add new waypoints
- **Leftt-click** the red crosses above each waypoint to remove it

#### Alignment and Layout
- Automatic alignment guides appear when dragging
- Smart snapping to grid and other elements
- Force-directed layout for imported diagrams

## Technical Architecture

### Core Technologies
- **React 18.2.0** - Modern component-based UI framework
- **bpmn-js 11.5.0** - Professional BPMN modeling engine
- **diagram-js** - Diagramming framework for custom modelers
- **SVG** - Scalable vector graphics for crisp diagram rendering

### Project Structure

```
src/
  components/         # React components for UI and modelers
    ConDecModeler.js    # Main ConDec modeling interface
    BpmnModeler.js      # BPMN modeling wrapper
    ConDecCanvas.js     # ConDec diagram canvas
    SplitModelers.js    # Split-view container
    LandingPage.js      # Application entry page
  styles/             # CSS styles and themes
  utils/              # Utility functions and business logic
    canvas/             # Canvas operations and rendering
    commands/           # Command pattern for undo/redo
    modeler/            # Import/export and diagram utilities
    relations/          # Relation logic and validation
    node/               # Node constraints and validation
  App.js              # Main app entry
  index.js            # React entry point
public/
  index.html          # HTML entry point
```

### Component Architecture

**ConDecModeler** - Primary modeling interface featuring:
- Canvas rendering and interaction handling
- Tool palette for adding elements
- Import/export functionality
- Command stack for undo/redo operations

**BpmnModeler** - Integration wrapper for bpmn-js providing:
- BPMN 2.0 standard compliance
- XML import/export capabilities

**SplitModelers** - Container component enabling:
- View mode switching (Split/BPMN/ConDec)
- Persistent view preferences
- Responsive layout management

## Constraint Semantics

### Constraint Types and Validation Logic

#### **ABSENCE (0)**
- **Semantic**: Activity cannot be executed
- **Validation**: No positive incoming relations allowed
- **Use Case**: Forbidden activities in specific contexts

#### **ABSENCE_N (0..n)**
- **Semantic**: Activity can be executed at most N times
- **Validation**: At most N positive incoming relations
- **Use Case**: Rate-limited activities, resource constraints

#### **EXISTENCE_N (n..∗)**
- **Semantic**: Activity must be executed at least N times
- **Validation**: At least N positive incoming relations required
- **Use Case**: Mandatory repetitive tasks, compliance requirements

#### **EXACTLY_N (n)**
- **Semantic**: Activity must be executed exactly N times
- **Validation**: Exactly N positive incoming relations
- **Use Case**: Precise occurrence requirements, balanced workflows

#### **INIT**
- **Semantic**: Activity must be the first to execute
- **Validation**: No positive incoming relations; limited negative relations allowed
- **Use Case**: Initialization tasks, starting conditions

### Relation Semantics

#### **Positive Relations** (Enable Behavior)
- **Response**: If A occurs, then B must eventually occur
- **Precedence**: B can only occur if A has occurred before
- **Succession**: Combines Response and Precedence (A ↔ B)
- **Alternate Variants**: Add alternation constraints between occurrences
- **Chain Variants**: Require immediate succession (next-to-each-other)
- **Coexistence**: A and B must both occur or neither occurs

#### **Negative Relations** (Restrict Behavior)
- **Neg-Response**: If A occurs, then B cannot occur afterwards
- **Neg-Precedence**: A cannot occur before B
- **Neg-Succession**: A and B cannot occur in succession
- **Not-Coexistence**: A and B exclude each other completely
- **Resp-Absence**: If A occurs, then B can never occur

## Import/Export Formats

### ConDec Import Formats

#### **XML Import (.xml)**
Complete XML format with activity definitions and constraints:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<model>
  <activitydefinitions>
    <activity name="Register"/>
    <activity name="Pay"/>
    <activity name="Send Package"/>
    <activity name="Deliver"/>
  </activitydefinitions>
  
  <constraintdefinitions>
    <!-- Response constraint: if Register occurs, then Pay must eventually occur -->
    <constraint>
      <name>response</name>
      <constraintparameters>
        <parameter><branch name="Register"/></parameter>
        <parameter><branch name="Pay"/></parameter>
      </constraintparameters>
    </constraint>
    
    <!-- Precedence constraint: Pay can only occur if Register occurred before -->
    <constraint>
      <name>precedence</name>
      <constraintparameters>
        <parameter><branch name="Pay"/></parameter>
        <parameter><branch name="Register"/></parameter>
      </constraintparameters>
    </constraint>
    
    <!-- Existence constraint: Register must occur at least twice -->
    <constraint>
      <name>existence</name>
      <constraintparameters>
        <parameter><branch name="Register"/></parameter>
      </constraintparameters>
      <template>
        <display>2..*</display>
      </template>
    </constraint>
    
    <!-- Init constraint: Register must be the first activity -->
    <constraint>
      <name>init</name>
      <constraintparameters>
        <parameter><branch name="Register"/></parameter>
      </constraintparameters>
    </constraint>
  </constraintdefinitions>
</model>
```

#### **TXT Import (.txt)** - Declare Python Dictionary
```python
{
  "response": {
    ("A", "B"): {"support": 0.8, "confidence": 0.9}
  },
  "existence": {
    "A": 2  # At least 2 occurrences
  }
}
```

#### **JSON Import (.json)**
```json
{
  "nodes": [
    {
      "id": "activity_1",
      "type": "activity", 
      "name": "Task A",
      "x": 100, "y": 100,
      "constraint": "existence_n",
      "constraintValue": 2
    }
  ],
  "relations": [
    {
      "id": "relation_1",
      "type": "response",
      "sourceId": "activity_1",
      "targetId": "activity_2",
      "waypoints": [[100,100], [200,200]]
    }
  ]
}
```

### Export Formats

#### **JSON Export** - Native format preserving all model data
#### **SVG Export** - Vector graphics for documentation and presentation

### BPMN Formats

#### **Import/Export** - Standard BPMN 2.0 XML format
#### **SVG Export** - Vector graphics output

### Automatic Layout Engine

The application includes a sophisticated force-directed layout algorithm for imported diagrams:

- **Node Positioning**: Distributes nodes using physics simulation
- **Relationship Awareness**: Considers relation types for optimal placement  
- **Collision Avoidance**: Prevents node overlap with minimum separation
- **Convergence Control**: Iterative improvement over 900 iterations
- **Boundary Management**: Keeps nodes within canvas bounds
- the logic is taken from similar project named [declare-js](declare-js.com)

## Development

### Getting Started with Development

1. **Fork and clone the repository**
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm start`
4. **Access development tools**: Browser DevTools, React DevTools

### Building for Production

```bash
npm run build
npm run preview
```

### Key Development Areas

#### **Adding New Constraint Types**
1. Update `CONSTRAINTS` enum in `diagramUtils.js`
2. Add validation logic in `nodeConstraintUtils.js`
3. Implement UI support in `NodeEditMenu.js`
4. Add visual notation in `ConDecNode.js`

#### **Adding New Relation Types**
1. Update `RELATION_TYPES` in `relationUtils.js`
2. Add to `declareRelationTypeMap.js` for import support
3. Implement relation semantics in validation logic
4. Add description in `relationDescriptions.js`

#### **Extending Import/Export**
1. Create parser in `declareImportUtils.js`
2. Update file handling in `ConDecModeler.js`
3. Add format validation and error handling


## API Reference

### Core Diagram Object Structure

```javascript
const diagram = {
  nodes: [
    {
      id: 'unique_id',
      type: 'activity',
      name: 'Display Name',
      x: 100,           // Canvas X position
      y: 100,           // Canvas Y position  
      constraint: 'existence_n',    // Optional constraint
      constraintValue: 2            // Constraint parameter
    }
  ],
  relations: [
    {
      id: 'unique_id',
      type: 'response',
      sourceId: 'source_node_id',
      targetId: 'target_node_id',
      waypoints: [[x1,y1], [x2,y2]]  // Connection path
    }
  ]
}
```

### Key Utility Functions

#### **Constraint Validation**
```javascript
import { validateNodeConstraint } from './utils/node/nodeConstraintUtils';

const result = validateNodeConstraint(node, diagram);
// Returns: { valid: boolean, message: string, incomingCount: number }
```

#### **Relation Validation**  
```javascript
import { isRelationAllowed } from './utils/relations/relationUtils';

const allowed = isRelationAllowed(diagram, sourceId, targetId, relationType);
// Returns: boolean
```

#### **Import Operations**
```javascript
import { 
  importDeclareTxtWithLayout,
  importDeclareJsonWithLayout,
  importDeclareXmlWithLayout 
} from './utils/modeler/declareImportUtils';

const diagram = importDeclareTxtWithLayout(textContent);
```

### Command Pattern API

```javascript
import { UpdateNodeCommand } from './utils/commands/DiagramCommands';

// Execute with undo support
const command = new UpdateNodeCommand(nodeId, updates, getDiagram, setDiagram);
commandStack.execute(command);

// Undo/Redo
commandStack.undo();
commandStack.redo();
```

## Troubleshooting

### Common Issues and Solutions

#### **Application Won't Start**
- **Check Node.js version**: Ensure Node.js v16+ is installed
- **Clear npm cache**: Run `npm cache clean --force`
- **Delete node_modules**: Remove folder and run `npm install` again
- **Port conflicts**: Default port 3000 may be in use

#### **Import/Export Problems**

**File Import Fails**
- Verify file format matches extension (.xml, .txt, .json for ConDec; .bpmn for BPMN)
- Check file encoding (UTF-8 recommended)
- Validate file structure against expected format
- Look for syntax errors in browser console

**Export Issues**
- Ensure browser allows file downloads
- Check available disk space
- Verify popup blockers aren't interfering

#### **Performance Issues**
- **Large diagrams**: Use zoom controls and centering features
- **Browser memory**: Close unused tabs, refresh page
- **Outdated browser**: Update to latest version

#### **Modeling Issues**

**Cannot Create Relations**
- Check constraint compatibility (ABSENCE nodes can't have positive relations)
- Verify source and target nodes are valid
- INIT nodes have specific relation restrictions

**Constraint Violations**
- Red borders indicate constraint violations
- Check incoming relation counts against constraint requirements
- Review relation types (positive vs. negative)

**Layout Problems**
- Use "Center Canvas" to reset view
- Force-directed layout may take time to settle
- Manual adjustment available for fine-tuning

#### **Browser Compatibility**
- **JavaScript disabled**: Enable JavaScript for full functionality

#### **Data Loss Prevention**
- Diagrams auto-save to localStorage
- Import overwrites current model (confirmation required)

### Getting Help

For persistent issues:
1. **Check browser console** for error messages
2. **Try incognito/private mode** to rule out extensions
3. **Contact support** at [ilia.panayotov@tum.de](mailto:ilia.panayotov@tum.de) with:
   - Browser version and OS
   - Steps to reproduce the issue
   - Console error messages (if any)
   - Sample files (if import-related)

---

## Acknowledgements

- [bpmn-js](https://github.com/bpmn-io/bpmn-js) for BPMN modeling.
- [React](https://reactjs.org/) for the UI framework.
- [diagram-js](https://github.com/bpmn-io/diagram-js) for the diagramming framework.
- [declare-js](declare-js.com) for the placement algorithm. 



---

## Contact

For questions or support, please use my email: [ilia.panayotov@tum.de](ilia.panayotov@tum.de).

