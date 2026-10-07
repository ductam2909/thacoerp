import React, { useEffect, useState } from "react";
import { Button, Select, Space, Table, Tag, Tooltip, message } from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PageContainer from "../../components/core/common/PageContainer";
import ModalConfirm from "../../components/core/common/ModalConfirm";
import AddCutFileModal from "./components/AddCutFileModal";
import CutFileDetailDrawer from "./components/CutFileDetailDrawer";
import { MAIN_ROUTES } from "../../routers/constants";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { getRequest } from "../../services/baseService";
const priorityOptions = [
  { label: "Tất cả", value: "ALL" },
  { label: "Cao (Gấp)", value: "Cao" },
  { label: "Trung bình", value: "Trung bình" },
  { label: "Thấp", value: "Thấp" },
];
const statusOptions = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: "Chưa phân bổ", value: "UNALLOCATED" },
  { label: "Đã phân bổ", value: "ALLOCATED" },
];
const getPriorityLabel = (record) => {
  if (record?.priority === 0 || record?.priorityName === "High")
    return "Cao (Gấp)";
  if (record?.priority === 1 || record?.priorityName === "Medium")
    return "Trung bình";
  if (record?.priority === 2 || record?.priorityName === "Low") return "Thấp";
  return record?.priorityName ?? "--";
};

