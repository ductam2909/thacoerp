import React, { useEffect, useState } from "react";
import { Form, Input, Select, Row, Col } from "antd";
import Modal from "../../../components/core/common/Modal";
import { getRequest } from "../../../services/baseService";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";

const STATUS_OPTIONS = [
  { label: "Đã kích hoạt", value: true },
  { label: "Chưa kích hoạt", value: false },
];

const GLOBAL_ROLE_OPTIONS = [
  { label: "Admin", value: 1 },
  { label: "User", value: 2 },
];

const unwrapList = (response) => {
  const result =
    response?.data?.data ||
    response?.data ||
    response?.Data ||
    response;

  return Array.isArray(result)
    ? result
    : result?.items || result?.Items || [];
};

const normalizePositionOption = (item = {}) => {
  const value = item.positionId || item.id;
  const label = item.positionName || item.name;

  if (!value || !label) return null;

  return {
    value,
    label,
  };
};

const UserForm = ({
  open,
  onCancel,
  onSave,
  form,
  isEdit = false,
}) => {
  const [positions, setPositions] = useState([]);

  const fetchPositions = async () => {
    try {
      const response = await getRequest(
        API_ENDPOINTS.POSITION.GET_ALL,
      );

      setPositions(unwrapList(response));
    } catch (error) {
      console.error("Failed to fetch positions", error);
    }
  };

  useEffect(() => {
    if (!open) return;

    fetchPositions();
  }, [open]);

  const positionOptions = positions
    .map(normalizePositionOption)
    .filter(Boolean);

  return (
    <Modal
      title={
        isEdit
          ? "Cập nhật người dùng"
          : "Thêm mới người dùng"
      }
      open={open}
      onCancel={onCancel}
      onOk={onSave}
      okText="Lưu lại"
      cancelText="Hủy bỏ"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item
              label="Tên đăng nhập"
              name="userName"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng nhập tên đăng nhập",
                },
              ]}
            >
              <Input placeholder="Nhập tên đăng nhập" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="Tên người dùng"
              name="fullName"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng nhập tên người dùng",
                },
              ]}
            >
              <Input placeholder="Nhập tên người dùng" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập email",
                },
                {
                  type: "email",
                  message: "Email không hợp lệ",
                },
              ]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="Số điện thoại"
              name="phoneNumber"
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>

          {!isEdit && (
            <Col xs={24}>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng nhập mật khẩu",
                  },
                ]}
              >
                <Input.Password placeholder="Nhập mật khẩu" />
              </Form.Item>
            </Col>
          )}

          <Col xs={24}>
            <Form.Item
              label="Chức vụ"
              name="positionId"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn chức vụ",
                },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={positionOptions}
                placeholder="Chọn chức vụ"
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              label="Vai trò"
              name="globalRole"
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng chọn vai trò",
                },
              ]}
            >
              <Select
                options={GLOBAL_ROLE_OPTIONS}
                placeholder="Chọn vai trò"
              />
            </Form.Item>
          </Col>

          {isEdit && (
            <Col xs={24}>
              <Form.Item
                label="Trạng thái"
                name="isActive"
                rules={[
                  {
                    required: true,
                    message:
                      "Vui lòng chọn trạng thái",
                  },
                ]}
              >
                <Select
                  options={STATUS_OPTIONS}
                  placeholder="Chọn trạng thái"
                />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

export default UserForm;
