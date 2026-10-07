import React, { useEffect, useState } from "react";
import { Drawer, Descriptions, Tag, Divider, Spin, message } from "antd";
import dayjs from "dayjs";
import { getRequest } from "../../../services/baseService";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";

const getStatusLabel = (status, statusName) => {
  if (statusName) {
    switch (statusName) {
      case "Created":
        return "Chưa phân bổ";
      case "Allocated":
      case "Planned":
        return "Đã phân bổ";
      case "Processing":
      case "InProgress":
        return "Đang gia công";
      case "Completed":
        return "Hoàn thành";
      default:
        return statusName;
    }
  }
  if (typeof status === "number") {
    switch (status) {
      case 0:
        return "Chưa phân bổ";
      case 1:
        return "Đã phân bổ";
      case 2:
        return "Đang gia công";
      case 3:
        return "Hoàn thành";
      default:
        return `Trạng thái ${status}`;
    }
  }
  return status || "Chưa phân bổ";
};

const getStatusColor = (status, statusName) => {
  const label = getStatusLabel(status, statusName);
  switch (label) {
    case "Chờ thực hiện":
    case "Chưa phân bổ":
    case "Created":
      return "default";
    case "Đang thực hiện":
    case "Đang gia công":
    case "Processing":
    case "InProgress":
      return "cyan";
    case "Tạm dừng":
      return "orange";
    case "Hoàn thành":
    case "Completed":
      return "success";
    case "Chờ gia công":
      return "warning";
    case "Đã phân bổ":
    case "Allocated":
    case "Planned":
      return "processing";
    case "Lỗi máy":
      return "error";
    default:
      return "blue";
  }
};

const getPriorityLabel = (priority, priorityName) => {
  if (priorityName) {
    switch (priorityName) {
      case "High":
        return "Cao (Gấp)";
      case "Medium":
        return "Trung bình";
      case "Low":
        return "Thấp";
      default:
        return priorityName;
    }
  }
  if (priority === 0 || priority === "0") return "Cao (Gấp)";
  if (priority === 1 || priority === "1") return "Trung bình";
  if (priority === 2 || priority === "2") return "Thấp";
  return priority || "Trung bình";
};

const getPriorityColor = (priority, priorityName) => {
  const label = getPriorityLabel(priority, priorityName);
  if (label.includes("Cao") || label.includes("High")) return "red";
  if (label.includes("Trung bình") || label.includes("Medium")) return "gold";
  return "blue";
};

