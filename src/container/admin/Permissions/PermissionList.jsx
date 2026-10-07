import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Col, Form, Input, Row, Select, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "../../../components/core/common/PageContainer";
import Table from "../../../components/core/common/Table";
import Modal from "../../../components/core/common/Modal";
import ModalConfirm from "../../../components/core/common/ModalConfirm";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../../services/baseService";
import { getMenus } from "../../../services/menuService";
import { toast } from "../../../utils/notification";

const ACTION_LABELS = {
  View: "Xem",
  Create: "Thêm",
  Update: "Cập nhật",
  Delete: "Xóa",
  UpdateStatus: "Cập nhật trạng thái",
  Assign: "Phân công",
  Manage: "Quản lý",
  Upload: "Tải lên",
  Download: "Tải xuống",
  Export: "Xuất file",
  Import: "Nhập file",
  Approve: "Phê duyệt",
  AssignPermission: "Gán quyền",
  // ManageMember: "Quản lý thành viên",
  Promote: "Quyền QL",
  Demote: "Xóa quyền QL",
  ToggleStatus: "Bật/tắt trạng thái",
  ViewReport: "Xem báo cáo",
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const getActionLabel = (action) => ACTION_LABELS[action] ?? action;
const getActionOrder = (action) => {
  const index = ALL_ACTIONS.indexOf(action);
  return index >= 0 ? index + 1 : ALL_ACTIONS.length + 1;
};
const unwrapList = (response) => {
  const result =
    response?.data?.data || response?.data || response?.Data || response;
  return Array.isArray(result) ? result : result?.items || result?.Items || [];
};
const flattenMenus = (menus = [], level = 0) =>
  menus.flatMap((menu) => [
    {
      value: menu.id || menu.menuId,
      label: `${"— ".repeat(level)}${menu.name || menu.menuName}`,
    },
    ...flattenMenus(menu.children || [], level + 1),
  ]);
const parseCode = (code = "") => {
  const index = code.lastIndexOf(".");
  return index > 0
    ? { functionName: code.slice(0, index), action: code.slice(index + 1) }
    : { functionName: code, action: "" };
};

const PermissionList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedMenuId = searchParams.get("menuId");
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [menuOptions, setMenuOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [canUpdate, setCanUpdate] = useState(false); // Set to true to enable updates
  const selectedFormActions = Form.useWatch("actions", form) || [];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permissions, menus] = await Promise.all([
        getRequest(API_ENDPOINTS.PERMISSION.GET_ALL),
        getMenus({ force: false, scope: "all" }),
      ]);
      setData(unwrapList(permissions));
      setMenuOptions(flattenMenus(menus).filter((item) => item.value));
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Không thể tải danh sách quyền.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const matrixData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const rows = new Map();

    data.forEach((permission) => {
      const menuId = permission.menuId || permission.menu?.id;
      if (selectedMenuId && menuId !== selectedMenuId) return;
      const { functionName, action } = parseCode(permission.code);
      if (!functionName || !action) return;
      const key = `${menuId || "common"}:${functionName}`;
      if (!rows.has(key)) {
        rows.set(key, {
          key,
          functionName,
          menuId,
          menuName: permission.menuName || permission.menu?.name,
          permissions: {},
        });
      }
      rows.get(key).permissions[action.toLowerCase()] = permission;
    });

    return Array.from(rows.values()).filter(
      (row) =>
        !keyword ||
        [row.functionName, row.menuName].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
        ),
    );
  }, [data, search, selectedMenuId]);

  const closeForm = () => {
    setOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const functionName = values.functionName.trim();
      const selectedActions = values.actions || [];
      const descriptions = values.descriptions || {};

      if (editingRecord) {
        const selectedActionKeys = new Set(
          selectedActions.map((action) => action.toLowerCase()),
        );
        const requests = [];

        selectedActions.forEach((action) => {
          const permission = editingRecord.permissions[action.toLowerCase()];
          const payload = {
            code: `${functionName}.${action}`,
            name: `${action} ${functionName}`,
            description: descriptions[action]?.trim() || null,
            menuId: values.menuId || null,
            orderDisplay: getActionOrder(action),
          };
          const permissionId = permission?.id || permission?.permissionId;

          requests.push(
            permissionId
              ? putRequest(
                  API_ENDPOINTS.PERMISSION.UPDATE_BY_ID.replace(
                    "{permissionId}",
                    permissionId,
                  ),
                  payload,
                )
              : postRequest(API_ENDPOINTS.PERMISSION.CREATE, payload),
          );
        });

        Object.entries(editingRecord.permissions).forEach(
          ([action, permission]) => {
            if (selectedActionKeys.has(action)) return;
            const permissionId = permission.id || permission.permissionId;
            if (permissionId) {
              requests.push(
                deleteRequest(
                  API_ENDPOINTS.PERMISSION.DELETE_BY_ID.replace(
                    "{permissionId}",
                    permissionId,
                  ),
                ),
              );
            }
          },
        );

        setLoading(true);
        await Promise.all(requests);
        toast.success("Đã cập nhật quyền thành công!");
        closeForm();
        await fetchData();
        return;
      }

      const existingCodes = new Set(
        data
          .filter(
            (item) =>
              (item.menuId || item.menu?.id || null) ===
              (values.menuId || null),
          )
          .map((item) => String(item.code).toLowerCase()),
      );
      const payloads = selectedActions
        .map((action) => ({
          code: `${functionName}.${action}`,
          name: `${action} ${functionName}`,
          description: descriptions[action]?.trim() || null,
          menuId: values.menuId || null,
          orderDisplay: getActionOrder(action),
        }))
        .filter((payload) => !existingCodes.has(payload.code.toLowerCase()));

      if (payloads.length === 0) {
        toast.warning("Các quyền đã chọn đều đã tồn tại.");
        return;
      }
      setLoading(true);
      await Promise.all(
        payloads.map((payload) =>
          postRequest(API_ENDPOINTS.PERMISSION.CREATE, payload),
        ),
      );
      toast.success(`Đã thêm ${payloads.length} quyền thành công!`);
      closeForm();
      await fetchData();
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Failed to save permission:", error);
      toast.error(error?.response?.data?.message || "Không thể lưu quyền.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await Promise.all(
        deleteIds.map((permissionId) =>
          deleteRequest(
            API_ENDPOINTS.PERMISSION.DELETE_BY_ID.replace(
              "{permissionId}",
              permissionId,
            ),
          ),
        ),
      );
      toast.success(`Đã xóa ${deleteIds.length} quyền thành công!`);
      setDeleteIds([]);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast.error(error?.response?.data?.message || "Không thể xóa quyền.");
      setLoading(false);
    }
  };

  // Checkbox trên ma trận tạo/xóa permission và tải lại dữ liệu từ máy chủ.
  const handlePermissionChange = async (record, action, isChecked) => {
    setLoading(true);
    const { functionName, menuId } = record;
    const lowerCaseAction = action.toLowerCase();

    try {
      if (isChecked) {
        const payload = {
          code: `${functionName}.${action}`,
          name: `${action} ${functionName}`,
          menuId: menuId || null,
          orderDisplay: getActionOrder(action),
        };
        await postRequest(API_ENDPOINTS.PERMISSION.CREATE, payload);
        toast.success(`Đã thêm quyền thành công!`);
      } else {
        const permission = record.permissions[lowerCaseAction];
        const permissionId = permission?.id || permission?.permissionId;
        if (permissionId) {
          await deleteRequest(
            API_ENDPOINTS.PERMISSION.DELETE_BY_ID.replace(
              "{permissionId}",
              permissionId,
            ),
          );
          toast.success(`Đã xóa quyền thành công!`);
        } else {
          throw new Error("Không tìm thấy ID quyền để xóa.");
        }
      }
      // await fetchData();
    } catch (error) {
      console.error("Failed to update permission:", error);
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật quyền.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (record) => {
    form.resetFields();
    const actions = ALL_ACTIONS.filter(
      (action) => record.permissions[action.toLowerCase()],
    );
    const descriptions = {};
    actions.forEach((action) => {
      descriptions[action] =
        record.permissions[action.toLowerCase()]?.description || "";
    });
    setEditingRecord(record);
    form.setFieldsValue({
      functionName: record.functionName,
      menuId: record.menuId,
      actions,
      descriptions,
    });
    setOpen(true);
  };

  const columns = [
    {
      title: "Stt",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Chức năng",
      dataIndex: "functionName",
      width: 220,
      fixed: "left",
    },
    { title: "Menu", dataIndex: "menuName", width: 200 },
    ...ALL_ACTIONS.map((action) => ({
      title: getActionLabel(action),
      key: action,
      width: 110,
      align: "center",
      render: (_, record) => {
        const permission = record.permissions[action.toLowerCase()];
        return (
          <Checkbox
            disabled={loading}
            checked={Boolean(permission)}
            title={
              permission
                ? `${permission.code} — ${permission.name}`
                : `Tạo ${record.functionName}.${action}`
            }
            onChange={(e) => {
              if (!canUpdate) return;
              handlePermissionChange(record, action, e.target.checked);
            }}
          />
        );
      },
    })),
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <>
          <Tooltip title="Cập nhật quyền">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                openEdit(record);
              }}
              className="btn-edit-table"
            />
          </Tooltip>
          <Button
            type="text"
            danger
            title="Xóa toàn bộ quyền của chức năng"
            aria-label="Xóa toàn bộ quyền của chức năng"
            className="btn-remove-table"
            icon={<DeleteOutlined />}
            onClick={() =>
              setDeleteIds(
                Object.values(record.permissions)
                  .map((permission) => permission.id || permission.permissionId)
                  .filter(Boolean),
              )
            }
          />
        </>
      ),
    },
  ];

  const selectedMenuLabel = menuOptions.find(
    (item) => item.value === selectedMenuId,
  )?.label;
  const openBlankForm = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      menuId: selectedMenuId || undefined,
      actions: ["View", "Create", "Update", "Delete"],
    });
    setOpen(true);
  };

  return (
    <PageContainer
      title={
        selectedMenuLabel
          ? `Quyền hạn - ${selectedMenuLabel.replace(/^(— )+/, "")}`
          : "Quản lý quyền hạn"
      }
      searchPlaceholder="Tìm chức năng hoặc menu..."
      onSearch={setSearch}
      actionButtons={[
        // <Button
        //   key="back"
        //   type="default"
        //   icon={<ArrowLeftOutlined />}
        //   onClick={() => navigate(-1)}
        // >
        //   Quay lại
        // </Button>,
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={openBlankForm}
        >
          Thêm mới
        </Button>,
      ]}
      hideScroll
    >
      <Table
        columns={columns}
        dataSource={matrixData}
        rowKey="key"
        loading={loading}
        pagination={{
          ...pagination,
          total: matrixData.length,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} chức năng`,
        }}
        onChange={setPagination}
        scroll={{ x: "max-content", y: "calc(100vh - 320px)" }}
      />
      <Modal
        open={open}
        title={
          editingRecord
            ? "Cập nhật quyền theo chức năng"
            : "Thêm quyền theo chức năng"
        }
        onCancel={closeForm}
        onOk={handleSave}
        okText="Lưu"
        width={960}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="functionName"
                label="Chức năng"
                rules={[
                  { required: true, message: "Vui lòng nhập tên chức năng" },
                ]}
              >
                <Input placeholder="Ví dụ: Department" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="menuId" label="Menu">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Không chọn menu"
                  options={menuOptions}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="actions"
            label="Các quyền hạn"
            rules={[
              {
                required: true,
                type: "array",
                min: 1,
                message: "Vui lòng chọn ít nhất một quyền",
              },
            ]}
          >
            <Checkbox.Group
              options={ALL_ACTIONS.map((action) => ({
                label: getActionLabel(action),
                value: action,
              }))}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            />
          </Form.Item>
          <Row gutter={16}>
            {selectedFormActions.map((action) => (
              <Col xs={24} md={12} key={action}>
                <Form.Item
                  name={["descriptions", action]}
                  label={`Mô tả quyền ${getActionLabel(action)}`}
                >
                  <Input.TextArea
                    rows={2}
                    placeholder={`Nhập mô tả cho ${form.getFieldValue("functionName") || "chức năng"}.${action}`}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
      <ModalConfirm
        open={deleteIds.length > 0}
        title="Xác nhận xóa quyền"
        content={
          deleteIds.length > 1
            ? `Bạn có chắc chắn muốn xóa toàn bộ ${deleteIds.length} quyền của chức năng này?`
            : "Bạn có chắc chắn muốn xóa quyền này?"
        }
        okText="Đồng ý"
        cancelText="Hủy"
        onOk={handleDelete}
        onCancel={() => setDeleteIds([])}
      />
    </PageContainer>
  );
};

export default PermissionList;
