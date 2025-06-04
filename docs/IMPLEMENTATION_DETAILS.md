# Business Decision Modeler (BDM)
## Technical Implementation Documentation

**Document Type:** Technical Specification  
**Version:** 1.0  
**Date:** May 07. 2025
**Author:** Ilia Panayotov

---

## Executive Summary

This document provides a comprehensive overview of the Business Decision Modeler (BDM) application, which integrates both BPMN and Declare (ConDec) modeling capabilities within a unified interface. The implementation focuses on maintaining consistent user experience across different modeling paradigms while providing a feature-rich environment for business process modeling.

---

## Table of Contents

1. Introduction
2. Core Requirements
3. Implementation Architecture
   1. Combined View Architecture
   2. ConDec Modeler Design
4. Feature Specifications
   1. Flexible View Modes
   2. ConDec Modeling Capabilities
   3. BPMN Integration
   4. Consistent UI Components
   5. Data Persistence Layer
   6. Responsive Interface Design
5. Technical Considerations
   1. Performance Optimizations
   2. UI/UX Design Decisions
6. Future Development Roadmap
7. Conclusion

---

## 1. Introduction

The Business Decision Modeler (BDM) was developed to address the need for integrating both BPMN (Business Process Model and Notation) and Declare (ConDec) modeling paradigms within a single application. This integration allows users to leverage the strengths of both modeling approaches without switching between multiple tools.

The primary challenge addressed by this implementation was to create a consistent user experience across two fundamentally different modeling approaches while maintaining the distinct capabilities of each. All changes to the ConDec modeler were specifically implemented to ensure visual and behavioral consistency with the BPMN modeler, creating a seamless experience for users.

---

## 2. Core Requirements

The implementation was guided by the following core requirements:

2.1. **Unified Interface Integration**  
Implement both BPMN and Declare (ConDec) modelers within a single cohesive application framework.

2.2. **Consistent User Experience**  
Ensure both modelers present similar visual aesthetics, interaction patterns, and behavioral responses.

2.3. **Flexible Layout Options**  
Allow users to dynamically switch between split view and individual modeler views based on their current needs.

2.4. **Modern User Interface**  
Provide an intuitive, clean interface with modern design patterns for efficient modeling activities.

---

## 3. Implementation Architecture

### 3.1. Combined View Architecture

The application architecture centers around the `SplitModelers` component that serves as the container for both modeling environments. This architectural decision enables:

- Dynamic switching between split view and individual modeler views
- Consistent state management across view transitions
- Potential future synchronization between different model representations
- Unified toolbar and control mechanisms

The view modes are controlled through the `VIEW_MODES` constants (`SPLIT`, `BPMN`, `CONDEC`), allowing the application to dynamically adjust the layout based on user preference. This preference is persisted in localStorage to provide continuity across user sessions.

### 3.2. ConDec Modeler Design

The ConDec modeler was specifically implemented to align with the BPMN modeler's visual and interaction patterns:

3.2.1. **Canvas-Based Rendering**  
Like the BPMN modeler, the ConDec implementation uses an SVG canvas for rendering elements, providing consistent visual representation and interaction.

3.2.2. **Consistent Toolbar Layout**  
The button containers and action layouts follow identical patterns to those in the BPMN modeler, reducing cognitive load when switching between modelers.

3.2.3. **Harmonized Element Styling**  
Node and relation styling was carefully implemented to visually align with BPMN elements while maintaining the distinct semantics of Declare modeling.

3.2.4. **Unified Interaction Patterns**  
Mouse behaviors for selecting, moving, and connecting elements were standardized across both modelers to ensure consistent user experience.

---

## 4. Feature Specifications

### 4.1. Flexible View Modes

The application supports three distinct view modes to accommodate different user workflows:

4.1.1. **Split View**  
Displays both BPMN and ConDec modelers side by side, enabling simultaneous work on both models.

4.1.2. **BPMN-Only Mode**  
Focuses the entire interface on the BPMN modeler when workflow modeling is the primary task.

4.1.3. **ConDec-Only Mode**  
Dedicates the full interface to the ConDec modeler when constraint-based modeling is required.

User view preferences are persisted in localStorage to maintain consistency across sessions.

