import React, { useMemo, useState } from "react";
import {
  Button,
  Row,
  Col,
  DatePicker,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat";
import PageContainer from "../../components/core/common/PageContainer";
import { INITIAL_CUT_FILES } from "../nesting/mockData";
import StatCard from "./components/StatCard";
dayjs.extend(customParseFormat);
const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");
// Khởi tạo dữ liệu quản lý cấp phôi dựa trên dữ liệu lệnh sản xuất
const INITIAL_SUPPLY_DATA = INITIAL_CUT_FILES.map((item, index) => ({
  id: item.id || `supply_${index + 1}`,
  code: item.code,
  orderName: item.orderName,
  cuttingFileCode: item.cuttingFileCode,
  material: item.material,
  spec: item.spec || { length: 2440, width: 1220, thickness: 1.0 },
  quantity: item.quantity || 10,
  partQuantity: item.partQuantity || 40,
  cutLength: item.cutLength || 200,
  cutDurationMinutes: item.cutDurationMinutes || 60,
  plan: item.plan || null,
  // Trạng thái cấp phôi (giả lập một vài lệnh đã cấp trước đó)
  isSupplied: index === 0,
  suppliedTime: index === 0 ? "07:35 02/10/2026" : null,
  supplier: index === 0 ? "Nguyễn Văn Tuấn (Kho Phôi)" : null,
  note: index === 0 ? "Đã giao đủ 96 tấm tại Pallet K1-04" : "",
}));
// Tùy chọn lọc trạng thái cấp phôi
const statusFilterOptions = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: "Chưa cấp phôi", value: "UNSUPPLIED" },
  { label: "Đã cấp phôi", value: "SUPPLIED" },
];

// Tùy chọn lọc máy
const machineFilterOptions = [
  { label: "Tất cả máy", value: "ALL" },
  { label: "Máy 01", value: "M01" },
  { label: "Máy 02", value: "M02" },
  { label: "Máy 03", value: "M03" },
];

// Component thẻ thống kê
// Tùy chọn thời gian cấp trước (n)
const leadTimeOptions = [
  { label: "Cấp trước 15 phút (n = 15p)", value: 15 },
  { label: "Cấp trước 30 phút (n = 30p)", value: 30 },
  { label: "Cấp trước 45 phút (n = 45p)", value: 45 },
  { label: "Cấp trước 60 phút (n = 60p)", value: 60 },
  { label: "Cấp trước 90 phút (n = 90p)", value: 90 },
];
/**
 * Tính toán Thời gian kế hoạch cấp phôi = Thời gian bắt đầu - n phút
 */
