export function calculateNodeEditMenuPosition(node, zoom, canvasOffset, canvasRef, editMenuSize) {
  const nodeWidth = node.width || 100;
  const nodeHeight = node.height || 50;
  const FLOATING_MENU_ICON_SIZE = 22;
  const FLOATING_MENU_GAP = 4;
  const FLOATING_MENU_WIDTH = FLOATING_MENU_ICON_SIZE * 3 + FLOATING_MENU_GAP * 2; // 3 icons in first row
  const FLOATING_MENU_HEIGHT = FLOATING_MENU_ICON_SIZE * 2 + FLOATING_MENU_GAP + 4; // 2 rows + spacing
  const MENU_SPACING = 12;
  const editMenuWidth = editMenuSize.width || 320;
  const editMenuHeight = editMenuSize.height || 430;
  const svgElement = canvasRef.current;
  if (!svgElement) return { x: null, y: null };
  const svgRect = svgElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const floatingMenuPad = 7 / zoom;
  const floatingMenuBaseX = node.x + nodeWidth / 2 + floatingMenuPad;
  const floatingMenuBaseY = node.y - nodeHeight / 2 - floatingMenuPad;
  const floatingMenuScreenX = (floatingMenuBaseX * zoom) + canvasOffset.x + svgRect.left;
  const floatingMenuScreenY = (floatingMenuBaseY * zoom) + canvasOffset.y + svgRect.top;
  const spaceRight = viewportWidth - (floatingMenuScreenX + FLOATING_MENU_WIDTH);
  const spaceLeft = floatingMenuScreenX;
  const spaceBelow = viewportHeight - (floatingMenuScreenY + FLOATING_MENU_HEIGHT);
  const spaceAbove = floatingMenuScreenY;

  let screenX, screenY;
  if (spaceRight >= editMenuWidth + MENU_SPACING) {
    screenX = floatingMenuScreenX + FLOATING_MENU_WIDTH + MENU_SPACING;
  } else if (spaceLeft >= editMenuWidth + MENU_SPACING) {
    screenX = floatingMenuScreenX - editMenuWidth - MENU_SPACING;
  } else {
    const nodeScreenX = (node.x * zoom) + canvasOffset.x + svgRect.left;
    screenX = nodeScreenX - editMenuWidth / 2;
    screenX = Math.max(10, Math.min(screenX, viewportWidth - editMenuWidth - 10));
  }
  if (spaceBelow >= editMenuHeight + MENU_SPACING) {
    screenY = floatingMenuScreenY + FLOATING_MENU_HEIGHT + MENU_SPACING;
  } else if (spaceAbove >= editMenuHeight + MENU_SPACING) {
    screenY = floatingMenuScreenY - editMenuHeight - MENU_SPACING;
  } else {
    screenY = floatingMenuScreenY;
    if (screenY + editMenuHeight > viewportHeight - 10) {
      screenY = viewportHeight - editMenuHeight - 10;
    }
    if (screenY < 10) {
      screenY = 10;
    }
  }

  return { x: screenX, y: screenY };
}

export function createMenuSizeChangeHandler(setEditMenuSize) {
  return (size) => {
    if (size && size.width && size.height) {
      setEditMenuSize(size);
    }
  };
}
