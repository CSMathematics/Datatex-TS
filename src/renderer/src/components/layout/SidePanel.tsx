import React from 'react'
import { Layout, Button, Tree, Tooltip } from 'antd'
import { PlusOutlined, FileAddOutlined, TableOutlined, ExperimentOutlined } from '@ant-design/icons'

const { Sider } = Layout

interface SidePanelProps {
  activeActivity: string
  treeData: any[]
  onNodeSelect: (selectedKeys: React.Key[]) => void
  onNewFile: () => void
  onOpenWizard: (wizardName: 'preamble' | 'table' | 'tikz') => void
}

const SidePanel: React.FC<SidePanelProps> = ({
  activeActivity,
  treeData,
  onNodeSelect,
  onNewFile,
  onOpenWizard
}) => {
  const renderContent = () => {
    switch (activeActivity) {
      case 'explorer':
        return (
          <>
            <div
              style={{
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #303030'
              }}
            >
              <span style={{ fontWeight: 'bold', color: '#bbb', fontSize: 11 }}>
                PROJECT EXPLORER
              </span>
              <Tooltip title="New File">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={onNewFile}
                  style={{ color: '#fff' }}
                />
              </Tooltip>
            </div>
            <Tree
              showIcon
              defaultExpandAll
              treeData={treeData}
              onSelect={onNodeSelect}
              style={{ background: 'transparent', color: '#ccc' }}
            />
          </>
        )
      case 'wizards':
        return (
          <div style={{ padding: 16 }}>
            <div
              style={{
                fontWeight: 'bold',
                color: '#bbb',
                fontSize: 11,
                marginBottom: 16,
                textTransform: 'uppercase'
              }}
            >
              Latex Generators
            </div>

            <Button
              type="primary"
              ghost
              block
              style={{ marginBottom: 12, textAlign: 'left', borderColor: '#303030', color: '#ccc' }}
              icon={<FileAddOutlined />}
              onClick={() => onOpenWizard('preamble')}
            >
              Quick Preamble
            </Button>

            <Button
              type="primary"
              ghost
              block
              style={{ marginBottom: 12, textAlign: 'left', borderColor: '#303030', color: '#ccc' }}
              icon={<TableOutlined />}
              onClick={() => onOpenWizard('table')}
            >
              Table Wizard
            </Button>

            <Button
              type="primary"
              ghost
              block
              style={{ marginBottom: 12, textAlign: 'left', borderColor: '#303030', color: '#ccc' }}
              icon={<ExperimentOutlined />}
              disabled
            >
              TikZ Builder (Soon)
            </Button>
          </div>
        )
      default:
        return <div style={{ padding: 16, color: '#888' }}>Select an activity</div>
    }
  }

  return (
    <Sider
      width={250}
      theme="dark"
      style={{ borderRight: `1px solid #303030`, backgroundColor: '#252526' }}
    >
      {renderContent()}
    </Sider>
  )
}

export default SidePanel