const calculateSupplyPlan = (plan, leadMinutes = 30) => {
  if (!plan?.startTime) return null;
  const [hours, minutes] = plan.startTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  let totalMinutes = hours * 60 + minutes - leadMinutes;
  let dayOffset = 0;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayOffset = -1;
  }
  const planHours = Math.floor(totalMinutes / 60);
  const planMins = totalMinutes % 60;
  const timeFormatted = `${String(planHours).padStart(2, "0")}:${String(planMins).padStart(2, "0")}`;
  return {
    time: timeFormatted,
    startTime: plan.startTime,
    leadMinutes,
    dayOffset,
    date: plan.startDate || "",
    machineCode: plan.machineCode || "",
  };
};
const MaterialSupply = () => {
  const [supplyList, setSupplyList] = useState(INITIAL_SUPPLY_DATA);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [machineFilter, setMachineFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [leadMinutes, setLeadMinutes] = useState(30);
  const [activeStatCard, setActiveStatCard] = useState(null);
  // Phân trang
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });
  // Modal Xác nhận cấp phôi
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  // Thống kê tổng hợp
  const stats = useMemo(() => {
    const total = supplyList.length;
    const supplied = supplyList.filter((i) => i.isSupplied).length;
    const unsupplied = supplyList.filter((i) => !i.isSupplied);
    const unsuppliedCount = unsupplied.length;
    const totalUnsuppliedSheets = unsupplied.reduce(
      (acc, i) => acc + (i.quantity || 0),
      0,
    );
    // Giả lập: sắp đến hạn = những lệnh chưa cấp có plan.startTime trong vòng 60 phút tới
    const now = dayjs();
    const nearDeadline = unsupplied.filter((i) => {
      if (!i.plan?.startTime) return false;
      const [h, m] = i.plan.startTime.split(":").map(Number);
      const startMinutes = h * 60 + m;
      const nowMinutes = now.hour() * 60 + now.minute();
      return startMinutes - nowMinutes <= 60 && startMinutes - nowMinutes > 0;
    }).length;
    const overdue = unsupplied.filter((i) => {
      if (!i.plan?.startTime) return false;
      const [h, m] = i.plan.startTime.split(":").map(Number);
      const startMinutes = h * 60 + m;
      const nowMinutes = now.hour() * 60 + now.minute();
      return startMinutes - nowMinutes < 0;
    }).length;
    return {
      total,
      supplied,
      unsuppliedCount,
      totalUnsuppliedSheets,
      nearDeadline,
      overdue,
    };
  }, [supplyList]);

  // Dữ liệu lọc theo từ khóa và trạng thái
  const filteredData = useMemo(() => {
    return supplyList.filter((item) => {
      if (searchText) {
        const text = searchText.toLowerCase().trim();
        const matchCode = (item.code || "").toLowerCase().includes(text);
        const matchOrder = (item.orderName || "").toLowerCase().includes(text);
        const matchFile = (item.cuttingFileCode || "")
          .toLowerCase()
          .includes(text);
        const matchMat = (item.material || "").toLowerCase().includes(text);
        if (!matchCode && !matchOrder && !matchFile && !matchMat) return false;
      }
      if (statusFilter === "UNSUPPLIED" && item.isSupplied) return false;
      if (statusFilter === "SUPPLIED" && !item.isSupplied) return false;
      return true;
    });
  }, [supplyList, searchText, statusFilter]);
  // Mở modal xác nhận cấp phôi
  const handleOpenSupplyModal = (record) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };
  // Đóng modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
  };
  // Xác nhận cấp phôi
  const handleConfirmSupply = () => {
    if (!selectedRecord) return;
    const formattedTime = dayjs().format("HH:mm DD/MM/YYYY");
    setSupplyList((prev) =>
      prev.map((item) => {
        if (item.id === selectedRecord.id) {
          return {
            ...item,
            isSupplied: true,
            suppliedTime: formattedTime,
            supplier: item.supplier || "Nguyễn Văn Tuấn (Kho Phôi)",
            note: item.note || "",
          };
        }
        return item;
      }),
    );
    message.success(
      `Đã xác nhận cấp phôi cho lệnh "${selectedRecord.code}" lúc ${formattedTime}!`,
    );
    handleCloseModal();
  };
  // Cấu hình các cột bảng theo đúng yêu cầu
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 65,
      align: "center",
      fixed: "left",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã lệnh sản xuất",
      dataIndex: "code",
      key: "code",
      width: 160,
      fixed: "left",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record) => (
        <Tooltip
          title={`Đơn hàng: ${record.orderName} | File: ${record.cuttingFileCode}`}
        >
          <span
            style={{
              color: "#1677ff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {record.code}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Quy cách Phôi",
      key: "spec",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      children: [
        {
          title: "Dài",
          key: "length",
          width: 85,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => r.spec?.length,
        },
        {
          title: "Rộng",
          key: "width",
          width: 85,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => r.spec?.width,
        },
        {
          title: "Dày",
          key: "thickness",
          width: 85,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => (
            <span style={{ fontWeight: 600 }}>{r.spec?.thickness}</span>
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
          width: 115,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (q) => <span>{q} tấm</span>,
        },
        {
          title: "SL chi tiết",
          key: "partQuantity",
          width: 135,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, r) => {
            const pq = r.partQuantity ?? (r.quantity ? r.quantity * 4 : 0);
            return <span>{pq.toLocaleString()} CT</span>;
          },
        },
      ],
    },
    {
      title: "Mét cắt",
      dataIndex: "cutLength",
      key: "cutLength",
      width: 115,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (m) => <span>{formatNumber(m)} m</span>,
    },
    {
      title: "TG cắt (phút)",
      dataIndex: "cutDurationMinutes",
      key: "cutDurationMinutes",
      width: 145,
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (t) => <span>{t} phút</span>,
    },
    {
      title: "Kế hoạch cấp",
      key: "plan",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      children: [
        {
          title: "Bắt đầu",
          key: "startTime",
          width: 100,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, record) => record.plan?.startTime ?? "-",
        },
        {
          title: "Kết thúc",
          key: "endTime",
          width: 100,
          align: "center",
          onHeaderCell: () => ({
            style: { whiteSpace: "nowrap", padding: "6px 12px" },
          }),
          render: (_, record) => record.plan?.endTime ?? "-",
        },
      ],
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      fixed: "right",
      align: "center",
      onHeaderCell: () => ({
        style: { whiteSpace: "nowrap", padding: "6px 12px" },
      }),
      render: (_, record) => {
        if (record.isSupplied) {
          return (
            <Space direction="vertical" size={2} align="center">
              <Tag
                color="success"
                style={{
                  fontWeight: 600,
                  padding: "3px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircleOutlined />
                Đã cấp phôi
              </Tag>
              <span
                style={{
                  fontSize: 11,
                  color: "#15803d",
                }}
              >
                {record.suppliedTime}
              </span>
              <Button
                size="small"
                type="link"
                style={{
                  padding: 0,
                  height: "auto",
                  fontSize: 11,
                }}
                onClick={() => handleOpenSupplyModal(record)}
              >
                Cập nhật lại
              </Button>
            </Space>
          );
        }
        return (
          <Button
            size="small"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => handleOpenSupplyModal(record)}
            style={{
              background: "#2563eb",
              borderColor: "#2563eb",
              fontWeight: 500,
            }}
          >
            Cấp phôi
          </Button>
        );
      },
    },
  ];
  const statsHeader = (
    <Row gutter={[12, 16]} className="stat-card-wrapper">
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <StatCard
          icon={<CalendarOutlined />}
          label="Cần cấp trong ngày"
          count={13}
          sub="Gồm 1 lệnh tồn trước"
          color="#1677ff"
          active={statusFilter === "NEED_TODAY"}
          onClick={() => setStatusFilter("NEED_TODAY")}
        />
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <StatCard
          icon={<CheckCircleOutlined />}
          label="Đã cấp đủ"
          count={5}
          sub="38% số lệnh cần cấp"
          color="#52c41a"
          active={statusFilter === "FULLY_ALLOCATED"}
          onClick={() => setStatusFilter("FULLY_ALLOCATED")}
        />
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={5}>
        <StatCard
          icon={<ExclamationCircleOutlined />}
          label="Còn phải cấp"
          count={8}
          sub="442 tấm chưa cấp"
          color="#1677ff"
          active={statusFilter === "REMAINING"}
          onClick={() => setStatusFilter("REMAINING")}
        />
      </Col>
      <Col xs={24} sm={12} md={12} lg={8} xl={5}>
        <StatCard
          icon={<ClockCircleOutlined />}
          label="Sắp đến hạn"
          count={3}
          sub="Trong 60 phút tới"
          color="#faad14"
          active={statusFilter === "DUE_SOON"}
          onClick={() => setStatusFilter("DUE_SOON")}
        />
      </Col>
      <Col xs={24} sm={12} md={12} lg={4} xl={4}>
        <StatCard
          icon={<WarningOutlined />}
          label="Quá hạn chưa cấp đủ"
          count={3}
          sub="Gồm 1 lệnh tồn trước"
          color="#ff4d4f"
          active={statusFilter === "OVERDUE"}
          onClick={() => setStatusFilter("OVERDUE")}
        />
      </Col>
    </Row>
  );

  return (
    <PageContainer
      className="nesting-page machine-page material-supply-page"
      title="Quản lý cấp phôi"
      searchPlaceholder="Tìm mã lệnh, vật liệu..."
      searchValue={searchText}
      onSearch={setSearchText}
      actionButtons={[
        <DatePicker
          key="date-picker"
          value={selectedDate}
          onChange={setSelectedDate}
          format="DD/MM/YYYY"
          allowClear={false}
          style={{ width: 140 }}
        />,
        <Select
          key="machine-filter"
          value={machineFilter}
          onChange={setMachineFilter}
          options={machineFilterOptions}
          style={{ width: 150 }}
        />,
        <Select
          key="status-filter"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setActiveStatCard(null);
          }}
          options={statusFilterOptions}
          style={{ width: 160 }}
        />,
      ]}
      headerTabs={statsHeader}
      hideScroll={true}
    >
      <Table
        bordered
        className="table-cut-file"
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        size="small"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100", "200"],
          showTotal: (total) => `Tổng số ${total} lệnh cấp phôi`,
          size: "small",
          style: { marginTop: 8 },
          onChange: (p, ps) => {
            setPagination({
              current: p,
              pageSize: ps,
            });
          },
        }}
        scroll={{ x: 1200, y: "calc(100vh - 400px)" }}
      />
      {/* MODAL XÁC NHẬN CẤP PHÔI */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            XÁC NHẬN CẤP PHÔI CHO LỆNH SẢN XUẤT
          </div>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleConfirmSupply}
        okText="Xác nhận cấp"
        cancelText="Hủy"
        width={540}
        destroyOnClose
      >
        {selectedRecord && (
          <div
            style={{
              background: "#f8fafc",
              padding: "12px 16px",
              borderRadius: 6,
              marginBottom: 16,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span>
                <strong>Mã lệnh SX:</strong>{" "}
                <span
                  style={{
                    color: "#1677ff",
                    fontWeight: 700,
                  }}
                >
                  {selectedRecord.code}
                </span>
              </span>
              <span>
                <strong>Số lượng:</strong>{" "}
                <span style={{ fontWeight: 700 }}>
                  {selectedRecord.quantity} tấm
                </span>
              </span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>Đơn hàng:</strong> {selectedRecord.orderName}
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>Quy cách phôi:</strong>{" "}
              <Tag color="geekblue">{selectedRecord.material}</Tag>{" "}
              <span>
                {selectedRecord.spec?.thickness} × {selectedRecord.spec?.width}{" "}
                × {selectedRecord.spec?.length} mm
              </span>
            </div>
            {selectedRecord.plan?.startTime && (
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px dashed #cbd5e1",
                  color: "#475569",
                  fontSize: 12,
                }}
              >
                <InfoCircleOutlined
                  style={{ marginRight: 4, color: "#2563eb" }}
                />
                Giờ máy bắt đầu cắt:{" "}
                <strong>{selectedRecord.plan.startTime}</strong> | Giờ cấp dự
                kiến:{" "}
                <strong>
                  {calculateSupplyPlan(selectedRecord.plan, leadMinutes)?.time}
                </strong>{" "}
                (Bắt đầu - {leadMinutes}p)
              </div>
            )}
          </div>
        )}
        <div style={{ color: "#334155", fontSize: 14 }}>
          Bạn có chắc chắn muốn xác nhận cấp phôi cho lệnh sản xuất này không?
        </div>
      </Modal>
    </PageContainer>
  );
};
export default MaterialSupply;
