import React, { useState } from 'react'
import { Form, Input, Select, Button, Card, Tabs, Row, Col, Alert, Spin } from 'antd'
import { ReloadOutlined, CodeOutlined } from '@ant-design/icons'

const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select

interface TikzWizardViewProps {
  onInsert: (code: string) => void
}

const TikzWizardView: React.FC<TikzWizardViewProps> = ({ onInsert }) => {
  const [activeTab, setActiveTab] = useState('tikz')
  const [previewPdf, setPreviewPdf] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorLog, setErrorLog] = useState<string>('')

  // Forms for each tool
  const [tikzForm] = Form.useForm()
  const [pgfForm] = Form.useForm()
  const [mpForm] = Form.useForm()
  const [asyForm] = Form.useForm()

  // Generate code based on current tab and form values
  const generateCode = (): string => {
    if (activeTab === 'tikz') {
      const values = tikzForm.getFieldsValue()
      const { type, color, thickness, content, coordinates } = values

      let code = `\\begin{tikzpicture}\n`
      if (type === 'node') {
        code += `  \\node[draw, ${color}, ${thickness}] at (${coordinates || '0,0'}) {${content || 'Node'}};\n`
      } else if (type === 'circle') {
        code += `  \\draw[${color}, ${thickness}] (${coordinates || '0,0'}) circle (${content || '1cm'});\n`
      } else if (type === 'rectangle') {
        code += `  \\draw[${color}, ${thickness}] (${coordinates || '0,0'}) rectangle ++(${content || '2,1'});\n`
      } else if (type === 'line') {
        code += `  \\draw[${color}, ${thickness}] (${coordinates || '0,0'}) -- (${content || '2,2'});\n`
      } else {
        // Custom
        code += `  ${content || ''}\n`
      }
      code += `\\end{tikzpicture}`
      return code
    } else if (activeTab === 'pgfplots') {
      const values = pgfForm.getFieldsValue()
      const { type, func, domain, xlabel, ylabel } = values

      let code = `\\begin{tikzpicture}\n`
      code += `  \\begin{axis}[\n`
      code += `    xlabel={${xlabel || '$x$'}},\n`
      code += `    ylabel={${ylabel || '$y$'}},\n`
      if (type === '3d') code += `    view={60}{30},\n`
      code += `  ]\n`

      if (type === '2d') {
        code += `    \\addplot[blue, domain=${domain || '-5:5'}, samples=100] {${func || 'x^2'}};\n`
      } else {
        code += `    \\addplot3[surf, domain=${domain || '-2:2'}] {${func || 'x^2 + y^2'}};\n`
      }

      code += `  \\end{axis}\n`
      code += `\\end{tikzpicture}`
      return code
    } else if (activeTab === 'metapost') {
      const values = mpForm.getFieldsValue()
      const { content } = values
      return `\\begin{mpost}\n${content || 'draw (0,0)--(100,100);'}\n\\end{mpost}`
    } else if (activeTab === 'asymptote') {
      const values = asyForm.getFieldsValue()
      const { content } = values
      return `\\begin{asy}\n${content || 'draw((0,0)--(100,100));'}\n\\end{asy}`
    }
    return ''
  }

  const handleInsert = (): void => {
    onInsert(generateCode())
  }

  const handlePreview = async (): Promise<void> => {
    setLoading(true)
    setErrorLog('')
    setPreviewPdf(null)

    const code = generateCode()
    let fullDoc = ''

    if (activeTab === 'tikz') {
      fullDoc = `\\documentclass[border=2mm]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{shapes,arrows,positioning,calc}
\\begin{document}
${code}
\\end{document}`
    } else if (activeTab === 'pgfplots') {
      fullDoc = `\\documentclass[border=2mm]{standalone}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\begin{document}
${code}
\\end{document}`
    } else if (activeTab === 'metapost') {
      fullDoc = `\\documentclass{standalone}
\\usepackage[shellescape]{gmp}
\\begin{document}
${code}
\\end{document}`
    } else if (activeTab === 'asymptote') {
      fullDoc = `\\documentclass{standalone}
\\usepackage{asymptote}
\\begin{document}
${code}
\\end{document}`
    }

    try {
      if (window.api) {
        const result = await window.api.compileFile(fullDoc)
        if (result.success && result.data) {
          setPreviewPdf(result.data)
        } else {
          setErrorLog(result.logs || 'Unknown error')
        }
      } else {
        setErrorLog('API unavailable')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErrorLog(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto update preview when switching tabs (optional, but good UX)
  // useEffect(() => { handlePreview() }, [activeTab])

  return (
    <div
      style={{
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: '#ccc'
      }}
    >
      <Row gutter={[16, 16]} style={{ flex: 1 }}>
        <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            title="Configuration"
            bordered={false}
            style={{ background: '#252526', flex: 1, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflowY: 'auto' }}
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
              {/* TIKZ TAB */}
              <TabPane tab="TikZ" key="tikz">
                <Form
                  form={tikzForm}
                  layout="vertical"
                  initialValues={{ type: 'node', color: 'black', thickness: 'thin' }}
                >
                  <Form.Item name="type" label="Element Type">
                    <Select>
                      <Option value="node">Node</Option>
                      <Option value="circle">Circle</Option>
                      <Option value="rectangle">Rectangle</Option>
                      <Option value="line">Line</Option>
                      <Option value="custom">Custom Code</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                    {() => {
                      const type = tikzForm.getFieldValue('type')
                      return type === 'custom' ? (
                        <Form.Item name="content" label="Code">
                          <TextArea rows={6} style={{ fontFamily: 'monospace' }} />
                        </Form.Item>
                      ) : (
                        <>
                          <Form.Item name="coordinates" label="Coordinates (x,y)" help="e.g. 0,0">
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name="content"
                            label={
                              type === 'node'
                                ? 'Text'
                                : type === 'circle'
                                  ? 'Radius'
                                  : type === 'rectangle'
                                    ? 'Size (w,h)'
                                    : 'End Point'
                            }
                          >
                            <Input />
                          </Form.Item>
                          <Row gutter={8}>
                            <Col span={12}>
                              <Form.Item name="color" label="Color">
                                <Select>
                                  <Option value="black">Black</Option>
                                  <Option value="red">Red</Option>
                                  <Option value="blue">Blue</Option>
                                  <Option value="green">Green</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="thickness" label="Thickness">
                                <Select>
                                  <Option value="thin">Thin</Option>
                                  <Option value="thick">Thick</Option>
                                  <Option value="ultra thick">Ultra Thick</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                        </>
                      )
                    }}
                  </Form.Item>
                </Form>
              </TabPane>

              {/* PGFPLOTS TAB */}
              <TabPane tab="PGFPlots" key="pgfplots">
                <Form
                  form={pgfForm}
                  layout="vertical"
                  initialValues={{ type: '2d', func: 'x^2', domain: '-5:5' }}
                >
                  <Form.Item name="type" label="Plot Type">
                    <Select>
                      <Option value="2d">2D Plot</Option>
                      <Option value="3d">3D Surface</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="func" label="Function" help="e.g. x^2 or sin(deg(x))">
                    <Input />
                  </Form.Item>
                  <Form.Item name="domain" label="Domain" help="min:max">
                    <Input />
                  </Form.Item>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item name="xlabel" label="X Label">
                        <Input placeholder="$x$" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="ylabel" label="Y Label">
                        <Input placeholder="$y$" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </TabPane>

              {/* METAPOST TAB */}
              <TabPane tab="MetaPost" key="metapost">
                <Alert
                  message="Requires -shell-escape and gmp package."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form
                  form={mpForm}
                  layout="vertical"
                  initialValues={{ content: 'draw (0,0)--(100,0)--(50,86.6)--cycle;' }}
                >
                  <Form.Item name="content" label="MetaPost Code">
                    <TextArea rows={10} style={{ fontFamily: 'monospace' }} />
                  </Form.Item>
                </Form>
              </TabPane>

              {/* ASYMPTOTE TAB */}
              <TabPane tab="Asymptote" key="asymptote">
                <Alert
                  message="Requires Asymptote installed and configured."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form
                  form={asyForm}
                  layout="vertical"
                  initialValues={{ content: 'draw((0,0)--(100,100));' }}
                >
                  <Form.Item name="content" label="Asymptote Code">
                    <TextArea rows={10} style={{ fontFamily: 'monospace' }} />
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 16,
                borderTop: '1px solid #303030',
                display: 'flex',
                gap: 10
              }}
            >
              <Button
                type="primary"
                icon={<CodeOutlined />}
                onClick={handleInsert}
                style={{ flex: 1 }}
              >
                Insert Code
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handlePreview}>
                Update Preview
              </Button>
            </div>
          </Card>
        </Col>

        <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            title="Live Preview"
            bordered={false}
            style={{ background: '#252526', flex: 1, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, padding: 0, position: 'relative' }}
          >
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 10
                }}
              >
                <Spin size="large" tip="Compiling..." />
              </div>
            )}
            {previewPdf ? (
              <embed
                src={`data:application/pdf;base64,${previewPdf}`}
                type="application/pdf"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            ) : (
              <div style={{ padding: 20, color: '#666', textAlign: 'center' }}>
                {errorLog ? (
                  <div style={{ color: '#ff4d4f', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                    {errorLog}
                  </div>
                ) : (
                  'Click "Update Preview" to see the result.'
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TikzWizardView
