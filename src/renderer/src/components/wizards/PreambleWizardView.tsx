import React from 'react'
import { Form, Input, Select, InputNumber, Checkbox, Divider, Switch, Button, Card } from 'antd'

const { Option } = Select

interface PreambleWizardViewProps {
  onInsert: (code: string) => void
}

const PreambleWizardView: React.FC<PreambleWizardViewProps> = ({ onInsert }) => {
  const [form] = Form.useForm()

  const handleGenerate = (): void => {
    form.validateFields().then((values) => {
      const { docClass, fontSize, packages, author, title, date } = values

      let code = `\\documentclass[${fontSize}pt]{${docClass}}\n`
      code += `\\usepackage[utf8]{inputenc}\n`

      if (packages) {
        packages.forEach((pkg: string) => {
          code += `\\usepackage{${pkg}}\n`
        })
      }

      code += `\n\\title{${title || 'Untitled'}}\n`
      code += `\\author{${author || ''}}\n`
      code += `\\date{${date ? '\\today' : ''}}\n`
      code += `\n\\begin{document}\n\n\\maketitle\n\n% Start writing here\n\n\\end{document}`

      onInsert(code)
      form.resetFields()
    })
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', color: '#fff' }}>
      <Card title="Preamble Wizard" bordered={false} style={{ background: '#252526' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ docClass: 'article', fontSize: 11, date: true }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item name="docClass" label="Document Class">
            <Select>
              <Option value="article">Article</Option>
              <Option value="report">Report</Option>
              <Option value="book">Book</Option>
              <Option value="beamer">Beamer (Presentation)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="fontSize" label="Font Size (pt)">
            <InputNumber min={8} max={14} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="packages" label="Common Packages">
            <Checkbox.Group style={{ width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Checkbox value="amsmath">amsmath (Mathematics)</Checkbox>
                <Checkbox value="graphicx">graphicx (Images)</Checkbox>
                <Checkbox value="geometry">geometry (Margins)</Checkbox>
                <Checkbox value="hyperref">hyperref (Links)</Checkbox>
                <Checkbox value="tikz">TikZ (Diagrams)</Checkbox>
                <Checkbox value="pgfplots">PGFPlots (Plots)</Checkbox>
              </div>
            </Checkbox.Group>
          </Form.Item>
          <Divider style={{ borderColor: '#444' }} />
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="author" label="Author" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="date" label="Include Date" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="title" label="Document Title">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleGenerate} block>
              Generate Preamble
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default PreambleWizardView
