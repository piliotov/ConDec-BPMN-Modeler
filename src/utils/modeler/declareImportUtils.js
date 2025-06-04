import declareRelationTypeMap from './declareRelationTypeMap';
import { layoutConnection } from '../canvas/canvasUtils';
function normalizeNodePositions(nodes) {
  if (nodes.length === 0) return nodes;
  const minX = Math.min(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));
  const padding = 50;
  return nodes.map(node => ({
    ...node,
    x: node.x - minX + padding,
    y: node.y - minY + padding
  }));
}
export function importDeclareTxtWithLayout(txt) {
  let cleaned = txt.replace(/^\uFEFF/, '').replace(/\n?\s*#.*$/gm, '');
  cleaned = cleaned.replace(/'/g, '"');
  cleaned = cleaned.replace(/\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)\s*:/g, '"$1|||$2":');
  let dict;
  try {
    dict = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Could not parse TXT file as Declare Python dict: ${e && e.message ? e.message : e}`);
  }
  const filterRelationsByHighestMetrics = (constraintData) => {
    const nodeToNodeRelations = new Map();
    Object.entries(constraintData).forEach(([relationType, relations]) => {
      if (typeof relations === 'object' && !Array.isArray(relations)) {
        Object.entries(relations).forEach(([key, metrics]) => {
          if (typeof key === 'string' && key.includes('|||')) {
            const [sourceNode, targetNode] = key.split('|||');
            const pairKey = `${sourceNode}|||${targetNode}`;
            const combinedScore = (metrics.support || 0) + (metrics.confidence || 0);
            const relationInfo = {
              type: relationType,
              sourceNode,
              targetNode,
              support: metrics.support || 0,
              confidence: metrics.confidence || 0,
              combinedScore,
              metrics
            };
            if (!nodeToNodeRelations.has(pairKey)) {
              nodeToNodeRelations.set(pairKey, []);
            }
            nodeToNodeRelations.get(pairKey).push(relationInfo);
          }
        });
      }
    });
    const bestRelations = [];
    nodeToNodeRelations.forEach((relations, pairKey) => {
      if (relations.length > 0) {
        const bestRelation = relations.reduce((best, current) => {
          if (current.combinedScore > best.combinedScore) {
            return current;
          } else if (current.combinedScore === best.combinedScore) {
            if (current.confidence > best.confidence) {
              return current;
            } else if (current.confidence === best.confidence && current.support > best.support) {
              return current;
            }
          }
          return best;
        });
        bestRelations.push(bestRelation);
      }
    });
    return bestRelations;
  };
  const filteredRels = filterRelationsByHighestMetrics(dict);
  const nodeMap = new Map();
  const nodeConstraints = {};
  const relations = [];
  filteredRels.forEach((rel, idx) => {
    const { sourceNode, targetNode, type } = rel;
    const normType = declareRelationTypeMap[type.trim().toLowerCase()] || type.trim().toLowerCase();
    if (!nodeMap.has(sourceNode)) nodeMap.set(sourceNode, {
      id: `activity_${sourceNode}`,
      type: 'activity',
      name: sourceNode,
      x: 0,
      y: 0,
      constraint: null,
      constraintValue: null
    });
    if (!nodeMap.has(targetNode)) nodeMap.set(targetNode, {
      id: `activity_${targetNode}`,
      type: 'activity',
      name: targetNode,
      x: 0,
      y: 0,
      constraint: null,
      constraintValue: null
    });
    relations.push({
      id: `relation_${idx}`,
      type: normType,
      sourceId: `activity_${sourceNode}`,
      targetId: `activity_${targetNode}`,
      waypoints: [],
      support: rel.support,
      confidence: rel.confidence,
      originalConstraintType: rel.type
    });
  });
  for (const constraintType in dict) {
    const normType = declareRelationTypeMap[constraintType.trim().toLowerCase()] || constraintType.trim().toLowerCase();
    const value = dict[constraintType];
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const k in value) {
        if (typeof k === 'string' && !k.includes('|||')) {
          const nodeName = k;
          if (!nodeMap.has(nodeName)) nodeMap.set(nodeName, {
            id: `activity_${nodeName}`,
            type: 'activity',
            name: nodeName,
            x: 0,
            y: 0,
            constraint: null,
            constraintValue: null
          });
          nodeConstraints[nodeName] = {
            constraint: normType,
            constraintValue: value[k]
          };
        }
      }
    }
  }
  for (const [name, node] of nodeMap.entries()) {
    if (nodeConstraints[name]) {
      node.constraint = nodeConstraints[name].constraint;
      node.constraintValue = nodeConstraints[name].constraintValue;
    }
  }
  let nodes = Array.from(nodeMap.values());
  nodes = layoutNodesForceDirected(nodes, relations);
  nodes = normalizeNodePositions(nodes);
  const rels = relations.map(r => {
    const source = nodes.find(n => n.id === r.sourceId);
    const target = nodes.find(n => n.id === r.targetId);
    const sourceSize = { width: source.width || 100, height: source.height || 50 };
    const targetSize = { width: target.width || 100, height: target.height || 50 };
    return {
      ...r,
      waypoints: layoutConnection(source, target, sourceSize, targetSize)
    };
  });
  return { nodes, relations: rels };
}
export function importDeclareJsonWithLayout(jsonString) {
  let diagram;
  try {
    diagram = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (e) {
    throw new Error('Invalid JSON file.');
  }
  if (!diagram.nodes || !diagram.relations) {
    throw new Error('JSON must be a diagram object with nodes and relations.');
  }
  return diagram;
}
export function layoutNodesForceDirected(nodes, relations, iterations = 900) {
  const width = 1600, height = 1200;
  const nodeRadius = 80;
  const minSep = nodeRadius * 2.2;
  const k = Math.sqrt((width * height) / Math.max(nodes.length, 1));
  const center = { x: width / 2, y: height / 2 };
  const initialRadius = Math.max(350, 400 + nodes.length * 10);
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const rand = 1 + (Math.random() - 0.5) * 0.15;
    n.x = center.x + initialRadius * Math.cos(angle) * rand;
    n.y = center.y + initialRadius * Math.sin(angle) * rand;
  });
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      let dx = 0, dy = 0;
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const nx = nodes[i].x - nodes[j].x;
        const ny = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(nx * nx + ny * ny) || 0.01;
        if (dist < minSep) {
          dx += (nx / dist) * (minSep - dist) * 1.5;
          dy += (ny / dist) * (minSep - dist) * 1.5;
        }
      }
      nodes[i].x += dx * 0.09;
      nodes[i].y += dy * 0.09;
    }
    relations.forEach(rel => {
      const source = nodes.find(n => n.id === rel.sourceId);
      const target = nodes.find(n => n.id === rel.targetId);
      if (!source || !target) return;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const desired = k * 1.2;
      const force = (dist - desired) * 0.014;
      const fx = dx / dist * force;
      const fy = dy / dist * force;
      source.x += fx;
      source.y += fy;
      target.x -= fx;
      target.y -= fy;
    });
    nodes.forEach(n => {
      n.x += (center.x - n.x) * 0.012;
      n.y += (center.y - n.y) * 0.012;
    });
  }
  let changed = true;
  let nudgeTries = 0;
  while (changed && nudgeTries < 10) {
    changed = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nx = nodes[i].x - nodes[j].x;
        const ny = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(nx * nx + ny * ny) || 0.01;
        if (dist < minSep) {
          const push = (minSep - dist) / 2;
          const px = (nx / dist) * push;
          const py = (ny / dist) * push;
          nodes[i].x += px;
          nodes[i].y += py;
          nodes[j].x -= px;
          nodes[j].y -= py;
          changed = true;
        }
      }
    }
    nudgeTries++;
  }
  nodes.forEach(n => {
    n.x = Math.max(nodeRadius, Math.min(width - nodeRadius, n.x));
    n.y = Math.max(nodeRadius, Math.min(height - nodeRadius, n.y));
  });
  return nodes;
}
export function importDeclareXmlWithLayout(xmlString) {
  let parser = new DOMParser();
  let xml = parser.parseFromString(xmlString, "application/xml");
  const activityNodes = Array.from(xml.querySelectorAll('activitydefinitions > activity'));
  const nodes = activityNodes.map(act => ({
    id: `activity_${act.getAttribute('name')}`,
    type: 'activity',
    name: act.getAttribute('name'),
    x: 0,
    y: 0,
    constraint: null,
    constraintValue: null
  }));
  const nodeMap = new Map(nodes.map(n => [n.name, n]));
  const constraintNodes = Array.from(xml.querySelectorAll('constraintdefinitions > constraint'));
  const relations = [];
  constraintNodes.forEach((c, idx) => {
    let type = c.querySelector('name')?.textContent || 'unknown';
    type = declareRelationTypeMap[type.trim().toLowerCase()] || type.trim().toLowerCase();
    const params = Array.from(c.querySelectorAll('constraintparameters > parameter'));
    if (params.length === 2) {
      const target = params[0].querySelector('branch')?.getAttribute('name');
      const source = params[1].querySelector('branch')?.getAttribute('name');
      if (source && target) {
        relations.push({
          id: `relation_${idx}`,
          type,
          sourceId: `activity_${source}`,
          targetId: `activity_${target}`,
          waypoints: []
        });
      }
    } else if (params.length === 1) {
      const nodeName = params[0].querySelector('branch')?.getAttribute('name');
      if (nodeName && nodeMap.has(nodeName)) {
        nodeMap.get(nodeName).constraint = type;
        const template = c.querySelector('template');
        let value = null;
        if (template) {
          const display = template.querySelector('display')?.textContent;
          if (display) {
            if (type === 'existence' && /^1\.\./.test(display)) {
              value = 1;
            } else {
              const match = display.match(/(\d+)/);
              if (match) value = parseInt(match[1], 10);
            }
          }
        }
        if (value !== null) nodeMap.get(nodeName).constraintValue = value;
      }
    }
  });
  const placedNodes = layoutNodesForceDirected(Array.from(nodeMap.values()), relations);
  const normalizedNodes = normalizeNodePositions(placedNodes);
  const rels = relations.map(r => {
    const source = normalizedNodes.find(n => n.id === r.sourceId);
    const target = normalizedNodes.find(n => n.id === r.targetId);
    const sourceSize = { width: source.width || 100, height: source.height || 50 };
    const targetSize = { width: target.width || 100, height: target.height || 50 };
    return {
      ...r,
      waypoints: layoutConnection(source, target, sourceSize, targetSize)
    };
  });
  return { nodes: normalizedNodes, relations: rels };
}
