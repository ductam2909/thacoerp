import React, { useState, useEffect } from "react";
import { Button, Form, Modal, Space, Tag, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  KeyOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { toast } from "../../utils/notification";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
} from "../../services/baseService";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import PageContainer from "../../components/core/common/PageContainer";
import Table from "../../components/core/common/Table";
import { APP_MESSAGES } from "../../constants/messages";
import ModalConfirm from "../../components/core/common/ModalConfirm";
import { useAppSelector } from "../../store/hooks";
import { useLocation } from "react-router-dom";

const unwrapList = (response) => {
  const result =
    response?.data?.data || response?.data || response?.Data || response;
  return Array.isArray(result) ? result : result?.items || result?.Items || [];
};

const unwrapDetail = (response) =>
  response?.data?.data || response?.data || response?.Data || response || {};

const normalizeGlobalRole = (role) => {
  if (typeof role === "string") {
    const loweredRole = role.toLowerCase();
    if (loweredRole === "admin") return 1;
    if (loweredRole === "user") return 2;
  }
  return role;
};

const normalizeUserFormValues = (user = {}) => ({
  ...user,
  userId: user.userId || user.id,
  userName: user.userName || user.username,
  positionId: user.positionId || user.position?.positionId,
  globalRole: normalizeGlobalRole(user.globalRole ?? user.role ?? user.roleId),
  isActive: user.isActive ?? true,
});

const getUserId = (user = {}) => user.userId || user.id;
const getMachineId = (machine = {}) => machine.machineId || machine.id;

const getAssignedMachineIds = (response) => {
  const detail = unwrapDetail(response);
  const machines =
    detail?.machines ||
    detail?.machineOperators ||
    detail?.items ||
    (Array.isArray(detail) ? detail : []);

  return machines
    .map((item) => item?.machineId || item?.machine?.machineId || item?.id)
    .filter(Boolean);
};

const buildUserPayload = (values, selectedId, isEdit) => {
  const payload = {
    userName: values.userName?.trim(),
    fullName: values.fullName?.trim(),
    email: values.email?.trim(),
    phoneNumber: values.phoneNumber?.trim(),
    positionId: values.positionId,
    globalRole: values.globalRole,
  };

  if (isEdit) {
    payload.userId = selectedId;
    payload.isActive = values.isActive ?? true;
  }

  if (!isEdit || values.password) {
    payload.password = values.password;
  }

  return payload;
};

