let connectModeState = {
  isActive: false,
  sourceNodeId: null,
};

/**
 * @param {string} sourceNodeId
 */
export function startConnectMode(sourceNodeId) {
  connectModeState.isActive = true;
  connectModeState.sourceNodeId = sourceNodeId;
}
export function endConnectMode() {
  connectModeState.isActive = false;
  connectModeState.sourceNodeId = null;
}

/**
 * @returns {{isActive: boolean, sourceNodeId: string|null}}
 */
export function getConnectModeState() {
  return { ...connectModeState };
}

/**
 * @param {string} nodeId
 * @returns {boolean}
 */
export function shouldHandleNodeClick(nodeId) {
  return connectModeState.isActive && connectModeState.sourceNodeId && nodeId !== connectModeState.sourceNodeId;
}