const CutFileDetailDrawer = ({ order, visible, onClose }) => {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !order) {
      setDetailData(null);
      return;
    }

    const orderId =
      order.id ||
      order.cuttingFileId ||
      (typeof order === "string" ? order : null);

    if (!orderId) {
      setDetailData(order);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const endpoint = API_ENDPOINTS.COMMAND_CUTTING_FILE.GET_BY_ID.replace(
          "{id}",
          orderId,
        );
        const response = await getRequest(endpoint);
        const resData = response?.data ?? response;
        const finalData = resData?.data ?? resData ?? order;
        setDetailData(finalData);
      } catch (error) {
        console.error("Failed to fetch cutting file detail:", error);
        message.error(
          error?.response?.data?.message || "Không thể tải chi tiết file cắt.",
        );
        setDetailData(order);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [visible, order]);

  if (!order && !detailData) return null;

  const data = detailData || order || {};

  const productionCommandCodes =
    Array.isArray(data.productionCommands) && data.productionCommands.length > 0
      ? data.productionCommands
          .map((pc) => pc.productionCommandCode)
          .filter(Boolean)
          .join(", ")
      : data.code || data.productionCommandCode || "--";

  const orderNames =
    Array.isArray(data.productionCommands) && data.productionCommands.length > 0
      ? data.productionCommands
          .map((pc) => pc.orderName)
          .filter(Boolean)
          .join(", ")
      : data.orderName || "--";

  const createdDate = data.createdDate || data.date;
  const formattedDate =
    createdDate && dayjs(createdDate).isValid()
      ? dayjs(createdDate).format("DD/MM/YYYY HH:mm")
      : createdDate || "--";

  const isAllocated = Boolean(
    data.plan ||
    data.machineCode ||
    (data.plannedQuantity && data.plannedQuantity > 0),
  );

  const cuttingFileCode =
    data.cuttingFileCode || data.cuttingFileName || data.code || "--";

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            CHI TIẾT CHƯƠNG TRÌNH GIA CÔNG: {cuttingFileCode}
          </span>
          <Tag color={getStatusColor(data.status, data.statusName)}>
            {getStatusLabel(data.status, data.statusName)}
          </Tag>
        </div>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
    >
      <Spin spinning={loading}>
        {/* 1. THÔNG TIN NESTING */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e3a8a",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            1. THÔNG TIN NESTING
          </div>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Mã file cắt" span={2}>
              <span style={{ fontWeight: 600, color: "#1677ff" }}>
                {cuttingFileCode}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Tên file cắt" span={2}>
              <strong>{data.cuttingFileName || cuttingFileCode}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Loại file cắt" span={2}>
              {data.categoryCuttingFileName || data.categoryName || "--"}
            </Descriptions.Item>
            <Descriptions.Item label="LSX chính" span={1}>
              <strong style={{ color: "#0958d9" }}>
                {productionCommandCodes}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày lập" span={1}>
              {formattedDate}
            </Descriptions.Item>
            <Descriptions.Item label="Tên đơn hàng" span={2}>
              <strong>{orderNames}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Vật liệu" span={1}>
              <Tag color="geekblue" style={{ fontWeight: 600 }}>
                {data.materialCode || data.material || "--"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mức ưu tiên" span={1}>
              <Tag
                color={getPriorityColor(data.priority, data.priorityName)}
                style={{ fontWeight: 600 }}
              >
                {getPriorityLabel(data.priority, data.priorityName)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Quy cách phôi" span={2}>
              {data.length ?? data.spec?.length ?? "--"} ×{" "}
              {data.width ?? data.spec?.width ?? "--"} ×{" "}
              {data.thickness ?? data.spec?.thickness ?? "--"} mm
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng tấm" span={1}>
              <strong>
                {Number(data.quantity || 0).toLocaleString("vi-VN")}
              </strong>{" "}
              tấm
            </Descriptions.Item>
            <Descriptions.Item label="Số mét cắt" span={1}>
              <strong>
                {Number(
                  data.cuttingLength ?? data.cutLength ?? 0,
                ).toLocaleString("vi-VN")}
              </strong>{" "}
              m
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian cắt KH" span={1}>
              <strong style={{ color: "#1d4ed8" }}>
                {Number(
                  data.cuttingTime ?? data.cutDurationMinutes ?? 0,
                ).toLocaleString("vi-VN")}
              </strong>{" "}
              phút
            </Descriptions.Item>
            <Descriptions.Item label="Số lượng đã lên KH" span={1}>
              <strong style={{ color: "#0958d9" }}>
                {Number(data.plannedQuantity || 0).toLocaleString("vi-VN")}
              </strong>{" "}
              tấm
            </Descriptions.Item>
          </Descriptions>
        </div>

        <Divider style={{ margin: "14px 0" }} />

        {/* 2. KẾ HOẠCH PHÂN BỔ */}
        {/* <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e3a8a",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            2. KẾ HOẠCH PHÂN BỔ MÁY
          </div>
          {isAllocated ? (
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Máy cắt chỉ định" span={2}>
                <Tag color="cyan" style={{ fontWeight: 700, fontSize: 13 }}>
                  {data.plan?.machineCode || data.machineCode || "Đã phân bổ"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="SL đã lập KH" span={1}>
                <strong>
                  {Number(
                    data.plannedQuantity || data.plan?.quantity || 0,
                  ).toLocaleString("vi-VN")}
                </strong>{" "}
                tấm
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kế hoạch" span={1}>
                {data.plan?.startDate || formattedDate}
              </Descriptions.Item>
              <Descriptions.Item label="Giờ bắt đầu dự kiến" span={1}>
                <strong>{data.plan?.startTime || "--"}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Giờ kết thúc dự kiến" span={1}>
                <strong>{data.plan?.endTime || "--"}</strong>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: 6,
                border: "1px dashed #cbd5e1",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Chưa được phân bổ máy cắt. Việc phân bổ có thể thực hiện trên màn
              hình Kế hoạch.
            </div>
          )}
        </div> */}

        {/* <Divider style={{ margin: "14px 0" }} /> */}

        {/* 3. THỰC TẾ GIA CÔNG */}
        {/* <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e3a8a",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            3. THỰC TẾ GIA CÔNG
          </div>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Vật tư" span={1}>
              <Tag
                color={
                  data.execution?.hasMaterial || data.hasMaterial
                    ? "success"
                    : "default"
                }
              >
                {data.execution?.hasMaterial || data.hasMaterial
                  ? "Đã có phôi"
                  : "Chưa có phôi"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Công nhân đứng máy" span={1}>
              {data.execution?.operatorName || data.operatorName || "Chưa giao"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ bắt đầu thực tế" span={1}>
              <span>
                {data.execution?.actualStartTime ||
                  data.actualStartTime ||
                  "--"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Sản lượng hoàn thành" span={1}>
              <strong style={{ color: "#16a34a" }}>
                {Number(data.completedQuantity || 0).toLocaleString("vi-VN")}
              </strong>{" "}
              / {Number(data.quantity || 0).toLocaleString("vi-VN")} tấm
            </Descriptions.Item>
            {(data.execution?.notes || data.notes) && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {data.execution?.notes || data.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div> */}
      </Spin>
    </Drawer>
  );
};

export default CutFileDetailDrawer;