const MachineOperation = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isAssignMachineOpen, setIsAssignMachineOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [machines, setMachines] = useState([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);
  const [originalMachineIds, setOriginalMachineIds] = useState([]);
  const [machineLoading, setMachineLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [textSearch, setTextSearch] = useState("");
  const location = useLocation();
  const permissionsByPath = useAppSelector(
    (state) => state.menu.permissionsByPath,
  );
  const permissionCodes =
    permissionsByPath[location.pathname] || permissionsByPath["users"] || [];
  const canCreateUser = permissionCodes.includes("User.Create");
  const canDeleteUser = permissionCodes.includes("User.Delete");
  const caneditUser = permissionCodes.includes("User.Update");
  const canConfigureMachine = permissionCodes.includes(
    "MachineOperation.Create",
  );

  const fetchUsers = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    search = textSearch,
  ) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
      };
      if (search) {
        params.search = search;
      }
      const response = await getRequest(API_ENDPOINTS.USER.GET_ALL, params);
      const listData = unwrapList(response);

      if (listData && listData.length > 0) {
        setData(listData);
        setPagination((prev) => ({
          ...prev,
          total: response?.total || response?.totalCount || listData.length,
          current: response?.page || page,
          pageSize: response?.pageSize || pageSize,
        }));
      } else {
        setData([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Lỗi khi tải dữ liệu từ máy chủ.");
      setData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchMachines = async () => {
    setMachineLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.MACHINE.GET_ALL, {
        Page: 1,
        PageSize: 1000,
      });
      setMachines(unwrapList(response));
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      toast.error("Lỗi khi tải danh sách máy.");
      setMachines([]);
    } finally {
      setMachineLoading(false);
    }
  };

  const handleSave = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          const payload = buildUserPayload(values, selectedId, isEdit);
          if (isEdit) {
            const updateUrl = API_ENDPOINTS.USER.UPDATE_BY_ID.replace(
              "{userId}",
              selectedId,
            );
            await putRequest(updateUrl, payload);
            toast.success(
              APP_MESSAGES?.SUCCESS?.UPDATE || "Cập nhật thành công!",
            );
          } else {
            await postRequest(API_ENDPOINTS.USER.CREATE, payload);
            toast.success(
              APP_MESSAGES?.SUCCESS?.CREATE || "Thêm mới thành công!",
            );
          }
          setIsModalOpen(false);
          form.resetFields();
          fetchUsers();
        } catch (error) {
          console.error("Save failed:", error);
          toast.error("Lỗi khi lưu dữ liệu. Vui lòng thử lại!");
        }
      })
      .catch((err) => {
        console.error("Validation failed:", err);
        if (err.errorFields) {
          toast.warning(
            APP_MESSAGES?.WARNING?.FILL_REQUIRED ||
              "Vui lòng điền đầy đủ thông tin!",
          );
        }
      });
  };

  const handleEdit = async (record) => {
    const userId = getUserId(record);
    setIsEdit(true);
    setSelectedId(userId);
    try {
      const detailUrl = API_ENDPOINTS.USER.GET_BY_ID.replace(
        "{userId}",
        userId,
      );
      const response = await getRequest(detailUrl);
      const detailData = normalizeUserFormValues(unwrapDetail(response));
      form.setFieldsValue(detailData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
      toast.error("Lỗi khi tải chi tiết người dùng!");
      form.setFieldsValue(normalizeUserFormValues(record));
      setIsModalOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      const deleteUrl = API_ENDPOINTS.USER.DELETE_BY_ID.replace(
        "{userId}",
        selectedId,
      );
      await deleteRequest(deleteUrl);
      toast.success(APP_MESSAGES?.SUCCESS?.DELETE || "Xoá thành công!");
      setIsDelete(false);
      fetchUsers();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Lỗi khi xoá. Vui lòng thử lại!");
    }
  };

  const handleResetPassword = async () => {
    try {
      const resetUrl = API_ENDPOINTS.USER.RESET_PASSWORD.replace(
        "{userId}",
        selectedId,
      );
      await putRequest(resetUrl, {});
      toast.success("Cấp lại mật khẩu thành công!");
      setIsResetPassword(false);
    } catch (error) {
      console.error("Reset password failed:", error);
      toast.error("Lỗi khi reset mật khẩu. Vui lòng thử lại!");
    }
  };

  const handleOpenAssignMachine = async (record) => {
    const userId = getUserId(record);
    setSelectedId(userId);
    setSelectedUser(record);
    setIsAssignMachineOpen(true);
    setSelectedMachineIds([]);
    setOriginalMachineIds([]);
    await fetchMachines();

    try {
      const detailUrl = API_ENDPOINTS.MACHINE_OPERATOR.GET_BY_USER.replace(
        "{userId}",
        userId,
      );
      const response = await getRequest(detailUrl);
      const assignedIds = getAssignedMachineIds(response);
      setSelectedMachineIds(assignedIds);
      setOriginalMachineIds(assignedIds);
    } catch (error) {
      console.error("Failed to fetch assigned machines:", error);
      setSelectedMachineIds([]);
      setOriginalMachineIds([]);
    }
  };

  const handleAssignMachines = async () => {
    const addedMachineIds = selectedMachineIds.filter(
      (machineId) => !originalMachineIds.includes(machineId),
    );
    const removedMachineIds = originalMachineIds.filter(
      (machineId) => !selectedMachineIds.includes(machineId),
    );

    if (addedMachineIds.length === 0 && removedMachineIds.length === 0) {
      toast.info("Không có thay đổi để lưu.");
      setIsAssignMachineOpen(false);
      setSelectedUser(null);
      return;
    }

    try {
      setAssignLoading(true);

      // Chỉ gọi API gán cho các máy mới được chọn.
      if (addedMachineIds.length > 0) {
        await postRequest(API_ENDPOINTS.MACHINE_OPERATOR.ASSIGN_MACHINES, {
          userId: selectedId,
          machineIds: addedMachineIds,
        });
      }

      // Các máy bị bỏ chọn sẽ được xóa gán.
      if (removedMachineIds.length > 0) {
        await Promise.all(
          removedMachineIds.map((machineId) => {
            const deleteUrl =
              API_ENDPOINTS.MACHINE_OPERATOR.DELETE_BY_MACHINE_USER.replace(
                "{machineId}",
                machineId,
              ).replace("{userId}", selectedId);
            return deleteRequest(deleteUrl);
          }),
        );
      }

      toast.success("Lưu cấu hình máy thành công!");
      setIsAssignMachineOpen(false);
      setSelectedUser(null);
      setSelectedMachineIds([]);
      setOriginalMachineIds([]);
      fetchUsers();
    } catch (error) {
      console.error("Save machine configuration failed:", error);
      toast.error("Lỗi khi lưu cấu hình máy. Vui lòng thử lại!");
    } finally {
      setAssignLoading(false);
    }
  };

  const columns = [
    {
      title: "Stt",
      key: "stt",
      align: "center",
      width: 80,
      render: (text, record, index) => {
        return (pagination.current - 1) * pagination.pageSize + index + 1;
      },
    },
    {
      title: "Tên đăng nhập",
      dataIndex: "userName",
      key: "userName",
      render: (value, record) => value || record.username,
    },
    {
      title: "Tên người dùng",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Chức vụ",
      dataIndex: "positionName",
      key: "positionName",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (_, record) => (
        <Tag className={record?.isActive ? "active-tag pX-2" : "inactive-tag"}>
          {record?.isActive ? "Kích hoạt" : "Chưa kích hoạt"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      align: "center",
      render: (_, record) => (
        <Space className="flex flex-center" size={4}>
          {caneditUser && record?.fullName !== "Administrator" && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="btn-edit-table"
              title="Chỉnh sửa"
            />
          )}
          {caneditUser && record?.fullName !== "Administrator" && (
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={() => {
                setSelectedId(getUserId(record));
                setIsResetPassword(true);
              }}
              className="btn-edit-table"
              title="Đặt lại mật khẩu"
            />
          )}
          {canConfigureMachine && record?.fullName !== "Administrator" && (
            <Tooltip title="Cấu hình máy">
              <Button
                type="text"
                icon={<ToolOutlined style={{ color: "#1677ff" }} />}
                onClick={() => handleOpenAssignMachine(record)}
                title="Cấu hình máy"
              ></Button>
            </Tooltip>
          )}

          {canDeleteUser && record?.fullName !== "Administrator" && (
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedId(getUserId(record));
                setIsDelete(true);
              }}
              className="btn-remove-table"
              title="Xóa"
            />
          )}
        </Space>
      ),
    },
  ];

  const machineColumns = [
    {
      title: "STT",
      key: "stt",
      align: "center",
      width: 70,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã máy",
      dataIndex: "machineCode",
      key: "machineCode",
      width: 160,
    },
    {
      title: "Tên máy",
      dataIndex: "machineName",
      key: "machineName",
      render: (value) => value || "-",
    },
  ];

  return (
    <PageContainer
      title="Quản lý vận hành máy"
      searchPlaceholder="Tìm kiếm người dùng..."
      onSearch={(val) => {
        setTextSearch(val);
        if (!val) {
          fetchUsers(1, pagination.pageSize, val);
        }
      }}
      onkeyDownSearch={(event, val) => {
        if (event.key === "Enter") {
          fetchUsers(1, pagination.pageSize, val);
        }
      }}
      actionButtons={
        canCreateUser && [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsEdit(false);
              form.resetFields();
              form.setFieldsValue({ isActive: true });
              setIsModalOpen(true);
            }}
          >
            Thêm mới
          </Button>,
        ]
      }
      hideScroll={true}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey={getUserId}
        scroll={{ x: "max-content", y: "calc(100vh - 300px)" }}
        loading={loading}
        pagination={{
          size: "small",
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination?.total,
          defaultPageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100", "200"],
          showTotal: (total) => `Tổng số ${total} người dùng`,
        }}
        onChange={(paginationInfo) => {
          setPagination((prev) => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize,
          }));
          fetchUsers(paginationInfo.current, paginationInfo.pageSize);
        }}
        expandable={{ expandIconColumnIndex: 1 }}
      />
      <ModalConfirm
        open={isDelete}
        title="Xác nhận xóa Người dùng"
        content="Bạn có chắc chắn muốn xóa người dùng này?"
        okText="Đồng ý"
        cancelText="Hủy"
        onOk={handleDelete}
        onCancel={() => {
          setIsDelete(false);
        }}
      />
      <ModalConfirm
        open={isResetPassword}
        title="Xác nhận cấp lại mật khẩu"
        content="Bạn có chắc chắn muốn cấp lại mật khẩu cho người dùng này?"
        okText="Đồng ý"
        cancelText="Hủy"
        onOk={handleResetPassword}
        onCancel={() => {
          setIsResetPassword(false);
        }}
      />
      <Modal
        open={isAssignMachineOpen}
        title={`Cấu hình máy${selectedUser?.fullName ? ` cho ${selectedUser.fullName}` : ""}`}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={assignLoading}
        onOk={handleAssignMachines}
        onCancel={() => {
          setIsAssignMachineOpen(false);
          setSelectedUser(null);
          setSelectedMachineIds([]);
          setOriginalMachineIds([]);
        }}
        width={760}
        destroyOnClose
      >
        <Table
          columns={machineColumns}
          dataSource={machines}
          rowKey={getMachineId}
          loading={machineLoading}
          rowSelection={{
            selectedRowKeys: selectedMachineIds,
            onChange: (selectedRowKeys) => {
              setSelectedMachineIds(selectedRowKeys);
            },
          }}
          pagination={{
            current: 1,
            pageSize: 1000,
            defaultPageSize: 1000,
            showSizeChanger: true,
            pageSizeOptions: ["100", "200", "500", "1000"],
            showTotal: (total) => `Tổng số ${total} máy`,
          }}
          scroll={{ x: "max-content", y: 360 }}
        />
      </Modal>
    </PageContainer>
  );
};

export default MachineOperation;