const getPriorityColor = (record) => {
  if (record?.priority === 0 || record?.priorityName === "High") return "red";
  if (record?.priority === 1 || record?.priorityName === "Medium")
    return "gold";
  return "blue";
};
const getStatusColor = (status) => {
  switch (status) {
    case "Chưa phân bổ":
      return "default";
    case "Đã phân bổ":
      return "processing";
    case "Chờ gia công":
      return "warning";
    case "Đang gia công":
      return "cyan";
    case "Tạm dừng":
      return "orange";
    case "Hoàn thành":
      return "success";
    case "Lỗi máy":
      return "error";
    default:
      return "default";
  }
};
const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");
const CutFileList = () => {
  const navigate = useNavigate();
  const [cutFiles, setCutFiles] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedText, setSearchedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [materialFilter, setMaterialFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  // Modals & Drawers
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const fetchCutFiles = async (page = 1, pageSize = 50, textSearch = "") => {
    setLoading(true);
    try {
      const params = {
        Page: page,
        PageSize: pageSize,
      };
      const searchValue = String(textSearch || "").trim();
      if (searchValue) {
        params.textSearch = searchValue;
      }
      const response = await getRequest(
        API_ENDPOINTS.COMMAND_CUTTING_FILE.GET_ALL,
        params,
      );
      const responseData = response?.data ?? response;
      const result = responseData?.data ?? responseData;
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setCutFiles(items);
      setPagination({
        current: result?.page ?? page,
        pageSize: result?.pageSize ?? pageSize,
        total: result?.total ?? result?.totalCount ?? items.length,
      });
    } catch (error) {
      console.error("Failed to fetch cutting files:", error);
      setCutFiles([]);
      message.error(
        error?.response?.data?.message || "Không thể tải danh sách file cắt.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCutFiles(1, 50);
  }, []);

  const handleSearchChange = (value) => {
    const nextValue = value || "";
    setSearchText(nextValue);
    if (!nextValue.trim() && searchedText) {
      setSearchedText("");
      fetchCutFiles(1, pagination.pageSize);
    }
  };

  const handleSearch = (value) => {
    const textSearch = String(value ?? searchText ?? "").trim();
    setSearchText(value ?? searchText ?? "");
    setSearchedText(textSearch);
    fetchCutFiles(1, pagination.pageSize, textSearch);
  };

  const handleTableChange = (page, pageSize) => {
    fetchCutFiles(page, pageSize, searchedText);
  };

  const filteredOrders = cutFiles.filter((ord) => {
    const priorityLabel = getPriorityLabel(ord);
    if (priorityFilter !== "ALL" && priorityLabel !== priorityFilter)
      return false;
    if (materialFilter !== "ALL" && ord.materialCode !== materialFilter)
      return false;
    if (statusFilter !== "ALL") {
      const isAllocated = ord.status !== 0;
      if (statusFilter === "UNALLOCATED" && isAllocated) return false;
      if (statusFilter === "ALLOCATED" && !isAllocated) return false;
    }
    return true;
  });
  const handleOpenDetail = (record) => {
    setSelectedOrder(record);
    setDrawerVisible(true);
  };
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setModalVisible(true);
  };
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRecord(null);
  };
  const handleSaveOrder = (savedOrder) => {
    if (editingRecord) {
      setCutFiles((prev) =>
        prev.map((item) =>
          item.id === editingRecord.id ? { ...item, ...savedOrder } : item,
        ),
      );
    } else {
      setCutFiles((prev) => [savedOrder, ...prev]);
    }
    setEditingRecord(null);
  };
  const handleOpenDelete = (record) => {
    setDeleteRecord(record);
  };
  const handleConfirmDelete = () => {
    if (!deleteRecord) return;
    setCutFiles((prev) => prev.filter((item) => item.id !== deleteRecord.id));
    message.success(`Đã xóa file cắt ${deleteRecord.cuttingFileCode}`);
    setDeleteRecord(null);
  };
  const handleToggleAllocation = (record) => {
    if (record.plan) {
      // Đã phân bổ: mở trang lịch phân bổ với record hiện tại
      navigate(MAIN_ROUTES.NESTING_ALLOCATION_SCHEDULE, { state: { record } });
    } else {
      // Chưa phân bổ: chuyển sang trang phân bổ, mang theo record
      navigate(MAIN_ROUTES.NESTING_ALLOCATION_SCHEDULE, { state: { record } });
    }
  };
  const mappingStatus = (status) => {
    switch (status) {
      case "":
        return {
          text: "",
          color: "default",
        };

      case "Created":
        return {
          text: "Mới tạo",
          color: "default",
        };

      case "Planned":
        return {
          text: "Đang xử lý",
          color: "processing",
        };

      case "Completed":
        return {
          text: "Hoàn thành",
          color: "success",
        };

      case "Cancelled":
        return {
          text: "Hủy",
          color: "error",
        };

      default:
        return {
          text: status,
          color: "default",
        };
    }
  };
  const columns = [
    {
      title: "Stt",
      key: "stt",
      width: 65,
      align: "center",
      fixed: "left",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Lệnh sản xuất",
      key: "productionCommandCode",
      width: 150,
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record) => {
        const codes =
          record.productionCommands?.map(
            (item) => item.productionCommandCode,
          ) ?? [];
        return (
          <span
            style={{
              // color: "#1677ff",
              cursor: "pointer",
            }}
            // onClick={() => handleOpenDetail(record)}
          >
            {codes.length ? codes.join(", ") : "--"}
          </span>
        );
      },
    },
    {
      title: "Tên đơn hàng",
      key: "orderName",
      width: 200,
      ellipsis: true,
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record) => {
        const names =
          record.productionCommands?.map((item) => item.orderName) ?? [];
        return (
          <span style={{ fontWeight: 600 }}>
            {names.length ? names.join(", ") : "--"}
          </span>
        );
      },
    },
    {
      title: "Mã file cắt",
      dataIndex: "cuttingFileCode",
      key: "cuttingFileCode",
      width: 100,
      ellipsis: true,
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (file, record) => (
        <span
          style={{
            // color: "#1677ff",
            cursor: "pointer",
          }}
          onClick={() => handleOpenDetail(record)}
        >
          {file}
        </span>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 90,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record) => (
        <Tag color={getPriorityColor(record)}>{getPriorityLabel(record)}</Tag>
      ),
    },
    {
      title: "Vật liệu",
      dataIndex: "materialCode",
      key: "materialCode",
      width: 100,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (m) => <Tag color="geekblue">{m}</Tag>,
    },
    {
      title: "Quy cách (phôi)",
      key: "spec",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      children: [
        {
          title: "Dài",
          key: "length",
          width: 60,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => formatNumber(r.length),
        },
        {
          title: "Rộng",
          key: "width",
          width: 60,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => formatNumber(r.width),
        },
        {
          title: "Dày",
          key: "thickness",
          width: 60,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => (
            <span style={{ fontWeight: 600 }}>{formatNumber(r.thickness)}</span>
          ),
        },
      ],
    },
    {
      title: "Số lượng",
      key: "quantity_group",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      children: [
        {
          title: "SL tấm",
          dataIndex: "quantity",
          key: "quantity",
          width: 80,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (q) => <span>{q} tấm</span>,
        },
        {
          title: "SL chi tiết",
          key: "partQuantity",
          width: 80,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => <span>{formatNumber(r.plannedQuantity)} CT</span>,
        },
      ],
    },
    {
      title: "Mét cắt",
      dataIndex: "cuttingLength",
      key: "cuttingLength",
      width: 90,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (m) => <span>{formatNumber(m)} m</span>,
    },
    {
      title: "TG cắt (phút)",
      dataIndex: "cuttingTime",
      key: "cuttingTime",
      width: 90,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (t) => <span>{t} phút</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 90,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record) => {
        const status = mappingStatus(record.statusName);

        return <Tag color={status.color}>{status.text ?? ""}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 90,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, r) => {
        return (
          <Space size={8}>
            <Tooltip title="Sửa file cắt">
              <Button
                size="small"
                type="text"
                icon={<EditOutlined style={{ color: "#1677ff" }} />}
                onClick={() => handleOpenEdit(r)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleOpenDelete(r)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];
  return (
    <PageContainer
      className="nesting-page"
      title="Danh sách file cắt"
      searchPlaceholder="Tìm theo LSX, Đơn hàng, Mã file..."
      searchValue={searchText}
      onSearchChange={handleSearchChange}
      onSearch={handleSearch}
      actionButtons={[
        <Space key="priority-filter" size={6} className="machine-header-filter">
          <span>Ưu tiên:</span>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={priorityOptions}
            style={{ width: 120 }}
          />
        </Space>,
        <Space key="status-filter" size={6} className="machine-header-filter">
          <span>Phân bổ:</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            style={{ width: 145 }}
          />
        </Space>,
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenAdd}
        >
          Thêm File Cắt
        </Button>,
      ]}
      hideScroll={true}
    >
      <Table
        bordered
        className="table-cut-file"
        columns={columns}
        dataSource={filteredOrders}
        loading={loading}
        rowKey="id"
        size="small"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100", "200"],
          showTotal: (total) => `Tổng số ${total} file cắt`,
          size: "small",
          style: { marginTop: 5 },
          onChange: handleTableChange,
        }}
        scroll={{ x: 2350, y: "calc(100vh - 300px)" }}
      />
      {/* MODAL THÊM / SỬA FILE CẮT */}
      {modalVisible && (
        <AddCutFileModal
          visible={modalVisible}
          editingRecord={editingRecord}
          onCancel={handleCloseModal}
          onSubmit={handleSaveOrder}
          defaultLsxCode={searchText}
        />
      )}
      {/* DRAWER CHI TIẾT FILE CẮT */}
      <CutFileDetailDrawer
        order={selectedOrder}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
      {/* MODAL XÁC NHẬN XÓA */}
      <ModalConfirm
        open={Boolean(deleteRecord)}
        title="Xác nhận xóa file cắt"
        content={
          deleteRecord
            ? `Bạn có chắc chắn muốn xóa file cắt "${deleteRecord.cuttingFileCode}" không?`
            : ""
        }
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteRecord(null)}
      />
    </PageContainer>
  );
};
export default CutFileList;
