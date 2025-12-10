import React from 'react'
import { Modal, Form, InputNumber, Switch } from 'antd'

interface TableWizardProps {
  open: boolean
  onCancel: () => void
  onInsert: (code: string) => void
}

const TableWizard: React.FC<TableWizardProps> = ({ open, onCancel, onInsert }) => {
  const [form] = Form.useForm()

  const handleGenerate = () => {
    form.validateFields().then((values) => {
      const { rows, cols, center, border } = values

      let code = center ? '\\begin{table}[h]\n\\centering\n' : ''
      const colStr = border ? `|${'c|'.repeat(cols)}` : 'c'.repeat(cols)

      code += `\\begin{tabular}{${colStr}}\n`
      if (border) code += '\\hline\n'

      let header = ''
      for (let j = 1; j <= cols; j++) header += `Header ${j} ${j < cols ? '& ' : ''}`
      code += `  ${header} \\\\\n`
      if (border) code += '\\hline\n'

      for (let i = 1; i <= rows; i++) {
        let rowStr = ''
        for (let j = 1; j <= cols; j++) rowStr += `Cell ${i},${j} ${j < cols ? '& ' : ''}`
        code += `  ${rowStr} \\\\\n`
        if (border) code += '\\hline\n'
      }

      code += '\\end{tabular}\n'
      if (center) code += '\\caption{My Table}\\end{table}'

      onInsert(code)
      form.resetFields()
    })
  }

  return (
    <Modal
      title="Table Wizard"
      open={open}
      onOk={handleGenerate}
      onCancel={onCancel}
      okText="Insert Table"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ rows: 3, cols: 3, center: true, border: true }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="rows" label="Rows" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
          <Form.Item name="cols" label="Columns" rules={[{ required: true }]}>
            <InputNumber min={1} />
          </Form.Item>
        </div>
        <Form.Item name="border" valuePropName="checked" label="Add Borders">
          <Switch />
        </Form.Item>
        <Form.Item name="center" valuePropName="checked" label="Center Table">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TableWizard
