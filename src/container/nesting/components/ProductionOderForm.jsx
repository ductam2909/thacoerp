import React, { useEffect, useState } from "react";
import { Button, Col, Form, Input, Row, Space } from "antd";

const ProductionOderForm = ({ initialValues, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      commandCode: initialValues?.commandCode ?? initialValues?.code,
      orderName: initialValues?.orderName,
    });
  }, [form, initialValues]);

  const handleFinish = async (values) => {
    const payload = {
      ...values,
    };

    setSubmitting(true);
    try {
      await onSubmit?.(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Mã lệnh SX"
            name="commandCode"
            rules={[{ required: true, message: "Vui lòng nhập mã lệnh SX" }]}
          >
            <Input placeholder="Nhập mã lệnh SX" />
          </Form.Item>
        </Col>

        <Col xs={24}  md={12}>
          <Form.Item
            label="Tên đơn hàng"
            name="orderName"
            rules={[{ required: true, message: "Vui lòng nhập tên đơn hàng" }]}
          >
            <Input placeholder="Nhập tên đơn hàng" />
          </Form.Item>
        </Col>
      </Row>

      <div className="nesting-form-footer">
        <Space>
          <Button onClick={onCancel} disabled={submitting}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Lưu
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default ProductionOderForm;
