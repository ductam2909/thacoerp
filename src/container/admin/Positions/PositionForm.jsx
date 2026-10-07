import React, { useEffect } from "react";
import { Form, Input, TreeSelect, Row, Col } from "antd";
import Modal from "../../../components/core/common/Modal";

const PositionForm = ({ open, onCancel, onSave, form, isEdit = false, positions = [] }) => {
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const positionOptions = positions.map((item) => ({
    id: item.positionId || item.id,
    pId: item.parentId || item.pId || null,
    value: item.positionId || item.id,
    title: item.positionName || item.name,
  }));

  return (
    <Modal
      title={isEdit ? "Cập nhật Chức vụ" : "Thêm mới Chức vụ"}
      open={open}
      onCancel={onCancel}
      onOk={onSave}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              label="Tên Chức vụ"
              name="positionName"
              rules={[{ required: true, message: 'Vui lòng nhập tên Chức vụ' }]}
            >
              <Input placeholder="Nhập tên chức vụ (VD: Giám đốc, Trưởng phòng...)" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              label="Trực thuộc (Chức vụ cha)"
              name="parentId"
            >
              <TreeSelect
                treeDataSimpleMode={true}
                treeData={positionOptions}
                placeholder="Chọn chức vụ cha (nếu có)"
                treeDefaultExpandAll
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              label="Mô tả"
              name="description"
            >
              <Input.TextArea rows={4} placeholder="Nhập mô tả cho chức vụ này" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default PositionForm;
