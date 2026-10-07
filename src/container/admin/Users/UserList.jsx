import React, { useState, useEffect } from "react";
import { Button, Form, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  KeyOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { toast } from "../../../utils/notification";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest,
} from "../../../services/baseService";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";
import PageContainer from "../../../components/core/common/PageContainer";
import Table from "../../../components/core/common/Table";
import { APP_MESSAGES } from "../../../constants/messages";
import UserForm from "./UserForm";
import ModalConfirm from "../../../components/core/common/ModalConfirm";
import { useAppSelector } from "../../../store/hooks";
import { useLocation, useNavigate } from "react-router-dom";

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
const getPositionId = (user = {}) =>
  user.positionId || user.position?.positionId;

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

const UserList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [textSearch, setTextSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const permissionsByPath = useAppSelector(
    (state) => state.menu.permissionsByPath,
  );
  const permissionCodes =
    permissionsByPath[location.pathname] || permissionsByPath["users"] || [];
  const canCreateUser = permissionCodes.includes("User.Create");
  const canDeleteUser = permissionCodes.includes("User.Delete");
  const caneditUser = permissionCodes.includes("User.Update");
  const canAssignPermission = (
    permissionsByPath["/positions"] ||
    permissionsByPath.positions ||
    permissionCodes
  ).includes("Position.AssignPermission");

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
      width: 130,
      align: "center",
      render: (_, record) => (
        <div className="flex flex-center">
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
          {canAssignPermission &&
            getPositionId(record) &&
            record?.fullName !== "Administrator" && (
              <Button
                type="text"
                icon={<SettingOutlined style={{ color: "#fa8c16" }} />}
                onClick={() =>
                  navigate(`/positions/${getPositionId(record)}/permissions`)
                }
                title="Cau hinh quyen"
              />
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
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý Người dùng"
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

      <UserForm
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
        form={form}
        isEdit={isEdit}
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
    </PageContainer>
  );
};

export default UserList;
