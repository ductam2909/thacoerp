/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Select, Space, Table, Tag, message } from "antd";
import { CheckCircleOutlined, ScheduleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/core/common/PageContainer";
import AddCutFileModal from "../nesting/components/AddCutFileModal";
import CutFileDetailDrawer from "../nesting/components/CutFileDetailDrawer";
import { MAIN_ROUTES } from "../../routers/constants";
import { getRequest } from "../../services/baseService";
import { API_ENDPOINTS } from "src/constants/apiEndpoints";
const statusOptions = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: "Chưa phân bổ", value: "UNALLOCATED" },
  { label: "Đã phân bổ", value: "ALLOCATED" },
];
const Planning = () => {
  const navigate = useNavigate();
  const [cutFiles, setCutFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [keyWord, setKeyWord] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  // Modals & Drawers
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });
  const fetchPlanning = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        Page: pagination.current,
        PageSize: pagination.pageSize,
      };
      const keyword = keyWord.trim();
      if (keyword) {
        params.Search = keyword;
      }
      const response = await getRequest(
        API_ENDPOINTS.COMMAND_CUTTING_FILE.GET_ALL,
        params,
      );
      const result = response?.data ?? response;
      const data = result?.data ?? result;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(result?.items)
            ? result.items
            : [];
      const totalCount = Number(
        data?.totalCount ??
          data?.total ??
          data?.count ??
          result?.totalCount ??
          result?.total ??
          result?.count ??
          items.length,
      );
      setCutFiles(items);
      setTotal(totalCount);
    } catch (error) {
      console.error("Failed to fetch planning:", error);
      setCutFiles([]);
      setTotal(0);
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách kế hoạch.",
      );
    } finally {
      setLoading(false);
    }
  }, [keyWord, pagination.current, pagination.pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlanning();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchPlanning]);
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return cutFiles;
    return cutFiles.filter((ord) => {
      const isAllocated = Boolean(ord.plan);
      if (statusFilter === "UNALLOCATED") return !isAllocated;
      if (statusFilter === "ALLOCATED") return isAllocated;
      return true;
    });
  }, [cutFiles, statusFilter]);

  const handleSearch = (value) => {
    setKeyWord(value);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };
  const handleOpenDetail = (record) => {
    setSelectedOrder(record);
    setDrawerVisible(true);
  };
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingRecord(null);
  };
  const handleSaveOrder = () => {
    setEditingRecord(null);
    fetchPlanning();
  };
  const handleToggleAllocation = (record) => {
    // Chuyển sang màn hình Lịch phân bổ với dữ liệu của record
    navigate(MAIN_ROUTES.NESTING_ALLOCATION_SCHEDULE, { state: { record } });
  };
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 65,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, __, index) =>
        ((pagination.current || 1) - 1) * (pagination.pageSize || 10) +
        index +
        1,
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
            onClick={() => handleOpenDetail(record)}
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
      title: "Mã file",
      dataIndex: "cuttingFileCode",
      key: "cuttingFileCode",
      width: 200,
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
      title: "Kế hoạch",
      key: "plan",
      onHeaderCell: () => ({
        style: {
          whiteSpace: "nowrap",
          padding: "6px 12px",
          textAlign: "center",
        },
      }),
      children: [
        {
          title: "Máy",
          key: "plan_machine",
          width: 160,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => {
            if (!r.plan?.machineCode)
              return <span style={{ color: "#8c8c8c" }}>--</span>;
            const machines = Array.isArray(r.plan.machineCode)
              ? r.plan.machineCode
              : typeof r.plan.machineCode === "string"
                ? r.plan.machineCode.split(",").map((s) => s.trim())
                : [r.plan.machineCode];
            return (
              <Space wrap size={4} style={{ justifyContent: "center" }}>
                {machines.map((mc, idx) => (
                  <Tag
                    key={idx}
                    color="cyan"
                    style={{
                      fontWeight: 600,
                      margin: 2,
                    }}
                  >
                    {mc}
                  </Tag>
                ))}
              </Space>
            );
          },
        },
        {
          title: "Bắt đầu",
          key: "plan_start",
          width: 140,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) =>
            r.plan ? (
              <span style={{ fontWeight: 500 }}>
                {r.plan.startTime || "--"}
              </span>
            ) : (
              <span style={{ color: "#8c8c8c" }}>--</span>
            ),
        },
        {
          title: "Kết thúc",
          key: "plan_end",
          width: 140,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) =>
            r.plan ? (
              <span style={{ fontWeight: 500 }}>{r.plan.endTime || "--"}</span>
            ) : (
              <span style={{ color: "#8c8c8c" }}>--</span>
            ),
        },
      ],
    },
    {
      title: "Thời gian cắt",
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
      title: "Thao tác",
      key: "actions",
      width: 130,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, r) => {
        const isAllocated = Boolean(r.plan);
        return (
          <Button
            size="small"
            type={isAllocated ? "default" : "primary"}
            icon={isAllocated ? <CheckCircleOutlined /> : <ScheduleOutlined />}
            onClick={() => handleToggleAllocation(r)}
            style={
              isAllocated
                ? {
                    color: "#15803d",
                    borderColor: "#86efac",
                    background: "#f0fdf4",
                  }
                : undefined
            }
          >
            {isAllocated ? "Đã phân bổ" : "Phân bổ"}
          </Button>
        );
      },
    },
  ];
  return (
    <PageContainer
      className="nesting-page"
      title="Kế hoạch sản xuất"
      searchPlaceholder="Tìm theo LSX, Đơn hàng, Mã file..."
      searchValue={keyWord}
      onSearch={handleSearch}
      actionButtons={[
        <Space key="status-filter" size={6} className="machine-header-filter">
          <span>Phân bổ:</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            style={{ width: 170 }}
          />
        </Space>,
      ]}
      hideScroll={true}
    >
      <Table
        bordered
        className="table-cut-file"
        columns={columns}
        dataSource={filteredOrders}
        rowKey={(record) => record.id ?? record.planningId ?? record.code}
        loading={loading}
        size="small"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["50", "100", "200", "500"],
          showTotal: (total) => `Tổng số ${total} lệnh kế hoạch`,
          size: "small",
          style: { marginTop: 8 },
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              current: prev.pageSize !== pageSize ? 1 : page,
              pageSize,
            }));
          },
        }}
        scroll={{ x: 1050, y: "calc(100vh - 280px)" }}
      />
      <AddCutFileModal
        visible={modalVisible}
        editingRecord={editingRecord}
        onCancel={handleCloseModal}
        onSubmit={handleSaveOrder}
        defaultLsxCode={keyWord}
      />
      <CutFileDetailDrawer
        order={selectedOrder}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </PageContainer>
  );
};
export default Planning;
