import React, { useState } from 'react'
import {
  Form,
  Input,
  Select,
  InputNumber,
  Checkbox,
  Switch,
  Button,
  Card,
  Tabs,
  Row,
  Col,
  Radio
} from 'antd'

const { Option } = Select
const { TabPane } = Tabs

interface PreambleWizardViewProps {
  onInsert: (code: string) => void
}

const PreambleWizardView: React.FC<PreambleWizardViewProps> = ({ onInsert }) => {
  const [form] = Form.useForm()

  // State for preview
  const [, setPaperSize] = useState('a4paper')
  const [, setUnit] = useState('cm')
  const [margins, setMargins] = useState({ top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 })
  const [columns, setColumns] = useState(1)
  const [columnSep, setColumnSep] = useState(0.5)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerSkip, setFooterSkip] = useState(0)
  const [marginNotes, setMarginNotes] = useState(false)
  const [marginWidth, setMarginWidth] = useState(3.5)
  const [marginSep, setMarginSep] = useState(0.5)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleValuesChange = (_: any, allValues: any): void => {
    if (allValues.paperSize) setPaperSize(allValues.paperSize)
    if (allValues.unit) setUnit(allValues.unit)

    const newMargins = { ...margins }
    if (allValues.marginTop !== undefined) newMargins.top = allValues.marginTop
    if (allValues.marginBottom !== undefined) newMargins.bottom = allValues.marginBottom
    if (allValues.marginLeft !== undefined) newMargins.left = allValues.marginLeft
    if (allValues.marginRight !== undefined) newMargins.right = allValues.marginRight
    setMargins(newMargins)

    if (allValues.columns) setColumns(allValues.columns === 'two' ? 2 : 1)
    if (allValues.columnSep !== undefined) setColumnSep(allValues.columnSep)

    if (allValues.headHeight !== undefined) setHeaderHeight(allValues.headHeight)
    if (allValues.footSkip !== undefined) setFooterSkip(allValues.footSkip)

    if (allValues.marginNotes !== undefined) setMarginNotes(allValues.marginNotes)
    if (allValues.marginWidth !== undefined) setMarginWidth(allValues.marginWidth)
    if (allValues.marginSep !== undefined) setMarginSep(allValues.marginSep)
  }

  const handleGenerate = (): void => {
    form.validateFields().then((values) => {
      const {
        docClass,
        fontSize,
        packages,
        author,
        title,
        date,
        // Geometry
        paperSize,
        unit,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        columns,
        columnSep,
        headHeight,
        footSkip,
        marginNotes,
        marginWidth,
        marginSep
      } = values

      let code = `\\documentclass[${fontSize}pt`
      if (columns === 'two') code += `, twocolumn`
      code += `]{${docClass}}\n`
      code += `\\usepackage[utf8]{inputenc}\n`

      // Geometry Package
      let geometryOptions = `${paperSize}`
      geometryOptions += `, top=${marginTop}${unit}, bottom=${marginBottom}${unit}`
      geometryOptions += `, left=${marginLeft}${unit}, right=${marginRight}${unit}`

      if (headHeight > 0) geometryOptions += `, headheight=${headHeight}${unit}`
      if (footSkip > 0) geometryOptions += `, footskip=${footSkip}${unit}`

      if (columns === 'two' && columnSep) geometryOptions += `, columnsep=${columnSep}${unit}`

      if (marginNotes) {
        geometryOptions += `, marginparwidth=${marginWidth}${unit}, marginparsep=${marginSep}${unit}`
      }

      code += `\\usepackage[${geometryOptions}]{geometry}\n`

      if (packages) {
        packages.forEach((pkg: string) => {
          if (pkg !== 'geometry')
            // Already added
            code += `\\usepackage{${pkg}}\n`
        })
      }

      code += `\n\\title{${title || 'Untitled'}}\n`
      code += `\\author{${author || ''}}\n`
      code += `\\date{${date ? '\\today' : ''}}\n`
      code += `\n\\begin{document}\n\n\\maketitle\n\n% Start writing here\n\\section{Introduction}\n\n\\end{document}`

      onInsert(code)
    })
  }

  // Visualization helper
  // We'll normalize everything to pixels for the preview container (e.g. 300px width)
  // A4 ratio is ~1.414
  const previewWidth = 300
  const previewHeight = previewWidth * 1.414

  // Convert unit to 'preview pixels' approx
  // Let's say A4 (21cm) -> 300px => 1cm = 14.28px
  const cmToPx = previewWidth / 21

  // Calculate margins in px
  const mTop = margins.top * cmToPx
  const mBottom = margins.bottom * cmToPx
  const mLeft = margins.left * cmToPx
  const mRight = margins.right * cmToPx

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', gap: 24, color: '#fff' }}>
      <div style={{ flex: 2, overflowY: 'auto' }}>
        <Card title="Preamble Configuration" bordered={false} style={{ background: '#252526' }}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            initialValues={{
              docClass: 'article',
              fontSize: 11,
              date: true,
              paperSize: 'a4paper',
              unit: 'cm',
              marginTop: 2.5,
              marginBottom: 2.5,
              marginLeft: 2.5,
              marginRight: 2.5,
              columns: 'one',
              columnSep: 0.5,
              headHeight: 0,
              footSkip: 0,
              marginNotes: false,
              marginWidth: 3.5,
              marginSep: 0.5
            }}
          >
            <Tabs defaultActiveKey="geometry" type="card">
              <TabPane tab="Options" key="options">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="docClass" label="Document Class">
                      <Select>
                        <Option value="article">Article</Option>
                        <Option value="report">Report</Option>
                        <Option value="book">Book</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="fontSize" label="Font Size (pt)">
                      <InputNumber min={8} max={14} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="title" label="Document Title">
                  <Input />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item name="author" label="Author">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="date" label="Include Date" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="Packages" key="packages">
                <Form.Item name="packages" label="Common Packages">
                  <Checkbox.Group style={{ width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Checkbox value="amsmath">amsmath (Mathematics)</Checkbox>
                      <Checkbox value="graphicx">graphicx (Images)</Checkbox>
                      <Checkbox value="hyperref">hyperref (Links)</Checkbox>
                      <Checkbox value="tikz">TikZ (Diagrams)</Checkbox>
                      <Checkbox value="pgfplots">PGFPlots (Plots)</Checkbox>
                      <Checkbox value="fancyhdr">fancyhdr (Headers)</Checkbox>
                      <Checkbox value="babel">babel (Languages)</Checkbox>
                      <Checkbox value="csquotes">csquotes (Quotes)</Checkbox>
                    </div>
                  </Checkbox.Group>
                </Form.Item>
              </TabPane>

              <TabPane tab="Geometry" key="geometry">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="paperSize" label="Paper Size">
                      <Select>
                        <Option value="a4paper">A4 Paper</Option>
                        <Option value="letterpaper">Letter Paper</Option>
                        <Option value="a5paper">A5 Paper</Option>
                        <Option value="b5paper">B5 Paper</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="unit" label="Unit">
                      <Select>
                        <Option value="cm">cm</Option>
                        <Option value="mm">mm</Option>
                        <Option value="in">in</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Columns">
                  <Form.Item name="columns" noStyle>
                    <Radio.Group>
                      <Radio value="one">One column</Radio>
                      <Radio value="two">Two columns</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Form.Item>
                <Form.Item shouldUpdate={(prev, curr) => prev.columns !== curr.columns}>
                  {() => {
                    return form.getFieldValue('columns') === 'two' ? (
                      <Form.Item name="columnSep" label="Column Sep">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    ) : null
                  }}
                </Form.Item>

                <div
                  style={{ background: '#303030', padding: 10, borderRadius: 4, marginBottom: 16 }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Margins</div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="marginTop" label="Top">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="marginBottom" label="Bottom">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="marginLeft" label="Left">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="marginRight" label="Right">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                <div
                  style={{ background: '#303030', padding: 10, borderRadius: 4, marginBottom: 16 }}
                >
                  <Form.Item name="marginNotes" valuePropName="checked" style={{ marginBottom: 8 }}>
                    <Checkbox>Enable Margin Notes</Checkbox>
                  </Form.Item>
                  <Form.Item shouldUpdate={(prev, curr) => prev.marginNotes !== curr.marginNotes}>
                    {() => {
                      return form.getFieldValue('marginNotes') ? (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item name="marginSep" label="Margin Sep">
                              <InputNumber step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="marginWidth" label="Margin Width">
                              <InputNumber step={0.1} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                      ) : null
                    }}
                  </Form.Item>
                </div>

                <div style={{ background: '#303030', padding: 10, borderRadius: 4 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Header / Footer</div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="headHeight" label="Header Height">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="footSkip" label="Footer Skip">
                        <InputNumber step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </TabPane>
            </Tabs>

            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" onClick={handleGenerate} block size="large">
                Generate Code
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card
          title="Layout Preview"
          bordered={false}
          style={{
            background: '#252526',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          bodyStyle={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1e1e1e'
          }}
        >
          <div
            style={{
              width: previewWidth,
              height: previewHeight,
              background: 'white',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'all 0.3s'
            }}
          >
            {/* MARGINS VISUALIZATION (using borders or inner div) */}
            <div
              style={{
                position: 'absolute',
                top: mTop,
                left: mLeft,
                right: mRight,
                bottom: mBottom,
                border: '1px dashed #ccc',
                background: '#f9f9f9',
                display: 'flex',
                gap: columnSep * cmToPx
              }}
            >
              {/* BODY CONTENT */}
              {Array.from({ length: columns }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1890ff',
                    fontSize: 10
                  }}
                >
                  Body
                </div>
              ))}
            </div>

            {/* HEADER */}
            {headerHeight > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: mTop - headerHeight * cmToPx - 5, // Just visual offset
                  left: mLeft,
                  right: mRight,
                  height: headerHeight * cmToPx,
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f5222d'
                }}
              >
                Header
              </div>
            )}

            {/* FOOTER */}
            {footerSkip > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: mBottom - footerSkip * cmToPx, // Approximate visual position
                  left: mLeft,
                  right: mRight,
                  height: 10, // Fixed height visual for footer line
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f5222d'
                }}
              >
                Footer
              </div>
            )}

            {/* MARGIN NOTES */}
            {marginNotes && (
              <div
                style={{
                  position: 'absolute',
                  top: mTop,
                  left: previewWidth - mRight + marginSep * cmToPx,
                  width: marginWidth * cmToPx,
                  bottom: mBottom,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#52c41a',
                  writingMode: 'vertical-rl'
                }}
              >
                Notes
              </div>
            )}
          </div>
          <div style={{ marginTop: 20, color: '#666', fontSize: 12 }}>* Preview is approximate</div>
        </Card>
      </div>
    </div>
  )
}

export default PreambleWizardView
