import React from 'react';
const EditIcon = (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2000 2000"><path fill="currentColor" d="M1511.45 292.911a415.8 415.8 0 0 0-415.8 415.8a415.8 415.8 0 0 0 415.8 415.8a415.8 415.8 0 0 0 397.194-292.826l-298.378 79.95l-232.313-152.986l124.695-248.645l313.27-83.94A415.8 415.8 0 0 0 1511.45 292.91zm-492.602 555.194L96.6 1480.02c-28.476 84.174 63.924 222.774 158.995 227.068l902.881-618.354a415.8 415.8 0 0 1-139.626-240.63z"/></svg>
);

const DeleteIcon = (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048"><path fill="currentColor" d="m387.16 644.33l128.932 1231.742h1024.733l118.83-1231.51h-1272.5zm144.374 130.007h985.481l-94.107 971.506h-789.33z"/><path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.344" d="m7.033 1040.98l.944 7.503m5.013-7.503l-.943 7.503" transform="matrix(96.7529 0 0 87.18526 55.328 -89814.987)"/><path fill="currentColor" d="M758.125 337.314L343.5 458.662v60.722h1361v-60.722l-419.687-121.348z"/><path fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="69.952" d="M793.259 211.429h461.482v168.06H793.26z"/></svg>
);

const AppendIcon = (
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048"><rect width="17.563" height="14.478" x="1.23" y="1035.052" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.034" rx="2.759" transform="translate(55.328 -99820.702) scale(96.7529)"/></svg>
);

const ConnectIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 2048 2048"><path fill="currentColor" d="M1866.407 206.692s-585.454 298.724-882.844 438.406c63.707 58.178 122.963 120.927 184.437 181.407c-302.353 306.387-604.71 612.769-907.062 919.156c22.172 21.16 44.327 42.309 66.5 63.469c302.352-306.388 604.71-612.738 907.062-919.125c61.588 61.37 122.828 123.086 184.438 184.437c158.845-312.83 447.469-867.75 447.469-867.75z"/></svg>

);

const ACTION_ICONS = {
  edit: { icon: EditIcon, color: '#1976d2', title: 'Edit' },
  append: { icon: AppendIcon, color: '#388e3c', title: 'Append Activity' },
  delete: { icon: DeleteIcon, color: '#c62828', title: 'Delete' },
};

export function ConDecNodeMenu({
  node,
  diagram = { relations: [] },
  onEdit,
  onDelete,
  onAppend,
  onConnect,
  zoom = 1
}) {
  if (!node) return null;

  const actions = Object.entries(ACTION_ICONS);

  const ICON_SIZE = 22;
  const nodeWidth = 100;
  const nodeHeight = 50;
  const pad = 7 / zoom;
  const baseX = node.x + nodeWidth / 2 + pad;
  const baseY = node.y - nodeHeight / 2 - pad;

  const btnClass = "condec-context-btn";
  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${ICON_SIZE}px`,
    height: `${ICON_SIZE}px`,
    background: '#f7fafd',
    border: '1px solid #b0b8c1',
    margin: '0 2px',
    cursor: 'pointer',
    transition: 'none',
    outline: 'none',
    padding: 0
  };

  return (
    <>
      <style>
        {`
          .condec-context-btn:hover {
            opacity: 0.7;
            background: #e3eaf3;
            border-color: #1976d2;
          }
        `}
      </style>
      <g
        className="bpmn-context-pad"
        style={{ pointerEvents: 'all' }}
        transform={`translate(${baseX},${baseY}) scale(${1/zoom})`}
      >
        <foreignObject x={0} y={0} width={ICON_SIZE * 4} height={ICON_SIZE * 2 + 32}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'none', pointerEvents: 'all', alignItems: 'left' }}>
            {/* First row: edit, append, delete */}
            <div style={{ display: 'flex', gap: 4 }}>
              {actions.map(([key, action]) => (
                <button
                  key={key}
                  className={btnClass}
                  style={btnStyle}
                  title={action.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (key === 'edit' && onEdit) onEdit(node, e);
                    if (key === 'delete' && onDelete) onDelete(node);
                    if (key === 'append' && onAppend) onAppend(node);
                  }}
                >
                  {action.icon}
                </button>
              ))}
            </div>
            {/* Second row: connect (arrow) */}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button
                className={btnClass}
                style={btnStyle}
                title="Create Relation"
                onClick={e => {
                  e.stopPropagation();
                  if (onConnect) onConnect(node);
                }}
              >
                {ConnectIcon}
              </button>
            </div>
          </div>
        </foreignObject>
      </g>
    </>
  );
}
