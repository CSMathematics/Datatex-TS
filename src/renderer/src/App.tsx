import React, { useState, useRef, useEffect } from 'react'
import { Layout, theme, ConfigProvider, message, Modal, Tabs, Empty } from 'antd'
import { DeleteOutlined, SaveOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd' // Χρειάζονται για το Header που έμεινε εδώ

// 1. Monaco Editor & Theme
import Editor, { Monaco } from '@monaco-editor/react'
import { dataTexDarkTheme } from './themes/monaco-theme'
import { latexLanguage, latexConfiguration } from './languages/latex'

// 2. Layout Components
import ActivityBar from './components/layout/ActivityBar'
import SidePanel from './components/layout/SidePanel'
import StatusBar from './components/layout/StatusBar'

// 3. Wizards
import NewFileModal from './components/wizards/NewFileModal'
import PreambleWizard from './components/wizards/PreambleWizard'
import TableWizard from './components/wizards/TableWizard'

const { Header, Content, Sider } = Layout

// Interfaces (Μπορούν να μεταφερθούν στο types.d.ts)
interface DBFile {
  id: number
  title: string
  content: string
  type: string
  chapter: string
}
interface TabFile extends DBFile {
  isDirty?: boolean
  originalContent?: string
}

const App: React.FC = () => {
  const {
    token: { colorBgContainer, colorBorder }
  } = theme.useToken()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  // --- STATE ---
  const [activeActivity, setActiveActivity] = useState<string>('explorer')
  const [treeData, setTreeData] = useState<any[]>([])
  const [dbFiles, setDbFiles] = useState<DBFile[]>([])
  const [openFiles, setOpenFiles] = useState<TabFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>('Ready')
  const [chapters, setChapters] = useState<string[]>([])

  // Modals Visibility
  const [isNewFileOpen, setIsNewFileOpen] = useState(false)
  const [isPreambleOpen, setIsPreambleOpen] = useState(false)
  const [isTableOpen, setIsTableOpen] = useState(false)

  // --- INITIALIZATION ---
  useEffect(() => {
    loadFilesFromDB()
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCurrentFile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFileId, openFiles])

  // --- DATA LOADING ---
  const loadFilesFromDB = async () => {
    try {
      if (!window.api) {
        console.warn('API missing. Mock data loaded.')
        const mockFiles = [
          { id: 1, title: 'Demo.tex', content: '% Demo', type: 'tex', chapter: 'Demo' }
        ]
        setDbFiles(mockFiles)
        processFiles(mockFiles)
        return
      }
      const files = await window.api.getFiles()
      setDbFiles(files)
      processFiles(files)
    } catch (error: any) {
      message.error('Failed to load files')
    }
  }

  const processFiles = (files: DBFile[]) => {
    // Μετατροπή λίστας σε δενδροειδή μορφή για το SidePanel
    // (Ο κώδικας μετατροπής παραμένει εδώ καθώς αφορά τα δεδομένα του App)
    const treeMap: Record<string, any> = {}
    const uniqueChapters = new Set<string>()
    files.forEach((file) => {
      const chapterName = file.chapter || 'Uncategorized'
      uniqueChapters.add(chapterName)
      if (!treeMap[chapterName])
        treeMap[chapterName] = {
          title: chapterName,
          key: `chapter-${chapterName}`,
          icon: (
            <span role="img" aria-label="folder" className="anticon">
              📁
            </span>
          ),
          children: []
        }
      treeMap[chapterName].children.push({
        title: file.title,
        key: String(file.id),
        icon: (
          <span role="img" aria-label="file" className="anticon">
            📄
          </span>
        ),
        isLeaf: true,
        data: file
      })
    })
    setTreeData(Object.values(treeMap))
    setChapters(Array.from(uniqueChapters))
  }

  // --- EDITOR LOGIC ---
  function handleEditorWillMount(monaco: Monaco) {
    monaco.languages.register({ id: 'latex' })
    monaco.languages.setLanguageConfiguration('latex', latexConfiguration)
    monaco.languages.setMonarchTokensProvider('latex', latexLanguage)
    monaco.editor.defineTheme('datatex-dark', dataTexDarkTheme)
  }

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor
    monacoRef.current = monaco
    monaco.editor.setTheme('datatex-dark')
    const model = editor.getModel()
    if (model) monaco.editor.setModelLanguage(model, 'latex')
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => saveCurrentFile())
    editor.focus()
  }

  const insertTextAtCursor = (text: string) => {
    if (!editorRef.current || !activeFileId) {
      message.warning('Open a file first!')
      return
    }
    const position = editorRef.current.getPosition()
    editorRef.current.executeEdits('wizard', [
      {
        range: new monacoRef.current.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        text: text,
        forceMoveMarkers: true
      }
    ])
    editorRef.current.focus()
  }

  // --- FILE ACTIONS ---
  const handleEditorChange = (value: string | undefined) => {
    if (!activeFileId || value === undefined) return
    setOpenFiles((prev) =>
      prev.map((f) =>
        String(f.id) === activeFileId
          ? { ...f, content: value, isDirty: value !== f.originalContent }
          : f
      )
    )
  }

  const saveCurrentFile = async () => {
    const currentFile = openFiles.find((f) => String(f.id) === activeFileId)
    if (!currentFile || !currentFile.isDirty) return
    setStatusText('Saving...')
    try {
      if (window.api) await window.api.updateFile(currentFile.id, currentFile.content)
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.id === currentFile.id ? { ...f, isDirty: false, originalContent: f.content } : f
        )
      )
      setDbFiles((prev) =>
        prev.map((f) => (f.id === currentFile.id ? { ...f, content: currentFile.content } : f))
      )
      message.success('Saved!')
      setStatusText('Saved')
    } catch (err) {
      message.error('Failed to save')
      setStatusText('Error saving')
    }
  }

  const handleCreateFile = async (values: { title: string; chapter: string }) => {
    try {
      const newFilePayload = {
        title: values.title.endsWith('.tex') ? values.title : `${values.title}.tex`,
        chapter: values.chapter,
        type: 'tex',
        content: ''
      }
      if (window.api) await window.api.createFile(newFilePayload)
      else {
        // Mock fallback
        const newId = Math.max(...dbFiles.map((f) => f.id), 0) + 1
        const newFile = { id: newId, ...newFilePayload }
        setDbFiles([...dbFiles, newFile])
        processFiles([...dbFiles, newFile])
      }
      setIsNewFileOpen(false)
      loadFilesFromDB()
      message.success('File created')
    } catch (err) {
      message.error('Failed to create')
    }
  }

  const handleDeleteFile = async () => {
    if (!activeFileId) return
    Modal.confirm({
      title: 'Delete File',
      content: 'Are you sure?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        const id = Number(activeFileId)
        if (window.api) await window.api.deleteFile(id)
        else {
          const filtered = dbFiles.filter((f) => f.id !== id)
          setDbFiles(filtered)
          processFiles(filtered)
        }
        closeTab(activeFileId)
        message.success('Deleted')
      }
    })
  }

  // --- NAVIGATION HELPER ---
  const onNodeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) return
    const key = String(selectedKeys[0])
    if (key.startsWith('chapter-')) return
    const fileId = Number(key)
    const file = dbFiles.find((f) => f.id === fileId)
    if (file) {
      if (!openFiles.find((f) => f.id === file.id))
        setOpenFiles([...openFiles, { ...file, originalContent: file.content, isDirty: false }])
      setActiveFileId(String(file.id))
    }
  }

  const closeTab = (targetKey: string | any) => {
    const targetId = Number(targetKey)
    const newOpenFiles = openFiles.filter((f) => f.id !== targetId)
    setOpenFiles(newOpenFiles)
    if (activeFileId === String(targetId))
      setActiveFileId(
        newOpenFiles.length > 0 ? String(newOpenFiles[newOpenFiles.length - 1].id) : null
      )
  }

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorBgBase: '#1f1f1f' } }}>
      <Layout style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* 1. NEW ACTIVITY BAR COMPONENT */}
        <ActivityBar activeActivity={activeActivity} onActivityChange={setActiveActivity} />

        {/* 2. NEW SIDE PANEL COMPONENT */}
        <SidePanel
          activeActivity={activeActivity}
          treeData={treeData}
          onNodeSelect={onNodeSelect}
          onNewFile={() => setIsNewFileOpen(true)}
          onOpenWizard={(name) => {
            if (name === 'preamble') setIsPreambleOpen(true)
            if (name === 'table') setIsTableOpen(true)
          }}
        />

        {/* 3. MAIN EDITOR AREA (Tabs & Content) */}
        {/* Αυτό το κομμάτι μπορεί να γίνει ξεχωριστό component "EditorArea.tsx" στο μέλλον */}
        <Layout style={{ flex: 1, minWidth: 0, background: '#1e1e1e' }}>
          <div style={{ height: 35, background: '#252526', display: 'flex', overflowX: 'auto' }}>
            {openFiles.length === 0 ? (
              <div style={{ padding: '8px 16px', color: '#888', fontSize: 12 }}>No files open</div>
            ) : (
              <Tabs
                type="editable-card"
                activeKey={activeFileId || undefined}
                onChange={setActiveFileId}
                onEdit={closeTab}
                hideAdd
                size="small"
                items={openFiles.map((f) => ({
                  label: (
                    <span>
                      {f.title}
                      {f.isDirty && ' ●'}
                    </span>
                  ),
                  key: String(f.id),
                  closable: true
                }))}
                tabBarStyle={{ margin: 0, height: 35, borderBottom: '1px solid #303030' }}
              />
            )}
          </div>

          <Header
            style={{
              padding: '0 16px',
              background: '#1e1e1e',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${colorBorder}`
            }}
          >
            <span style={{ color: '#aaa', fontSize: 12 }}>
              {activeFileId && openFiles.find((f) => String(f.id) === activeFileId)?.title}
            </span>
            <div style={{ flex: 1 }} />
            {activeFileId && (
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} onClick={handleDeleteFile} />
              </Tooltip>
            )}
            <Tooltip title="Save">
              <Button
                type="text"
                icon={<SaveOutlined />}
                onClick={saveCurrentFile}
                style={{ color: '#ccc' }}
              />
            </Tooltip>
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              style={{ background: '#237804', marginLeft: 8 }}
            >
              Compile
            </Button>
          </Header>

          <Layout>
            <Content style={{ height: '100%', background: '#1f1f1f' }}>
              {activeFileId ? (
                <Editor
                  height="100%"
                  defaultLanguage="latex"
                  value={openFiles.find((f) => String(f.id) === activeFileId)?.content || ''}
                  onChange={handleEditorChange}
                  theme="datatex-dark"
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'Fira Code', monospace"
                  }}
                />
              ) : (
                <Empty
                  description="Select a file"
                  style={{ marginTop: 100 }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Content>
            <Sider
              width="40%"
              theme="light"
              style={{ borderLeft: `1px solid ${colorBorder}`, background: '#f0f0f0' }}
            >
              <div
                style={{
                  height: 32,
                  background: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 8,
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: '#555'
                }}
              >
                PDF PREVIEW
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}
              >
                <Empty description="No PDF" />
              </div>
            </Sider>
          </Layout>
        </Layout>

        {/* 4. NEW STATUS BAR COMPONENT */}
        <StatusBar text={statusText} />

        {/* 5. WIZARD MODALS */}
        <NewFileModal
          open={isNewFileOpen}
          onCancel={() => setIsNewFileOpen(false)}
          onCreate={handleCreateFile}
          chapters={chapters}
        />

        <PreambleWizard
          open={isPreambleOpen}
          onCancel={() => setIsPreambleOpen(false)}
          onInsert={(code) => {
            insertTextAtCursor(code)
            setIsPreambleOpen(false)
          }}
        />

        <TableWizard
          open={isTableOpen}
          onCancel={() => setIsTableOpen(false)}
          onInsert={(code) => {
            insertTextAtCursor(code)
            setIsTableOpen(false)
          }}
        />
      </Layout>
    </ConfigProvider>
  )
}

export default App
