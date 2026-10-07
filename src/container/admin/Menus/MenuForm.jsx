import React from "react";
import { Form, Input, Col, Row, TreeSelect } from "antd";
import Modal from "../../../components/core/common/Modal";


const MenuForm = ({ open, onCancel, onSave, form, isEdit, menus }) => {
  // Chuẩn bị dữ liệu cho TreeSelect (Menu cha)
  const renderTreeNodes = (data) =>
    data.map((item) => {
      if (item.children) {
        return (
          <TreeSelect.TreeNode
            value={item.menuId}
            title={item.menuName}
            key={item.menuId}
          >
            {renderTreeNodes(item.children)}
          </TreeSelect.TreeNode>
        );
      }
      return (
        <TreeSelect.TreeNode
          value={item.menuId}
          title={item.menuName}
          key={item.menuId}
        />
      );
    });

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={isEdit ? "Cập nhật Menu" : "Thêm mới Menu"}
      onOk={onSave}
      okText={isEdit ? "Cập nhật" : "Lưu"}
      cancelText="Hủy"
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        name="menu_form"
        initialValues={{ status: true }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="parentId"
              label="Menu cha"
              rules={[
                {
                  required: false,
                },
              ]}
            >
              <TreeSelect
                showSearch
                style={{ width: "100%" }}
                styles={{
                  popup: {
                    root: { maxHeight: 400, overflow: "auto" },
                  },
                }}
                placeholder="Chọn menu cha (để trống nếu là menu cấp 1)"
                allowClear
                treeDefaultExpandAll
              >
                {renderTreeNodes(menus)}
              </TreeSelect>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="menuName"
              label="Tên menu"
              rules={[
                { required: true, message: "Vui lòng nhập tên menu!" },
                {
                  max: 200,
                  message: "Tên menu không được vượt quá 200 ký tự!",
                },
              ]}
            >
              <Input placeholder="Nhập tên menu" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="url"
              label="URL"
            >
              <Input placeholder="Nhập URL (có thể để trống với menu cha)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="icon" label="Icon">
              <Input placeholder="Nhập tên icon" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="order" label="Thứ tự hiển thị">
              <Input type="number" placeholder="Nhập thứ tự" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default MenuForm;