### 4.2. ConDec Modeling Capabilities

The ConDec modeler implements a comprehensive set of features:

4.2.1. **Activity Nodes**  
Create, edit, and position activity nodes with customizable names and properties.

4.2.2. **Constraint Application**  
Apply various constraints to activities including:
- Absence constraints
- Existence constraints with configurable cardinality
- Exactly constraints with specified occurrence counts
- Initial activity constraints

4.2.3. **Relation Types**  
Connect activities with relation types following the Declare standard:
- Response relations
- Precedence relations
- Succession relations
- Alternate versions of base relations
- Negated relation variants
- Chain relation types

4.2.4. **Interactive Editing**  
Provide intuitive editing capabilities through:
- Double-click for inline renaming
- Context menu for accessing property panels
- Drag-and-drop positioning

4.2.5. **Visual Indicators**  
Different visual representations for various constraint and relation types to enhance model readability.

### 4.3. BPMN Integration

The BPMN modeler integration leverages the `bpmn-js` library with enhancements:

4.3.1. **Standard BPMN Support**  
Full support for BPMN 2.0 elements and notation.

4.3.2. **Diagram Persistence**  
Automatic saving of diagram state to prevent work loss.

4.3.3. **Import/Export Capabilities**  
Standard-compliant XML import and export functionality.

### 4.4. Consistent UI Components

Both modelers implement parallel UI components to maintain consistency:

4.4.1. **Unified Toolbars**  
Standardized toolbar designs for common actions:
- New diagram creation
- Export functionality
- Import capabilities
- Undo operations

4.4.2. **Element Palettes**  
Consistent palette design for adding elements to both diagram types.

4.4.3. **Property Panels**  
Harmonized property editing interfaces across both modelers.

### 4.5. Data Persistence Layer

Each modeler implements appropriate persistence mechanisms:

4.5.1. **BPMN Storage**  
XML-based format stored in localStorage with the BPMN standard structure.

4.5.2. **ConDec Storage**  
JSON format with structured nodes and relations collections, also persisted to localStorage.

Separate storage keys prevent conflicts while maintaining consistent loading/saving patterns.

### 4.6. Responsive Interface Design

The interface adaptation is ensured through:

4.6.1. **Flexible Layout System**  
Flex-box based layout for major containers ensuring proper space distribution.

4.6.2. **Proportional Sizing**  
Percentage-based dimensions for modeler containers allowing appropriate scaling.

4.6.3. **Overflow Prevention**  
Careful management of minimum dimensions and overflow properties.

---

## 5. Technical Considerations

### 5.1. Performance Optimizations

5.1.1. **SVG Rendering Optimization**  
The ConDec modeler minimizes DOM manipulation through component-based rendering approaches.

5.1.2. **State Management Efficiency**  
Component state is carefully managed to prevent unnecessary re-rendering cycles.

5.1.3. **Event Handling Refinement**  
Mouse events are optimized to balance responsiveness with performance constraints.

### 5.2. UI/UX Design Decisions

5.2.1. **Visual Consistency Framework**  
Both modelers utilize consistent styling, button designs, and layout patterns.

5.2.2. **Mode and Selection Indicators**  
Clear visual indicators for active modes and selected elements.

5.2.3. **Interactive Feedback Mechanisms**  
Comprehensive feedback through hover states, selection highlighting, and drag operations.

5.2.4. **Contextual Action Presentation**  
Actions are presented contextually when relevant to the current state.

---

## 6. Future Development Roadmap

6.1. **Model Synchronization Capabilities**  
Future development could implement linking between BPMN and Declare elements for cross-model consistency.

6.2. **Enhanced Validation Frameworks**  
More sophisticated rules for constraints and relations validation could be implemented.

6.3. **Collaboration Features**  
Multi-user editing capabilities could be added for team-based modeling scenarios.

6.4. **Advanced Export Options**  
Additional export formats beyond basic JSON/XML could be developed for integration with other tools.

---

## 7. Conclusion

The BDM implementation successfully creates a unified modeling environment that maintains the specific advantages of both BPMN and Declare modeling paradigms while presenting users with a consistent interface. This approach significantly reduces the learning curve when switching between modeling approaches and enables more comprehensive business process modeling.

---

*End of Document*
