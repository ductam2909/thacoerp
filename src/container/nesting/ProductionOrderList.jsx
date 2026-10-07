import React, { useEffect, useState } from "react";
import { Button, Space, Table, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import PageContainer from "../../components/core/common/PageContainer";
import Modal from "../../components/core/common/Modal";
import ModalConfirm from "../../components/core/common/ModalConfirm";
import ProductionOderForm from "./components/ProductionOderForm";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../services/baseService";
import { toast } from "../../utils/notification";
import dayjs from "dayjs";

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? response;

const getProductionOrderId = (record) =>
  record?.id ?? record?.productionCommandId ?? record?.productionOrderId;

const getProductionOrderCode = (record) => record?.commandCode ?? record?.code;

const ProductionOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const fetchProductionOrders = async (
    page = 1,
    pageSize = 50,
    textSearch = "",
  ) => {
    setLoading(true);

    try {
      const params = {
        Page: page,
        PageSize: pageSize,
      };

      const searchValue = String(textSearch || "").trim();

      if (searchValue) {
        params.keyWord = searchValue;
      }

      const response = await getRequest(
        API_ENDPOINTS.PRODUCTION_COMMAND.GET_ALL,
        params,
      );

      const result = getResponseData(response);
      const items = Array.isArray(result) ? result : (result?.items ?? []);

      setOrders(items);
      setPagination({
        current: result?.page ?? page,
        pageSize: result?.pageSize ?? pageSize,
        total: result?.total ?? items.length,
      });
    } catch (error) {
      console.error("Lỗi không tải được danh sách lệnh sản xuất:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải lệnh sản xuất.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrders(1, 50);
  }, []);

  const handleSearchChange = (value) => {
    const nextValue = value || "";
    setKeyword(nextValue);

    if (!nextValue.trim() && searchedKeyword) {
      setSearchedKeyword("");
      fetchProductionOrders(1, pagination.pageSize);
    }
  };

  const handleSearch = (value) => {
    const textSearch = String(value ?? keyword ?? "").trim();

    setKeyword(value ?? keyword ?? "");
    setSearchedKeyword(textSearch);

    fetchProductionOrders(1, pagination.pageSize, textSearch);
  };

  const handleTableChange = (page, pageSize) => {
    fetchProductionOrders(page, pageSize, searchedKeyword);
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleOpenDelete = (record) => {
    setDeleteRecord(record);
  };

  const handleCloseDelete = () => {
    setDeleteRecord(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteRecord) return;

    setOrders((prevOrders) =>
      prevOrders.filter(
        (item) =>
          getProductionOrderId(item) !== getProductionOrderId(deleteRecord),
      ),
    );

    handleCloseDelete();
  };

  const handleSubmit = async (values) => {
    setLoading(true);

    const isEditing = Boolean(editingRecord);
    const payload = {
      commandCode: values.commandCode,
      orderName: values.orderName,
    };

    try {
      if (isEditing) {
        await putRequest(
          API_ENDPOINTS.PRODUCTION_COMMAND.UPDATE_BY_ID.replace(
            "{id}",
            getProductionOrderId(editingRecord),
          ),
          payload,
        );
      } else {
        await postRequest(API_ENDPOINTS.PRODUCTION_COMMAND.CREATE, payload);
      }

      toast.success(
        isEditing
          ? "Cập nhật lệnh sản xuất thành công!"
          : "Thêm lệnh sản xuất thành công!",
      );

      handleCloseForm();

      if (isEditing) {
        await fetchProductionOrders(
          pagination.current,
          pagination.pageSize,
          searchedKeyword,
        );
      } else {
        setKeyword("");
        setSearchedKeyword("");
        await fetchProductionOrders(1, pagination.pageSize);
      }
    } catch (error) {
      console.error("Failed to save production order:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể lưu thông tin lệnh sản xuất.",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "STT",
      width: 80,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã lệnh SX",
      dataIndex: "commandCode",
      width: 190,
      render: (value, record) => (
        <span className="order-code">{value ?? record.code}</span>
      ),
    },
    {
      title: "Tên đơn hàng",
      dataIndex: "orderName",
      width: 300,
      render: (value) => <span className="order-name">{value}</span>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      width: 150,
      align: "center",
      render: (value) => (
        <span className="order-name">
          {value && dayjs(value).isValid()
            ? dayjs(value).format("DD/MM/YYYY")
            : ""}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      className: "nesting-action-cell",
      render: (_, record) => (
        <Space className="nesting-action-list" size={10}>
          <Tooltip title="Sửa">
            <Button
              type="text"
              className="nesting-action-button nesting-edit-button"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              className="nesting-action-button nesting-delete-button"
              icon={<DeleteOutlined />}
              onClick={() => handleOpenDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      className="nesting-page"
      title="Danh sách lệnh sản xuất"
      searchPlaceholder="Tìm kiếm lệnh sản xuất..."
      searchValue={keyword}
      onSearchChange={handleSearchChange}
      onSearch={handleSearch}
      actionButtons={[
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
        >
          Thêm mới
        </Button>,
      ]}
      hideScroll={true}
    >
      <Table
        bordered
        className="common-table"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100", "200"],
          size: "small",
          style: { marginTop: 5 },
          onChange: handleTableChange,
        }}
        rowKey={getProductionOrderId}
        scroll={{ x: 1100, y: "calc(100vh - 290px)" }}
      />
      <Modal
        title={editingRecord ? "Cập nhật lệnh sản xuất" : "Thêm lệnh sản xuất"}
        open={isFormOpen}
        onCancel={handleCloseForm}
        footer={null}
        width={760}
      >
        <ProductionOderForm
          initialValues={editingRecord}
          onCancel={handleCloseForm}
          onSubmit={handleSubmit}
        />
      </Modal>
      <ModalConfirm
        open={Boolean(deleteRecord)}
        title="Xác nhận xóa"
        content={
          deleteRecord
            ? `Bạn có chắc chắn muốn xóa lệnh sản xuất ${getProductionOrderCode(deleteRecord)} không?`
            : ""
        }
        okText="Đồng ý"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onOk={handleConfirmDelete}
        onCancel={handleCloseDelete}
      />
    </PageContainer>
  );
};

export default ProductionOrderList;
