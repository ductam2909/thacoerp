import React, { useState, useEffect } from "react";
import { Button, Form } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
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
import PositionForm from "./PositionForm";
import ModalConfirm from "../../../components/core/common/ModalConfirm";
import { SettingOutlined } from "@ant-design/icons";
import { useAppSelector } from "../../../store/hooks";

const PositionList = () => {
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const permissionsByPath = useAppSelector(
    (state) => state.menu.permissionsByPath,
  );
  const permissionCodes = permissionsByPath[location.pathname || "/positions"];
  const isAssignPermission = permissionCodes?.includes(
    "Position.AssignPermission",
  );
  const isEditPosition = permissionCodes?.includes("Position.Update");
  const isDeletePosition = permissionCodes?.includes("Position.Delete");
  const isCreatePosition = permissionCodes?.includes("Position.Create");
  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.POSITION.GET_ALL);
      const listData = Array.isArray(response)
        ? response
        : response?.data || response?.Data || [];
      setData(listData);
      setPagination((prev) => ({ ...prev, total: listData.length }));
    } catch (error) {
      console.error("Failed to fetch positions:", error);
      toast.error("Lỗi khi tải danh sách chức vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    if (!data) return;
    const dataFilter = data?.filter((item) =>
      item.positionName.toLowerCase().includes(searchText.trim().toLowerCase()),
    );
    setFilterData(dataFilter);
  }, [searchText, data]);

  const handleEdit = async (record) => {
    setIsEdit(true);
    setSelectedId(record.positionId);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          const payload = {
            ...values,
            description: values.description ?? "",
          };

          if (isEdit) {
            const updateUrl = API_ENDPOINTS.POSITION.UPDATE_BY_ID.replace(
              "{positionId}",
              selectedId,
            );
            await putRequest(updateUrl, payload);
            toast.success(
              APP_MESSAGES?.SUCCESS?.UPDATE || "Cập nhật thành công!",
            );
          } else {
            await postRequest(API_ENDPOINTS.POSITION.CREATE, payload);
            toast.success(
              APP_MESSAGES?.SUCCESS?.CREATE || "Thêm mới thành công!",
            );
          }
          setIsModalOpen(false);
          form.resetFields();
          fetchPositions();
        } catch (error) {
          console.error("Save failed:", error);
          toast.error("Lỗi khi lưu dữ liệu. Vui lòng thử lại!");
        }
      })
      .catch((err) => {
        if (err.errorFields) {
          toast.warning(
            APP_MESSAGES?.WARNING?.FILL_REQUIRED ||
              "Vui lòng điền đầy đủ thông tin!",
          );
        }
      });
  };

  const handleDelete = async () => {
    try {
      const deleteUrl = API_ENDPOINTS.POSITION.DELETE_BY_ID.replace(
        "{positionId}",
        selectedId,
      );
      await deleteRequest(deleteUrl);
      toast.success(APP_MESSAGES?.SUCCESS?.DELETE || "Xoá thành công!");
      setIsDelete(false);
      fetchPositions();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Lỗi khi xóa dữ liệu. Vui lòng thử lại!");
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
      title: "Tên Chức vụ",
      dataIndex: "positionName",
      key: "positionName",
    },
    {
      title: "Trực thuộc (Đơn vị cha)",
      dataIndex: "parentName",
      key: "parentName",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <div className="flex flex-center">
          {isAssignPermission && (
            <Button
              type="text"
              icon={<SettingOutlined style={{ color: "#fa8c16" }} />}
              onClick={() =>
                navigate(
                  `/positions/${record.positionId || record.id}/permissions`,
                )
              }
              title="Cấu hình quyền"
            />
          )}
          {isEditPosition && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="btn-edit-table"
              title="Sửa"
            />
          )}
          {isDeletePosition && (
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedId(record.positionId);
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
      title="Quản lý Chức vụ"
      searchPlaceholder="Tìm kiếm chức vụ..."
      onSearch={(val) => setSearchText(val)}
      actionButtons={
        isCreatePosition && [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setIsEdit(false);
              form.resetFields();
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
        dataSource={filterData}
        rowKey="positionId"
        scroll={{ x: "max-content", y: "calc(100vh - 320px)" }}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bản ghi`,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({ ...prev, current: page, pageSize }));
          },
        }}
      />
      <PositionForm
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSave}
        form={form}
        isEdit={isEdit}
        positions={data}
      />
      <ModalConfirm
        open={isDelete}
        title="Xác nhận xóa"
        content="Bạn có chắc chắn muốn xóa chức vụ này không?"
        okText="Đồng ý"
        cancelText="Hủy"
        onOk={handleDelete}
        onCancel={() => setIsDelete(false)}
      />
    </PageContainer>
  );
};

export default PositionList;
