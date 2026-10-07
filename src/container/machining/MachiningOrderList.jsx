import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Col,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  MenuOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  INITIAL_MACHINING_ORDERS,
  MACHINE_OPTIONS,
  PHOI_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "./mockData";
import { useAppSelector } from "../../store/hooks";

const { Text } = Typography;

const formatRunningTime = (totalSeconds) => {
  if (!totalSeconds) return "--:--:--";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const getProgressPercent = (completed, total) => {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
};

const getStatusClass = (status) => {
  switch (status) {
    case "Đang gia công":
      return "status-running";
    case "Chờ thực hiện":
      return "status-waiting";
    case "Tạm dừng":
      return "status-paused";
    case "Hoàn thành":
      return "status-completed";
    default:
      return "status-waiting";
  }
};

const getRowClass = (status) => {
  switch (status) {
    case "Đang gia công":
      return "row-running";
    case "Tạm dừng":
      return "row-paused";
    case "Hoàn thành":
      return "row-completed";
    default:
      return "";
  }
};

const StatusBadge = ({ status }) => (
  <span className={`machining-status-badge ${getStatusClass(status)}`}>
    <span className="status-dot" />
    {status}
  </span>
);
const ActiveOrderPanel = ({ record }) => {
  if (!record) {
    return (
      <div className="active-order-panel active-order-empty">
        <Text type="secondary">
          Hiện chưa có lệnh nào đang gia công trên máy.
        </Text>
      </div>
    );
  }

  const isRunning = record.status === "Đang gia công";
  const isPaused = record.status === "Tạm dừng";
  const percent = getProgressPercent(
    record.completedSheets,
    record.totalSheets,
  );

  return (
    <div className="active-order-panel">
      {/* ===== HEADER TRẠM ===== */}
      <div className="active-panel-station">
        <Row gutter={[0, 0]} align="middle" justify="space-between" wrap>
          <Col xs={24} md={14}>
            <div className="station-info">
              <div className="station-avatar">
                <UserOutlined />
              </div>
              <div className="station-text">
                <div className="station-name">
                  TRẠM GIA CÔNG CẮT LASER · {record.operatorName}
                  <span className="station-code"> ({record.operatorCode})</span>
                </div>
                <div className="station-meta">
                  Ca làm việc: <strong>Ca 1 (08:00 – 17:00)</strong>
                  &nbsp;·&nbsp;Trạng thái:&nbsp;
                  <span className="station-online-dot" />
                  <span className="station-online-text">Sẵn sàng gia công</span>
                </div>
              </div>
            </div>
          </Col>

          {/* Phải: Máy gia công + Nút danh sách */}
          <Col xs={24} md={10}>
            <Row gutter={[8, 8]} justify="end" align="middle">
              <Col>
                <Space size={6} align="center">
                  <Text style={{ fontSize: 13, color: "#64748b" }}>
                    Máy gia công:
                  </Text>
                  <Select
                    value={record.machine}
                    options={MACHINE_OPTIONS.filter((o) => o.value !== "ALL")}
                    style={{ width: 185 }}
                    size="small"
                  />
                </Space>
              </Col>
              <Col>
                <Button type="primary" icon={<MenuOutlined />}>
                  Danh sách lệnh gia công ({INITIAL_MACHINING_ORDERS.length})
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* ===== ORDER DETAIL ===== */}
      <div className="active-panel-detail">
        {/* Title + trạng thái */}
        <div className="detail-title-row">
          <Row gutter={[8, 8]} align="middle" justify="space-between" wrap>
            <Col xs={24} md={14}>
              <Space size={10} wrap>
                <span className="detail-lsx">{record.lsxCode}</span>
                <span className="detail-sep">·</span>
                <span className="detail-order-name">{record.orderName}</span>
                <Tag
                  color={record.priority === "Cao" ? "red" : "gold"}
                  style={{ fontWeight: 700, fontSize: 11 }}
                >
                  Ưu tiên: {record.priority}
                </Tag>
              </Space>
              <div className="detail-machine-meta">
                Máy phân bổ:{" "}
                <strong>
                  {record.machineLabel}
                </strong>
                &nbsp;(Laser Fiber Yawei HLB 3015) · Khung giờ KH:{" "}
                <strong>
                  {record.frameStart} – {record.frameEnd}
                </strong>
              </div>
            </Col>
            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end" wrap>
                <Col>
                  <Button
                    icon={<CheckCircleFilled />}
                    style={{
                      background: "#f0fdf4",
                      borderColor: "#86efac",
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    ✓ Đã có phôi sẵn sàng ({record.totalSheets})
                  </Button>
                </Col>
                <Col>
                  <StatusBadge status={record.status} />
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        {/* Thông số chi tiết */}
        <div className="detail-info-grid">
          <Row gutter={[16, 10]}>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">MÃ FILE CẮT</div>
              <div className="info-value mono">{record.cuttingFileCode}</div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">VẬT LIỆU PHÔI</div>
              <div className="info-value">
                {record.material} (Độ dày: {record.thickness}mm)
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">KÍCH THƯỚC TÔN (DÀI × RỘNG)</div>
              <div className="info-value">{record.sheetSize}</div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">SỐ LƯỢNG PHÔI (TẤM)</div>
              <div className="info-value highlight-green">
                {record.totalSheets} tấm
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">SỐ LƯỢNG CHI TIẾT</div>
              <div className="info-value highlight-blue">
                {record.totalDetails} chi tiết
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">TỔNG MÉT CẮT</div>
              <div className="info-value mono">
                {Number(record.cutMeter).toLocaleString("vi-VN")} mét
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">THỜI GIAN CẮT DỰ KIẾN</div>
              <div className="info-value mono">
                {record.estimatedMinutes} phút (
                {(record.estimatedMinutes / 60).toFixed(1)}h)
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">KHI CẮT HỖ TRỢ</div>
              <div className="info-value">{record.assistGas}</div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="info-label">VỊ TRÍ MÁY XƯỞNG</div>
              <div className="info-value">{record.location}</div>
            </Col>
          </Row>
        </div>

        {/* Footer: thời gian + actions */}
        <div className="detail-footer">
          <Row gutter={[12, 8]} align="middle" justify="space-between" wrap>
            {/* Thời gian + SL nghiệm thu */}
            <Col xs={24} md={14}>
              <Row gutter={[24, 0]} wrap>
                <Col>
                  <div className="footer-time-label">THỜI GIAN BẮT ĐẦU:</div>
                  <div className="footer-time-value">
                    {record.actualStart
                      ? `${record.actualStart} (${record.frameDate})`
                      : "--"}
                  </div>
                </Col>
                <Col>
                  <div className="footer-time-label">THỜI GIAN KẾT THÚC:</div>
                  <div className="footer-time-value">
                    {record.actualEnd || "--:--"}
                  </div>
                </Col>
                {/* <Col>
                  <div className="footer-time-label">SL NGHIỆM THU:</div>
                  <div className="footer-time-value">
                    {record.completedSheets} / {record.totalSheets} tấm ({percent}%)
                  </div>
                </Col> */}
                {isRunning && record.runningSeconds && (
                  <Col>
                    <div className="running-clock">
                      <ClockCircleOutlined />
                      <span>Thời gian đang chạy:</span>
                      <span className="clock-digits">
                        {formatRunningTime(record.runningSeconds)}
                      </span>
                    </div>
                  </Col>
                )}
              </Row>
            </Col>

            {/* Nút hành động */}
            <Col xs={24} md={10}>
              <Row gutter={[8, 8]} justify="end" wrap>
                {isRunning && (
                  <>
                    <Col>
                      <Button
                        type="primary"
                        icon={<CheckCircleFilled />}
                        size="large"
                        style={{
                          fontWeight: 700,
                          backgroundColor: "#52c41a",
                          borderColor: "#52c41a",
                        }}
                      >
                        BẮT ĐẦU
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        danger
                        icon={<CheckCircleFilled />}
                        size="large"
                        style={{ fontWeight: 700 }}
                      >
                        KẾT THÚC
                      </Button>
                    </Col>
                  </>
                )}
                {isPaused && (
                  <>
                    <Col>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        style={{
                          background: "#16a34a",
                          borderColor: "#16a34a",
                        }}
                      >
                        Tiếp tục máy
                      </Button>
                    </Col>
                    <Col>
                      <Button
                        type="primary"
                        danger
                        icon={<CheckCircleFilled />}
                        size="large"
                        style={{ fontWeight: 700 }}
                      >
                        KẾT THÚC GIA CÔNG
                      </Button>
                    </Col>
                  </>
                )}
              </Row>
            </Col>
          </Row>

          {/* Trạng thái thực hiện + tạm dừng */}
          {(isRunning || isPaused) && (
            <div className="detail-status-bar">
              {isRunning && (
                <span className="status-bar-running">
                  ✓ Đang gia công từ: <strong>{record.actualStart}</strong>
                </span>
              )}
              {isPaused && (
                <span className="status-bar-paused">
                  ⏸ Tạm dừng từ: <strong>{record.actualStart}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const buildTableColumns = (pagination) => [
  {
    title: "STT",
    key: "stt",
    width: 55,
    align: "center",
    fixed: "left",
    render: (_, __, index) =>
      (pagination.current - 1) * pagination.pageSize + index + 1,
  },
  {
    title: <span>Mã LSX &amp; Đơn hàng</span>,
    key: "lsx",
    width: 160,
    fixed: "left",
    render: (_, r) => (
      <>
        <div className="lsx-link">{r.lsxCode}</div>
        <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
          {r.orderName}
        </div>
      </>
    ),
  },
  {
    title: "Mã file cắt",
    dataIndex: "cuttingFileCode",
    key: "cuttingFileCode",
    width: 155,
    render: (v) => <span className="file-code">{v}</span>,
  },
  {
    title: "Vật liệu & Quy cách",
    key: "material",
    width: 165,
    render: (_, r) => (
      <>
        <Tag color="geekblue" style={{ fontWeight: 600, marginBottom: 2 }}>
          {r.material} ({r.thickness}mm)
        </Tag>
        <div style={{ fontSize: 11, color: "#64748b" }}>{r.sheetSize}</div>
      </>
    ),
  },
  {
    title: "Khung giờ KH",
    key: "frame",
    width: 120,
    align: "center",
    render: (_, r) => (
      <>
        <div style={{ fontWeight: 700, fontSize: 13 }}>
          {r.frameStart} – {r.frameEnd}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.frameDate}</div>
      </>
    ),
  },
  {
    title: "Tình trạng phôi (Vật tư)",
    key: "phoi",
    width: 185,
    align: "center",
    render: (_, r) => {
      if (r.status === "Hoàn thành")
        return <Tag color="blue">Đã nghiệm thu</Tag>;
      if (r.hasMaterial && r.materialConfirmed)
        return (
          <Space direction="vertical" size={2}>
            <Tag
              color="success"
              icon={<CheckCircleFilled />}
              style={{ fontWeight: 600 }}
            >
              Đã có phôi
            </Tag>
            {r.status !== "Đang gia công" && (
              <Button
                size="small"
                type="link"
                style={{ padding: 0, fontSize: 11 }}
              >
                (Hủy xác nhận)
              </Button>
            )}
          </Space>
        );
      return (
        <Space direction="vertical" size={4}>
          <Tag
            color="error"
            icon={<ExclamationCircleFilled />}
            style={{ fontWeight: 600 }}
          >
            Chưa có phôi (&lt; 2H)
          </Tag>
          <Button
            size="small"
            type="primary"
            style={{
              background: "#16a34a",
              borderColor: "#16a34a",
              fontSize: 11,
            }}
          >
            ✓ Xác nhận có phôi
          </Button>
        </Space>
      );
    },
  },
  {
    title: (
      <span>
        SL Tấm
        <br />
        (Đã cắt / KH)
      </span>
    ),
    key: "sheets",
    width: 105,
    align: "center",
    render: (_, r) => {
      const pct = getProgressPercent(r.completedSheets, r.totalSheets);
      return (
        <>
          <div>
            <span className="sheet-count-done">{r.completedSheets}</span>
            <span className="sheet-count-total"> / {r.totalSheets}</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>tấm</div>
          <Progress
            percent={pct}
            size="small"
            showInfo={false}
            strokeColor="#22c55e"
            style={{ marginTop: 2 }}
          />
          <div style={{ fontSize: 11, color: "#64748b" }}>{pct}%</div>
        </>
      );
    },
  },
  {
    title: "SL Chi tiết",
    dataIndex: "totalDetails",
    key: "totalDetails",
    width: 85,
    align: "center",
    render: (v) => (
      <span>
        {v} <span style={{ color: "#94a3b8" }}>CT</span>
      </span>
    ),
  },
  {
    title: "Trạng thái gia công",
    dataIndex: "status",
    key: "status",
    width: 155,
    align: "center",
    render: (status) => <StatusBadge status={status} />,
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 115,
    fixed: "right",
    align: "center",
    render: (_, r) => {
      if (r.status === "Hoàn thành")
        return (
          <Button size="small" disabled icon={<CheckCircleFilled />} block>
            Đã xong
          </Button>
        );
      if (r.status === "Đang gia công")
        return (
          <Button
            size="small"
            type="default"
            block
            style={{ fontSize: 11, color: "#1677ff", borderColor: "#bfdbfe" }}
          >
            • Đang nạp
          </Button>
        );
      if (r.status === "Tạm dừng")
        return (
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            block
          >
            Tiếp tục
          </Button>
        );
      return (
        <Button size="small" type="primary" block>
          Nạp vào máy
        </Button>
      );
    },
  },
];

const MachiningOrderList = () => {
  const [searchText, setSearchText] = useState("");
  const [machineFilter, setMachineFilter] = useState("ALL");
  const [phoiFilter, setPhoiFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 8 });
  const [tableScrollY, setTableScrollY] = useState(300);
  const tableWrapperRef = useRef(null);
  const authUser = useAppSelector((state) => state.auth.user) || {};

  useEffect(() => {
    const el = tableWrapperRef.current;
    if (!el) return;
    const update = () => {
      // Trừ ~46px cho pagination + margin
      setTableScrollY(Math.max(el.clientHeight - 46, 100));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Lệnh đang gia công hiển thị ở phần trên */
  const activeOrder = useMemo(
    () =>
      INITIAL_MACHINING_ORDERS.find((o) => o.status === "Đang gia công") ??
      null,
    [],
  );

  /* Lọc danh sách bảng */
  const filteredOrders = useMemo(() => {
    return INITIAL_MACHINING_ORDERS.filter((item) => {
      if (searchText) {
        const t = searchText.toLowerCase().trim();
        const ok =
          (item.lsxCode || "").toLowerCase().includes(t) ||
          (item.orderName || "").toLowerCase().includes(t) ||
          (item.cuttingFileCode || "").toLowerCase().includes(t);
        if (!ok) return false;
      }
      if (machineFilter !== "ALL" && item.machine !== machineFilter)
        return false;
      if (phoiFilter === "HAS" && !item.hasMaterial) return false;
      if (phoiFilter === "NO" && item.hasMaterial) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      return true;
    });
  }, [searchText, machineFilter, phoiFilter, statusFilter]);

  const tableColumns = useMemo(
    () => buildTableColumns(pagination),
    [pagination],
  );

  return (
    <div className="machining-page">
      <ActiveOrderPanel record={activeOrder} />

      <div className="machining-list-section">
        {/* Header danh sách */}
        {/* <div className="list-section-header">
          <Row gutter={[12, 10]} align="middle" wrap>
            <Col xs={24} md={7}>
              <div className="list-section-title">
                <UnorderedListOutlined style={{ marginRight: 6 }} />
                DANH SÁCH LỆNH GIA CÔNG
                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 600 }}>
                  {filteredOrders.length} lệnh
                </Tag>
              </div>
              <div className="list-section-subtitle">
                Chọn lệnh bất kỳ để nạp vào trạm gia công hoặc tiếp tục các lệnh
                chưa hoàn thành
              </div>
            </Col>

            <Col xs={24} md={17}>
              <Row gutter={[8, 8]} justify="end" wrap>
                <Col xs={24} sm={12} md={6}>
                  <input
                    className="list-search-input"
                    placeholder="Tìm LSX, Đơn hàng, File cắt..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </Col>
                <Col xs={8} sm={6} md={4}>
                  <Space size={4} align="center">
                    <span className="filter-label">Máy:</span>
                    <Select
                      value={machineFilter}
                      onChange={setMachineFilter}
                      options={MACHINE_OPTIONS}
                      style={{ width: "100%", minWidth: 170 }}
                      size="small"
                    />
                  </Space>
                </Col>
                <Col xs={8} sm={6} md={3}>
                  <Space size={4} align="center">
                    <span className="filter-label">Phôi:</span>
                    <Select
                      value={phoiFilter}
                      onChange={setPhoiFilter}
                      options={PHOI_FILTER_OPTIONS}
                      style={{ width: "100%", minWidth: 120 }}
                      size="small"
                    />
                  </Space>
                </Col>
                <Col xs={8} sm={6} md={4}>
                  <Space size={4} align="center">
                    <span className="filter-label">Trạng thái:</span>
                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={STATUS_FILTER_OPTIONS}
                      style={{ width: "100%", minWidth: 145 }}
                      size="small"
                    />
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
        </div> */}

        {/* Bảng danh sách */}
        <div className="machining-table-wrapper" ref={tableWrapperRef}>
          <Table
            bordered
            className="machining-table"
            columns={tableColumns}
            dataSource={filteredOrders}
            rowKey="id"
            size="small"
            rowClassName={(record) => getRowClass(record.status)}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              size: "small",
              showTotal: (total) => `${total} / trang`,
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
            }}
            sticky
               scroll={{ x: 1100, y: "calc(100vh - 580px)" }}
          />
        </div>
      </div>
    </div>
  );
};

export default MachiningOrderList;
