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
import BottomPanel from './components/layout/BottomPanel'

// 3. Wizards
import NewFileModal from './components/wizards/NewFileModal'
import PreambleWizard from './components/wizards/PreambleWizard'
import TableWizard from './components/wizards/TableWizard'
import PreambleWizardView from './components/wizards/PreambleWizardView'
import { AppSettings, DBFile } from './types'

const { Header, Content, Sider } = Layout

interface OpenedTab {
  key: string
  title: string
  type: 'file' | 'wizard'
  isDirty?: boolean
  // For files
  fileId?: number
  content?: string
  originalContent?: string
  // For wizards
  wizardType?: 'preamble' | 'table'
}

const App: React.FC = () => {
  const {
    token: { colorBorder }
  } = theme.useToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null)

  // --- STATE ---
  const [activeActivity, setActiveActivity] = useState<string>('explorer')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [treeData, setTreeData] = useState<any[]>([])
  const [dbFiles, setDbFiles] = useState<DBFile[]>([])
  const [openFiles, setOpenFiles] = useState<OpenedTab[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [statusText, setStatusText] = useState<string>('Ready')
  const [chapters, setChapters] = useState<string[]>([])
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [compilationLogs, setCompilationLogs] = useState<string>('')
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false)

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    fontSize: 14,
    minimap: true,
    wordWrap: false,
    lineNumbers: true
  })

  // Modals Visibility
  const [isNewFileOpen, setIsNewFileOpen] = useState(false)
  const [isPreambleOpen, setIsPreambleOpen] = useState(false)
  const [isTableOpen, setIsTableOpen] = useState(false)

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadFilesFromDB()
    }
    init()

    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveCurrentFile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId, openFiles])

  // --- DATA LOADING ---
  const loadFilesFromDB = async (): Promise<void> => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error)
      message.error('Failed to load files')
    }
  }

  const processFiles = (files: DBFile[]): void => {
    // Μετατροπή λίστας σε δενδροειδή μορφή για το SidePanel
    // (Ο κώδικας μετατροπής παραμένει εδώ καθώς αφορά τα δεδομένα του App)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  function handleEditorWillMount(monaco: Monaco): void {
    monaco.languages.register({ id: 'latex' })
    monaco.languages.setLanguageConfiguration('latex', latexConfiguration)
    monaco.languages.setMonarchTokensProvider('latex', latexLanguage)
    monaco.editor.defineTheme('datatex-dark', dataTexDarkTheme)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEditorDidMount(editor: any, monaco: Monaco): void {
    editorRef.current = editor
    monacoRef.current = monaco
    monaco.editor.setTheme('datatex-dark')
    const model = editor.getModel()
    if (model) monaco.editor.setModelLanguage(model, 'latex')
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => saveCurrentFile())
    editor.focus()
  }

  const insertTextAtCursor = (text: string): void => {
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
  const handleEditorChange = (value: string | undefined): void => {
    if (!activeFileId || value === undefined) return
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.key === activeFileId && f.type === 'file'
          ? { ...f, content: value, isDirty: value !== f.originalContent }
          : f
      )
    )
  }

  const handleCompile = async (): Promise<void> => {
    if (!activeFileId) return
    const currentFile = openFiles.find((f) => f.key === activeFileId)
    if (!currentFile || currentFile.type !== 'file' || !currentFile.content) return

    setStatusText('Compiling...')
    try {
      // First save content
      await saveCurrentFile()

      if (!window.api) {
        message.warning('API not available (Mock mode)')
        setStatusText('Ready')
        return
      }

      const result = await window.api.compileFile(currentFile.content)

      // Update logs regardless of success/failure
      setCompilationLogs(result.logs || '')

      if (result.success && result.data) {
        setPdfData(result.data)
        message.success('Compilation successful')
        setStatusText('Ready')
      } else {
        message.error('Compilation failed')
        setIsBottomPanelOpen(true) // Open bottom panel to show errors
        setStatusText('Compilation Failed')
      }
    } catch (error) {
      console.error(error)
      message.error('Compilation error')
      setStatusText('Error')
    }
  }

  const saveCurrentFile = async (): Promise<void> => {
    const currentFile = openFiles.find((f) => f.key === activeFileId)
    if (!currentFile || !currentFile.isDirty || currentFile.type !== 'file') return
    setStatusText('Saving...')
    try {
      if (window.api && currentFile.fileId)
        await window.api.updateFile(currentFile.fileId, currentFile.content || '')
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.key === currentFile.key ? { ...f, isDirty: false, originalContent: f.content } : f
        )
      )
      // Update dbFiles if needed
      if (currentFile.fileId) {
        setDbFiles((prev) =>
          prev.map((f) =>
            f.id === currentFile.fileId ? { ...f, content: currentFile.content || '' } : f
          )
        )
      }
      message.success('Saved!')
      setStatusText('Saved')
    } catch (err) {
      console.error(err)
      message.error('Failed to save')
      setStatusText('Error saving')
    }
  }

  const handleCreateFile = async (values: { title: string; chapter: string }): Promise<void> => {
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
      console.error(err)
      message.error('Failed to create')
    }
  }

  const handleDeleteFile = async (): Promise<void> => {
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
  const onNodeSelect = (selectedKeys: React.Key[]): void => {
    if (selectedKeys.length === 0) return
    const key = String(selectedKeys[0])
    if (key.startsWith('chapter-')) return
    const fileId = Number(key)
    const file = dbFiles.find((f) => f.id === fileId)
    if (file) {
      const existingTab = openFiles.find((f) => f.key === String(file.id))
      if (!existingTab) {
        setOpenFiles([
          ...openFiles,
          {
            key: String(file.id),
            title: file.title,
            type: 'file',
            fileId: file.id,
            content: file.content,
            originalContent: file.content,
            isDirty: false
          }
        ])
      }
      setActiveFileId(String(file.id))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const closeTab = (targetKey: string | any): void => {
    const newOpenFiles = openFiles.filter((f) => f.key !== targetKey)
    setOpenFiles(newOpenFiles)
    if (activeFileId === targetKey)
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].key : null)
  }

  const handleOpenWizard = (name: 'preamble' | 'table' | 'tikz'): void => {
    if (name === 'preamble') {
      const wizardKey = 'wizard-preamble'
      if (!openFiles.find((f) => f.key === wizardKey)) {
        setOpenFiles([
          ...openFiles,
          {
            key: wizardKey,
            title: 'Preamble Wizard',
            type: 'wizard',
            wizardType: 'preamble'
          }
        ])
      }
      setActiveFileId(wizardKey)
    } else if (name === 'table') {
      setIsTableOpen(true)
    }
  }

  const handleWizardInsert = (code: string): void => {
    // Find the last active file tab to insert code into, or just create a new file?
    // For now, let's create a new file with the code if no file is open, or append/insert to active file

    // If we are in the wizard tab, we need to find a target file.
    // Let's assume the user wants to copy-paste or we create a new file "Untitled.tex"

    const targetFile = openFiles.find((f) => f.type === 'file')

    if (targetFile) {
      // Switch to that file and insert
      setActiveFileId(targetFile.key)
      // Wait for render? We might need to handle this better.
      // For now, let's just append to content directly in state if editor ref is not available for that file immediately
      // Actually, let's use the insertTextAtCursor logic but we need to ensure the editor is focused on that file.

      // Better UX: Show a message "Code generated! Pasting to [File]..."
      setTimeout(() => insertTextAtCursor(code), 100)
    } else {
      // Create new file
      // Since we can't easily trigger "New File" flow from here without UI, let's just create a mock untitled file
      const newId = -Date.now() // temporary negative ID

      // We need to add it to DB files to be consistent or just OpenFiles?
      // Let's just add to OpenFiles for now as a scratchpad
      // Combine adding new file and closing wizard into one state update
      setOpenFiles((prev) => {
        // Filter out the wizard tab
        const withoutWizard = prev.filter((f) => f.key !== 'wizard-preamble')

        // Add the new file
        return [
          ...withoutWizard,
          {
            key: String(newId),
            title: 'Untitled.tex',
            type: 'file',
            fileId: newId,
            content: code,
            originalContent: '',
            isDirty: true
          }
        ]
      })
      setActiveFileId(String(newId))
    }

    // Just close the wizard tab if we inserted into existing file or created a new one
    closeTab('wizard-preamble')
  }

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorBgBase: '#1f1f1f' } }}>
      <Layout style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Layout style={{ flex: 1, overflow: 'hidden' }}>
          {/* 1. NEW ACTIVITY BAR COMPONENT */}
          <ActivityBar activeActivity={activeActivity} onActivityChange={setActiveActivity} />

          {/* 2. NEW SIDE PANEL COMPONENT */}
          <SidePanel
            activeActivity={activeActivity}
            treeData={treeData}
            onNodeSelect={onNodeSelect}
            onNewFile={() => setIsNewFileOpen(true)}
            onOpenWizard={handleOpenWizard}
            settings={settings}
            onUpdateSettings={(newSettings: Partial<AppSettings>) =>
              setSettings((prev) => ({ ...prev, ...newSettings }))
            }
          />

          {/* Αυτό το κομμάτι μπορεί να γίνει ξεχωριστό component "EditorArea.tsx" στο μέλλον */}
          <Layout style={{ flex: 1, minWidth: 0, background: '#1e1e1e' }}>
            <div style={{ height: 35, background: '#252526', display: 'flex', overflowX: 'auto' }}>
              {openFiles.length === 0 ? (
                <div style={{ padding: '8px 16px', color: '#888', fontSize: 12 }}>
                  No files open
                </div>
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
                    key: f.key,
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
                {activeFileId && openFiles.find((f) => f.key === activeFileId)?.title}
              </span>
              <div style={{ flex: 1 }} />
              {activeFileId && openFiles.find((f) => f.key === activeFileId)?.type === 'file' && (
                <>
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDeleteFile}
                    />
                  </Tooltip>
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
                    onClick={handleCompile}
                  >
                    Compile
                  </Button>
                </>
              )}
            </Header>

            <Layout>
              <Content style={{ height: '100%', background: '#1f1f1f', overflow: 'auto' }}>
                {activeFileId ? (
                  (() => {
                    const activeTab = openFiles.find((f) => f.key === activeFileId)
                    if (!activeTab) return null

                    if (activeTab.type === 'file') {
                      return (
                        <Editor
                          height="100%"
                          defaultLanguage="latex"
                          value={activeTab.content || ''}
                          onChange={handleEditorChange}
                          theme="datatex-dark"
                          beforeMount={handleEditorWillMount}
                          onMount={handleEditorDidMount}
                          options={{
                            minimap: { enabled: settings.minimap },
                            fontSize: settings.fontSize,
                            wordWrap: settings.wordWrap ? 'on' : 'off',
                            lineNumbers: settings.lineNumbers ? 'on' : 'off',
                            fontFamily: "'Fira Code', monospace"
                          }}
                        />
                      )
                    } else if (activeTab.type === 'wizard' && activeTab.wizardType === 'preamble') {
                      return <PreambleWizardView onInsert={handleWizardInsert} />
                    }
                    return null
                  })()
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
                    height: '100%',
                    background: '#525659', // Typical PDF viewer background
                    overflow: 'hidden'
                  }}
                >
                  {pdfData ? (
                    <embed
                      src={`data:application/pdf;base64,${pdfData}`}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                    />
                  ) : (
                    <Empty description="No PDF" imageStyle={{ opacity: 0.5 }} />
                  )}
                </div>
              </Sider>
            </Layout>
            <BottomPanel
              isVisible={isBottomPanelOpen}
              onClose={() => setIsBottomPanelOpen(false)}
              logs={compilationLogs}
            />
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
