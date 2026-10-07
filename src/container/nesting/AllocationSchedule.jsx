import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppstoreAddOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  RetweetOutlined,
  DragOutlined,
  SaveOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import PageContainer from "../../components/core/common/PageContainer";
import { MAIN_ROUTES } from "../../routers/constants";
import { getRequest } from "../../services/baseService";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
const { Text } = Typography;
// Danh sách máy được lấy từ API /api/Machine
const INITIAL_GANTT_JOBS = [
  {
    id: "job_1",
    machineCode: "KQ01",
    code: "SOLAR.50K/01",
    fileCode: "SOL-50-AL-3.0",
    orderName: "Vỏ biến tần Solar 50KW",
    material: "Nhôm A5052 3mm",
    startTime: "07:30",
    endTime: "10:30",
    status: "running",
    operator: "Lê Hoàng Nam",
  },
  {
    id: "job_5",
    machineCode: "KQ01",
    code: "CKD.299/06",
    fileCode: "TD-299_SS400_2.5",
    orderName: "Tủ điện trung thế K1",
    material: "SS400 2.5mm",
    startTime: "10:30",
    endTime: "13:00",
    status: "scheduled",
    operator: "Nguyễn Văn Tuấn",
  },
  {
    id: "job_3",
    machineCode: "KQ012",
    code: "CANH.CUA/03",
    fileCode: "CUA-E60-SPCC-1.5",
    orderName: "Cánh cửa thép chống cháy E60",
    material: "SPCC 1.5mm",
    startTime: "07:30",
    endTime: "10:30",
    status: "running",
    operator: "Trần Văn Hùng",
  },
];
const timeStrToAbsMinutes = (tStr, isNextDay = false) => {
  if (!tStr) return 0;
  const [h, m] = tStr.split(":").map(Number);
  return h * 60 + m + (isNextDay ? 1440 : 0);
};
// Helper: Convert absolute minutes back to "HH:mm"
const absMinutesToTimeStr = (totalMins) => {
  const norm = Math.round(totalMins) % 1440;
  const h = Math.floor(norm / 60);
  const m = Math.round(norm % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
// Calculate Gantt position based on centered time markers
const calcDynamicGanttPos = (
  startStr,
  endStr,
  shiftStartMin,
  shiftEndMin,
  hourColWidth,
) => {
  let sMin = timeStrToAbsMinutes(startStr);
  let eMin = timeStrToAbsMinutes(endStr);
  if (sMin < shiftStartMin && shiftEndMin > 1440) sMin += 1440;
  if (eMin < sMin) eMin += 1440;
  const s = Math.max(shiftStartMin, sMin);
  const e = Math.min(shiftEndMin, eMin);
  const left = hourColWidth / 2 + ((s - shiftStartMin) / 60) * hourColWidth;
  const width = Math.max(2, ((e - s) / 60) * hourColWidth);
  return { left: `${left}px`, width: `${width}px` };
};
const COMPACT_GANTT_QUERY = "(max-width: 1023px)";
const useCompactGantt = () => {
  const [isCompact, setIsCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(COMPACT_GANTT_QUERY).matches,
  );
  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_GANTT_QUERY);
    const updateLayout = (event) => setIsCompact(event.matches);
    updateLayout(mediaQuery);
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);
  return isCompact;
};

const AllocationSchedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCompactGantt = useCompactGantt();
  const [viewDate, setViewDate] = useState("02/10/2026");
  const [selectedMachineFilter, setSelectedMachineFilter] = useState("ALL");
  const [searchKey, setSearchKey] = useState("");
  const [viewMode, setViewMode] = useState("day");
  const [selectedJob, setSelectedJob] = useState(null);
  const [assignModalData, setAssignModalData] = useState(null);
  // Danh sách máy từ API
  const [machines, setMachines] = useState([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  // State cấu hình ca làm việc 
  const [shiftStartStr, setShiftStartStr] = useState("07:30");
  const [shiftEndStr, setShiftEndStr] = useState("07:30");
  const [isOvernight, setIsOvernight] = useState(true);
  // Tính toán thời điểm bắt đầu và kết thúc ca (tính theo phút)
  const shiftStartMin = useMemo(
    () => timeStrToAbsMinutes(shiftStartStr),
    [shiftStartStr],
  );
  const shiftEndMin = useMemo(() => {
    return timeStrToAbsMinutes(shiftEndStr, isOvernight);
  }, [shiftEndStr, isOvernight]);

  // Tạo động các cột thời gian
  const timeColumns = useMemo(() => {
    const cols = [];
    let curr = shiftStartMin;
    while (curr <= shiftEndMin) {
      const timeLabel = absMinutesToTimeStr(curr);
      const isLunch = curr >= 720 && curr < 780; // 12:00 - 13:00
      const isDinner = curr >= 1080 && curr < 1110; // 18:00 - 18:30
      cols.push({
        label: isLunch ? "12:00 (Nghỉ)" : isDinner ? "18:00 (Nghỉ)" : timeLabel,
        startMin: curr,
        isLunch: isLunch || isDinner,
      });
      curr += 60;
    }
    if (cols[cols.length - 1]?.startMin < shiftEndMin) {
      cols.push({
        label: absMinutesToTimeStr(shiftEndMin),
        startMin: shiftEndMin,
        isLunch: false,
      });
    }
    return cols;
  }, [shiftStartMin, shiftEndMin]);
  // Kích thước cho thanh cuộn ngang bắt buộc
  // hourColWidth là state để hỗ trợ zoom bằng Ctrl + lăn chuột
  const DEFAULT_HOUR_COL_WIDTH = isCompactGantt ? 82 : 110;
  const MIN_HOUR_COL_WIDTH = 40;
  const MAX_HOUR_COL_WIDTH = 3600; // Cho phép phóng to tối đa đến 3600px/giờ (60px/phút = xem từng 1 phút)
  const [hourColWidth, setHourColWidth] = useState(DEFAULT_HOUR_COL_WIDTH);
  const HOUR_COL_WIDTH = hourColWidth;
  const MACHINE_COL_WIDTH = isCompactGantt ? 164 : 210;
  const timelineTrackWidth =
    Math.max(0, timeColumns.length - 1) * HOUR_COL_WIDTH + HOUR_COL_WIDTH; // e.g. 23 * 110 = 2530px
  const HALF_HOUR_COL_WIDTH = HOUR_COL_WIDTH / 2;
  const totalGridWidth = MACHINE_COL_WIDTH + timelineTrackWidth; // e.g. 2740px

  // Bước thời gian hiển thị (phút) thay đổi động khi zoom
  const minuteStep = useMemo(() => {
    if (hourColWidth >= 2400) return 1; // Zoom cực lớn: xem chi tiết từng 1 phút
    if (hourColWidth >= 1200) return 2; // Zoom rất lớn: mốc 2 phút
    if (hourColWidth >= 700) return 5; // Zoom rất lớn: mốc 5 phút
    if (hourColWidth >= 400) return 10; // Zoom lớn: mốc 10 phút
    if (hourColWidth >= 300) return 15; // Zoom vừa: mốc 15 phút
    if (hourColWidth >= 220) return 30; // Zoom phóng to hơn mặc định: mốc 30 phút
    if (hourColWidth < 65) return 120; // Thu nhỏ: mốc 2 giờ
    return 60; // Mặc định khởi tạo (180px): mốc 1 giờ (07:30 | 08:30 | 09:30...)
  }, [hourColWidth]);

  // Các mốc thời gian động (Header & Đường gióng dọc) theo mức zoom
  const displayedTimeMarkers = useMemo(() => {
    const markers = [];
    let curr = shiftStartMin;
    while (curr <= shiftEndMin) {
      const isLunch =
        (curr >= 720 && curr < 780) || (curr >= 1080 && curr < 1110);
      const isHourBoundary = curr % 60 === 0;
      const isHalfHour = curr % 30 === 0 && !isHourBoundary;
      const label = absMinutesToTimeStr(curr);

      markers.push({
        startMin: curr,
        label:
          curr === 720
            ? "12:00 (Nghỉ)"
            : curr === 1080
              ? "18:00 (Nghỉ)"
              : label,
        isLunch,
        isHourBoundary,
        isHalfHour,
        leftPos:
          HALF_HOUR_COL_WIDTH + ((curr - shiftStartMin) / 60) * HOUR_COL_WIDTH,
      });
      curr += minuteStep;
    }
    return markers;
  }, [
    shiftStartMin,
    shiftEndMin,
    minuteStep,
    HALF_HOUR_COL_WIDTH,
    HOUR_COL_WIDTH,
  ]);

  // Ref cho wrapper Gantt – dùng để gắn wheel listener (Ctrl + scroll = zoom mượt)
  const ganttWrapperRef = useRef(null);
  useEffect(() => {
    const el = ganttWrapperRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault(); // Chặn zoom trang trình duyệt
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      setHourColWidth((prev) => {
        const next = Math.round(prev * zoomFactor);
        return Math.min(MAX_HOUR_COL_WIDTH, Math.max(MIN_HOUR_COL_WIDTH, next));
      });
    };
    // passive: false để có thể gọi preventDefault()
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);
  // Dynamic Gantt jobs state
  const [jobs, setJobs] = useState(INITIAL_GANTT_JOBS);
  const [draggedJobId, setDraggedJobId] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [hoveredSwapJobId, setHoveredSwapJobId] = useState(null);
  const [allocDate, setAllocDate] = useState(dayjs("2026-10-02"));
  const [allocMachine, setAllocMachine] = useState(null);
  const showBackButton = Boolean(location.state?.record);

  // State cấu hình kéo thả theo từng phút (Snap step)
  const [dragSnapStep, setDragSnapStep] = useState(1); // Mặc định kéo thả từng 1 phút
  const isSwapDragDropLocked = true;
  const [dragOverInfo, setDragOverInfo] = useState(null);
  const [resizingState, setResizingState] = useState(null);

  // Lấy danh sách máy theo convention API hiện tại của project
  const fetchMachines = useCallback(async () => {
    setMachinesLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.MACHINE.GET_ALL, {
        Page: 1,
        PageSize: 2000,
      });
      const result = response?.data ?? response;
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setMachines(items);
      setSelectedMachineFilter((current) =>
        current === "ALL" ||
        items.some((machine) => machine.machineCode === current)
          ? current
          : "ALL",
      );
      setAllocMachine((current) =>
        !current || items.some((machine) => machine.machineCode === current)
          ? current
          : null,
      );
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      message.error(
        error?.response?.data?.message || "Không thể tải danh sách máy.",
      );
      setMachines([]);
    } finally {
      setMachinesLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);
  // Filtered machines
  const filteredMachines = useMemo(() => {
    const keyword = searchKey.trim().toLowerCase();
    return machines.filter((machine) => {
      const matchSearch =
        !keyword ||
        machine.machineCode?.toLowerCase().includes(keyword) ||
        machine.machineName?.toLowerCase().includes(keyword);
      const matchGroup =
        selectedMachineFilter === "ALL" ||
        machine.machineCode === selectedMachineFilter;
      return matchSearch && matchGroup;
    });
  }, [machines, searchKey, selectedMachineFilter]);

  // Current time line indicator - tính theo pixel để đồng bộ với mốc giờ (bắt đầu từ giữa ô đầu tiên)
  const currentTimeLeft = useMemo(() => {
    const nowMin = 615; // 10:15 AM
    if (nowMin < shiftStartMin || nowMin > shiftEndMin) return null;
    return (
      HALF_HOUR_COL_WIDTH + ((nowMin - shiftStartMin) / 60) * HOUR_COL_WIDTH
    );
  }, [shiftStartMin, shiftEndMin, HALF_HOUR_COL_WIDTH, HOUR_COL_WIDTH]);

  // Helper: Tính số phút tuyệt đối chính xác từ vị trí con chuột X trên thanh timeline track
  const getMinutesFromMouseEvent = useCallback(
    (e, trackEl) => {
      const rect = trackEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const halfHourWidth = HOUR_COL_WIDTH / 2;
      const minutesFromStart = ((mouseX - halfHourWidth) / HOUR_COL_WIDTH) * 60;
      return shiftStartMin + minutesFromStart;
    },
    [shiftStartMin, HOUR_COL_WIDTH],
  );

  // Drag & Drop handlers
  const handleDragStart = (e, job) => {
    e.dataTransfer.setData("text/plain", job.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedJobId(job.id);
  };
  const handleDragEnd = () => {
    setDraggedJobId(null);
    setDragOverCell(null);
    setHoveredSwapJobId(null);
    setDragOverInfo(null);
  };

  const handleTrackDragOver = (e, machineCode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!draggedJobId) return;

    const job = jobs.find((j) => j.id === draggedJobId);
    if (!job) return;

    const rawMin = getMinutesFromMouseEvent(e, e.currentTarget);
    const durationMin =
      timeStrToAbsMinutes(job.endTime) - timeStrToAbsMinutes(job.startTime);

    let targetStartMin = Math.round(rawMin / dragSnapStep) * dragSnapStep;
    targetStartMin = Math.max(
      shiftStartMin,
      Math.min(shiftEndMin - durationMin, targetStartMin),
    );
    const targetEndMin = targetStartMin + durationMin;

    setDragOverInfo({
      machineCode,
      startMin: targetStartMin,
      endMin: targetEndMin,
      startTimeStr: absMinutesToTimeStr(targetStartMin),
      endTimeStr: absMinutesToTimeStr(targetEndMin),
      durationMin,
    });
  };

  const handleTrackDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverInfo(null);
    }
  };

  const handleTrackDrop = (e, targetMachineCode) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("text/plain") || draggedJobId;
    setDragOverInfo(null);
    setDraggedJobId(null);
    setHoveredSwapJobId(null);

    if (!jobId) return;

    // Nếu đang hover trên 1 job khác thì hoán đổi (Swap)
    if (
      !isSwapDragDropLocked &&
      hoveredSwapJobId &&
      hoveredSwapJobId !== jobId
    ) {
      const targetJob = jobs.find((j) => j.id === hoveredSwapJobId);
      if (targetJob) {
        handleDropOnJob(e, targetJob);
        return;
      }
    }

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const rawMin = getMinutesFromMouseEvent(e, e.currentTarget);
    const durationMin =
      timeStrToAbsMinutes(job.endTime) - timeStrToAbsMinutes(job.startTime);

    let newStartMin = Math.round(rawMin / dragSnapStep) * dragSnapStep;
    newStartMin = Math.max(
      shiftStartMin,
      Math.min(shiftEndMin - durationMin, newStartMin),
    );
    const newEndMin = newStartMin + durationMin;

    const newStartStr = absMinutesToTimeStr(newStartMin);
    const newEndStr = absMinutesToTimeStr(newEndMin);

    setJobs((prevJobs) =>
      prevJobs.map((item) =>
        item.id === jobId
          ? {
              ...item,
              machineCode: targetMachineCode,
              startTime: newStartStr,
              endTime: newEndStr,
            }
          : item,
      ),
    );

    message.success(
      `🎯 Đã di chuyển ${job.code} sang máy ${targetMachineCode} (${newStartStr} – ${newEndStr})`,
    );
  };

  // Resizing theo từng phút khi kéo cạnh trái / phải của job
  const handleResizeStart = (e, job, edge) => {
    e.stopPropagation();
    e.preventDefault();
    const trackEl = e.currentTarget.closest(".gantt-timeline-track");
    setResizingState({
      jobId: job.id,
      edge,
      trackEl,
    });
  };

  useEffect(() => {
    if (!resizingState) return;

    const handleMouseMove = (e) => {
      const { jobId, edge, trackEl } = resizingState;
      if (!trackEl) return;
      const rawMin = getMinutesFromMouseEvent(e, trackEl);
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      const currStart = timeStrToAbsMinutes(job.startTime);
      const currEnd = timeStrToAbsMinutes(job.endTime);

      if (edge === "start") {
        let newStart = Math.round(rawMin / dragSnapStep) * dragSnapStep;
        newStart = Math.max(shiftStartMin, Math.min(currEnd - 1, newStart));
        const newStartStr = absMinutesToTimeStr(newStart);
        if (newStartStr !== job.startTime) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId ? { ...j, startTime: newStartStr } : j,
            ),
          );
        }
      } else {
        let newEnd = Math.round(rawMin / dragSnapStep) * dragSnapStep;
        newEnd = Math.min(shiftEndMin, Math.max(currStart + 1, newEnd));
        const newEndStr = absMinutesToTimeStr(newEnd);
        if (newEndStr !== job.endTime) {
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, endTime: newEndStr } : j)),
          );
        }
      }
    };

    const handleMouseUp = () => {
      if (resizingState) {
        const job = jobs.find((j) => j.id === resizingState.jobId);
        if (job) {
          const dur =
            timeStrToAbsMinutes(job.endTime) -
            timeStrToAbsMinutes(job.startTime);
          message.info(
            `⏱️ Cập nhật thời gian ${job.code}: ${job.startTime} – ${job.endTime} (${dur} phút)`,
          );
        }
      }
      setResizingState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    resizingState,
    jobs,
    shiftStartMin,
    shiftEndMin,
    dragSnapStep,
    getMinutesFromMouseEvent,
  ]);

  const handleDragOverCell = (e, machineCode, colIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (
      !dragOverCell ||
      dragOverCell.machineCode !== machineCode ||
      dragOverCell.colIdx !== colIdx
    ) {
      setDragOverCell({ machineCode, colIdx });
    }
  };
  const handleDropOnCell = (e, targetMachineCode, targetStartMin) => {
    handleTrackDrop(e, targetMachineCode);
  };
  // Drag over target job
  const handleDragOverJob = (e, targetJob) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (isSwapDragDropLocked) return;
    if (draggedJobId && draggedJobId !== targetJob.id) {
      setHoveredSwapJobId(targetJob.id);
    }
  };
  const handleDragLeaveJob = (e) => {
    e.stopPropagation();
    setHoveredSwapJobId(null);
  };
  // Drop on target job -> SWAP
  const handleDropOnJob = (e, targetJob) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredSwapJobId(null);
    setDragOverCell(null);
    if (isSwapDragDropLocked) return;
    const sourceJobId = e.dataTransfer.getData("text/plain") || draggedJobId;
    if (!sourceJobId || sourceJobId === targetJob.id) return;
    const sourceJob = jobs.find((j) => j.id === sourceJobId);
    if (!sourceJob) return;
    setJobs((prevJobs) => {
      return prevJobs.map((item) => {
        if (item.id === sourceJob.id) {
          return {
            ...item,
            startTime: targetJob.startTime,
            endTime: targetJob.endTime,
            machineCode: targetJob.machineCode,
          };
        }
        if (item.id === targetJob.id) {
          return {
            ...item,
            startTime: sourceJob.startTime,
            endTime: sourceJob.endTime,
            machineCode: sourceJob.machineCode,
          };
        }
        return item;
      });
    });
    const sameMachine = sourceJob.machineCode === targetJob.machineCode;
    if (sameMachine) {
      message.success(
        `🔄 Đã hoán đổi vị trí cắt trên máy ${targetJob.machineCode} giữa ${sourceJob.code} và ${targetJob.code}!`,
      );
    } else {
      message.success(
        `🔄 Đã hoán đổi vị trí ca cắt giữa ${sourceJob.code} (${sourceJob.machineCode}) và ${targetJob.code} (${targetJob.machineCode})!`,
      );
    }
  };
  const handleAssignClick = (machineCode, slotTimeRange) => {
    setAssignModalData({ machineCode, slotTimeRange });
  };
  const handleSaveAllocation = () => {
    if (!allocMachine) return;
    message.success(
      `Đã lưu phân bổ máy ${allocMachine} cho ngày ${allocDate?.format("DD/MM/YYYY")}`,
    );
  };
  return (
    <PageContainer
      className="nesting-page"
      title="Lịch phân bổ máy"
      searchPlaceholder="Tìm kiếm máy, mã LSX, file cắt..."
      searchValue={searchKey}
      onSearch={setSearchKey}
      actionButtons={[
        <Space
          key="machine-filter"
          size={6}
          className="machine-header-filter gantt-machine-filter"
        >
          <Text style={{ fontSize: 13, fontWeight: 500 }}>Nhóm máy:</Text>
          <Select
            value={selectedMachineFilter}
            loading={machinesLoading}
            onChange={setSelectedMachineFilter}
            style={{ width: 170 }}
            options={[
              { label: `Tất cả • ${machines.length} máy`, value: "ALL" },
              ...machines.map((machine) => ({
                label: `${machine.machineCode} - ${machine.machineName}`,
                value: machine.machineCode,
              })),
            ]}
          />
        </Space>,
        <Space
          key="date-filter"
          size={6}
          className="machine-header-filter gantt-date-filter"
        >
          <Text style={{ fontSize: 13, fontWeight: 500 }}>Ngày xem:</Text>
          <DatePicker
            defaultValue={dayjs("2026-10-02")}
            format="DD/MM/YYYY"
            style={{ width: 135 }}
            onChange={(d, s) => setViewDate(s)}
          />
        </Space>,
        showBackButton && (
          <Button
            key="back-lsx"
            className="gantt-header-action gantt-back-action"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(MAIN_ROUTES.NESTING_PRODUCTION_ORDERS)}
          >
            Quay lại
          </Button>
        ),
      ]}
      hideScroll={true}
    >
      <div className="nesting-gantt-page">
        {/* Context LSX Bar */}
        <Card
          size="small"
          className="gantt-top-allocation-banner"
          style={{ marginBottom: 12 }}
        >
          <div className="gantt-context-summary">
            <Space size={12} wrap>
              <Tag
                color="blue"
                className="gantt-context-job"
                style={{ fontSize: 13, padding: "4px 10px", margin: 0 }}
              >
                <strong>THANG.M1/14</strong> Hộp buồng thang máy gia đình
                <span style={{ opacity: 0.85, marginLeft: 6 }}>
                  (File: THANG-M1-SUS-1.2 • SUS304 1.2mm • SL: 80 tấm)
                </span>
              </Tag>
            </Space>
            <Tag
              color="green"
              className="gantt-context-duration"
              style={{ fontSize: 13, padding: "4px 10px", margin: 0 }}
            >
              Thời gian cắt: <strong>240 phút (4.0h)</strong>
            </Tag>
          </div>
          <Row
            className="gantt-allocation-fields"
            gutter={[16, 12]}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Col xs={24} sm={10} md={6}>
              <div className="gantt-allocation-field">
                <div className="gantt-field-label">
                  <CalendarOutlined />
                  <Text strong style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    Chọn ngày:
                  </Text>
                </div>
                <DatePicker
                  value={allocDate}
                  onChange={(d) => setAllocDate(d)}
                  format="DD/MM/YYYY"
                  style={{ width: "100%" }}
                />
              </div>
            </Col>
            <Col xs={24} sm={8} md={10}>
              <div className="gantt-allocation-field">
                <div className="gantt-field-label">
                  <AppstoreAddOutlined />
                  <Text strong style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                    Chọn máy:
                  </Text>
                </div>
                <Select
                  value={allocMachine}
                  loading={machinesLoading}
                  onChange={(val) => setAllocMachine(val)}
                  placeholder="--- Vui lòng chọn máy cắt laser (Bắt buộc) ---"
                  style={{ width: "100%" }}
                  options={machines.map((machine) => ({
                    label: `${machine.machineCode} (${machine.machineName}${
                      machine.powerKw != null ? ` • ${machine.powerKw}KW` : ""
                    }) - ${machine.statusName ?? ""}`,
                    value: machine.machineCode,
                  }))}
                />
                {allocMachine && (
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSaveAllocation}
                    className="gantt-save-allocation-btn"
                  >
                    Lưu phân bổ
                  </Button>
                )}
              </div>
            </Col>
          </Row>
          <div
            className="gantt-legend-and-view"
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px dashed #e2e8f0",
            }}
          >
            <Space size={16} className="gantt-legend-group">
              <span className="legend-item">
                <span className="dot dot-green" /> Đã làm
              </span>
              <span className="legend-item">
                <span className="dot dot-cyan" /> Đang chạy
              </span>
              <span className="legend-item">
                <span className="dot dot-blue" /> Đã xếp
              </span>
              <span className="legend-item">
                <span className="dot dot-orange" /> Dừng
              </span>
              <span className="legend-item">
                <span className="dot dot-gray" /> Còn trống
              </span>
            </Space>
             <div className="gantt-stat-bar">
          <span className="stat-pill pill-gray">
            Đang xem: <strong>{filteredMachines.length} Máy</strong>
          </span>
          {/* <span className="stat-pill pill-cyan">
            Khung giờ ca:{" "}
            <strong>
              {shiftStartStr} - {shiftEndStr}
            </strong>
          </span> */}
          <span className="stat-pill pill-cyan" style={{ gap: 4 }}>
            Bước kéo (Snap):
            <Select
              size="small"
              value={dragSnapStep}
              onChange={setDragSnapStep}
              variant="borderless"
              style={{ width: 85, fontWeight: 700 }}
              options={[
                { label: "1 phút", value: 1 },
                { label: "5 phút", value: 5 },
                { label: "10 phút", value: 10 },
                { label: "15 phút", value: 15 },
                { label: "30 phút", value: 30 },
              ]}
            />
          </span>
          <span className="stat-pill pill-blue">
            Máy còn chỗ: <strong>14</strong>
          </span>
          <span className="stat-pill pill-green">
            Đang chạy: <strong>9 máy</strong>
          </span>
          <Button
            size="small"
            icon={<RetweetOutlined />}
            onClick={() => setHourColWidth(DEFAULT_HOUR_COL_WIDTH)}
            title="Đưa Zoom về mặc định"
          >
            về giữa
          </Button>
        </div>
          </div>
        </Card>
       
        {/* Main Gantt Map Table with Mandatory 2D  (Vertical + Horizontal Scroll) */}
        <div className="gantt-chart-wrapper" ref={ganttWrapperRef}>
          <div
            className="gantt-grid-inner"
            style={{
              minWidth: "100%",
              width: `${totalGridWidth}px`,
            }}
          >
            <div
              className="gantt-header-row"
              style={{
                minWidth: "100%",
                width: `${totalGridWidth}px`,
              }}
            >
              <div className="gantt-machine-col-header">MÁY / HIỆU SUẤT</div>
              <div
                className="gantt-timeline-header-grid"
                style={{
                  minWidth: `${timelineTrackWidth}px`,
                  width: "100%",
                  flex: 1,
                  position: "relative",
                }}
              >
                {displayedTimeMarkers.map((col, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className="gantt-header-guide-line"
                      style={{
                        position: "absolute",
                        left: `${col.leftPos}px`,
                        top: 0,
                        bottom: 0,
                        width: 0,
                        borderLeft: "1px solid #cbd5e1",
                      }}
                    />
                    <div
                      className={`gantt-time-marker-header ${
                        col.isLunch ? "lunch-cell" : ""
                      } ${!col.isHourBoundary ? "sub-marker" : ""}`}
                      style={{
                        position: "absolute",
                        left: `${col.leftPos}px`,
                        width: `${HOUR_COL_WIDTH}px`,
                        transform: "translateX(-50%)",
                        fontSize: col.isHourBoundary ? "12px" : "11px",
                        fontWeight: col.isHourBoundary ? 700 : 500,
                        color: "#000000",
                        opacity: 1,
                      }}
                    >
                      {col.label}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            {/* Các dòng máy trong phần thân */}
            <div className="gantt-body-container">
              {filteredMachines.map((m) => {
                const machineJobs = jobs.filter(
                  (j) => j.machineCode === m.machineCode,
                );
                const isRowHovered =
                  dragOverCell?.machineCode === m.machineCode ||
                  dragOverInfo?.machineCode === m.machineCode;
                return (
                  <div
                    className={`gantt-machine-row ${isRowHovered ? "drag-over-row" : ""}`}
                    key={m.machineId}
                    style={{
                      minWidth: "100%",
                      width: `${totalGridWidth}px`,
                    }}
                  >
                    {/* Frozen Left Machine Info Column */}
                    <div className="gantt-machine-info">
                      <div className="machine-code-title">{m.machineCode}</div>
                      <div className="machine-sub-info">
                        <span>
                          {m.machineName}
                          {m.powerKw != null ? ` • ${m.powerKw}KW` : ""}
                        </span>
                        <span
                          className={`capacity-tag ${m.status === 0 ? "tag-green" : "tag-red"}`}
                        >
                          {m.statusName ??
                            (m.status === 0 ? "Active" : "Không hoạt động")}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`gantt-timeline-track ${draggedJobId ? "drag-active" : ""}`}
                      style={{
                        minWidth: `${timelineTrackWidth}px`,
                        width: "100%",
                        flex: 1,
                      }}
                      onDragOver={(e) => handleTrackDragOver(e, m.machineCode)}
                      onDragLeave={handleTrackDragLeave}
                      onDrop={(e) => handleTrackDrop(e, m.machineCode)}
                    >
                      {/* Đường gióng dọc đồng nhất giữa tất cả mốc thời gian */}
                      <div className="gantt-time-guides" aria-hidden="true">
                        {displayedTimeMarkers.map((col, colIdx) => (
                          <span
                            key={`guide-${colIdx}`}
                            className="gantt-time-guide"
                            style={{
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              left: `${col.leftPos}px`,
                              width: 0,
                              borderLeft: "1px solid #cbd5e1",
                              opacity: 1,
                            }}
                          />
                        ))}
                      </div>
                      {/* Các cột lưới giờ nền */}
                      <div
                        className="gantt-grid-columns"
                        style={{
                          minWidth: `${timelineTrackWidth}px`,
                          width: "100%",
                          flex: 1,
                        }}
                      >
                        {timeColumns.map((col, colIdx) => {
                          const isCellHovered =
                            dragOverCell?.machineCode === m.machineCode &&
                            dragOverCell?.colIdx === colIdx;
                          return (
                            <div
                              key={colIdx}
                              className={`gantt-grid-cell ${col.isLunch ? "lunch-cell" : ""} ${isCellHovered ? "cell-drag-over" : ""}`}
                              style={{
                                width: `${HOUR_COL_WIDTH}px`,
                                minWidth: `${HOUR_COL_WIDTH}px`,
                                flex: 1,
                              }}
                            >
                              {col.isLunch && (
                                <span className="lunch-text">Nghỉ!</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Đường dọc đỏ chỉ báo thời gian hiện tại */}
                      {currentTimeLeft !== null && (
                        <div
                          className="gantt-current-time-line"
                          style={{ left: `${currentTimeLeft}px` }}
                        >
                          <span className="time-marker-dot" />
                        </div>
                      )}
                      {/* Khung xem trước vị trí thả (Preview Drop Indicator theo từng phút) */}
                      {dragOverInfo && dragOverInfo.machineCode === m.machineCode && (
                        (() => {
                          const previewPos = calcDynamicGanttPos(
                            dragOverInfo.startTimeStr,
                            dragOverInfo.endTimeStr,
                            shiftStartMin,
                            shiftEndMin,
                            HOUR_COL_WIDTH,
                          );
                          return (
                            <div
                              className="gantt-drop-preview"
                              style={{
                                left: previewPos.left,
                                width: previewPos.width,
                              }}
                            >
                              <span className="preview-time-badge">
                                🎯 {dragOverInfo.startTimeStr} – {dragOverInfo.endTimeStr} ({dragOverInfo.durationMin} phút)
                              </span>
                            </div>
                          );
                        })()
                      )}
                      {/* Các khối công việc có thể kéo, resize và hoán đổi */}
                      {machineJobs.map((job) => {
                        const pos = calcDynamicGanttPos(
                          job.startTime,
                          job.endTime,
                          shiftStartMin,
                          shiftEndMin,
                          HOUR_COL_WIDTH,
                        );
                        const isDraggingThis = draggedJobId === job.id;
                        const isSwapTarget = hoveredSwapJobId === job.id;
                        return (
                          <Tooltip
                            key={job.id}
                            title={
                              <div>
                                <div>
                                  <strong>{job.code}</strong> - {job.orderName}
                                </div>
                                <div>File: {job.fileCode}</div>
                                <div>Vật liệu: {job.material}</div>
                                <div>
                                  Thời gian: {job.startTime} - {job.endTime}
                                </div>
                                <div>Người vận hành: {job.operator}</div>
                              </div>
                            }
                          >
                            <div
                              draggable={!resizingState}
                              onDragStart={(e) => handleDragStart(e, job)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleDragOverJob(e, job)}
                              onDragLeave={handleDragLeaveJob}
                              onDrop={(e) => handleDropOnJob(e, job)}
                              className={`gantt-job-block status-${job.status} ${isDraggingThis ? "dragging-source" : ""} ${isSwapTarget ? "swap-target-active" : ""}`}
                              style={{ left: pos.left, width: pos.width }}
                              onClick={() => setSelectedJob(job)}
                            >
                              {/* Handle kéo dãn / thu ngắn giờ bắt đầu (từng phút) */}
                              <div
                                className="resize-handle handle-left"
                                onMouseDown={(e) => handleResizeStart(e, job, "start")}
                                title="Kéo để chỉnh giờ bắt đầu (từng phút)"
                              />
                              <div className="job-code">
                                <span>{job.code}</span>
                                <Space size={2}>
                                  {isSwapTarget ? (
                                    <SwapOutlined />
                                  ) : (
                                    <DragOutlined className="drag-icon" />
                                  )}
                                </Space>
                              </div>
                              <div className="job-time">
                                {job.startTime}–{job.endTime}
                              </div>
                              {/* Handle kéo dãn / thu ngắn giờ kết thúc (từng phút) */}
                              <div
                                className="resize-handle handle-right"
                                onMouseDown={(e) => handleResizeStart(e, job, "end")}
                                title="Kéo để chỉnh giờ kết thúc (từng phút)"
                              />
                            </div>
                          </Tooltip>
                        );
                      })}
                      {/* Các khe trống (+ nút Giao việc) */}
                      {/* {m.machineCode === "KQ012" &&
                        (() => {
                          const slotStart = "14:30";
                          const slotEnd = "17:00";
                          const slotPos = calcDynamicGanttPos(
                            slotStart,
                            slotEnd,
                            shiftStartMin,
                            shiftEndMin,
                            HOUR_COL_WIDTH,
                          );
                          return (
                            <button
                              className="gantt-assign-btn"
                              style={{
                                left: slotPos.left,
                                width: slotPos.width,
                              }}
                              onClick={() =>
                                handleAssignClick(
                                  m.machineCode,
                                  `${slotStart}–${slotEnd}`,
                                )
                              }
                            >
                              + Giao việc{" "}
                              <span className="slot-time">
                                ({slotStart}–{slotEnd})
                              </span>
                            </button>
                          );
                        })()} */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Modal chi tiết công việc */}
        <Modal
          open={!!selectedJob}
          onCancel={() => setSelectedJob(null)}
          title={`Chi tiết nhiệm vụ: ${selectedJob?.code}`}
          footer={[
            <Button key="close" onClick={() => setSelectedJob(null)}>
              Đóng
            </Button>,
            // <Button key="start" type="primary">
            //   Cập nhật tiến độ
            // </Button>,
          ]}
        >
          {selectedJob && (
            <div style={{ lineHeight: 1.8 }}>
              <p>
                <strong>Mã LSX:</strong> {selectedJob.code}
              </p>
              <p>
                <strong>Tên đơn hàng:</strong> {selectedJob.orderName}
              </p>
              <p>
                <strong>Mã file cắt:</strong> {selectedJob.fileCode}
              </p>
              <p>
                <strong>Vật liệu:</strong> {selectedJob.material}
              </p>
              <p>
                <strong>Khung giờ phân bổ:</strong> {selectedJob.startTime} -{" "}
                {selectedJob.endTime}
              </p>
              <p>
                <strong>Máy thực hiện:</strong> {selectedJob.machineCode}
              </p>
              <p>
                <strong>Người vận hành:</strong> {selectedJob.operator}
              </p>
              <p>
                <strong>Trạng thái: </strong>
                {selectedJob.status === "completed" && (
                  <Tag color="green">Đã làm</Tag>
                )}
                {selectedJob.status === "running" && (
                  <Tag color="cyan">Đang chạy</Tag>
                )}
                {selectedJob.status === "scheduled" && (
                  <Tag color="blue">Đã xếp</Tag>
                )}
                {selectedJob.status === "paused" && (
                  <Tag color="orange">Dừng / bảo trì</Tag>
                )}
              </p>
            </div>
          )}
        </Modal>
        {/* Modal phân công công việc */}
        <Modal
          open={!!assignModalData}
          onCancel={() => setAssignModalData(null)}
          title={`Phân bổ ca cắt cho máy ${assignModalData?.machineCode}`}
          onOk={() => {
            message.success(
              `Đã xếp lịch thành công cho máy ${assignModalData?.machineCode}!`,
            );
            setAssignModalData(null);
          }}
        >
          {assignModalData && (
            <div>
              <p>
                <strong>Khung giờ còn trống:</strong>{" "}
                {assignModalData.slotTimeRange}
              </p>
              <p>
                <strong>Chọn file cắt xếp vào:</strong>
              </p>
              <Select
                defaultValue="THANG.M1/14"
                style={{ width: "100%" }}
                options={[
                  {
                    label:
                      "THANG.M1/14 - Hộp buồng thang máy gia đình (240 phút)",
                    value: "THANG.M1/14",
                  },
                  {
                    label: "DONG.CO/08 - Đế gá động cơ điện 75kW (180 phút)",
                    value: "DONG.CO/08",
                  },
                  {
                    label:
                      "CHUNG.CC/09 - Vách CNC trang trí Landmark (360 phút)",
                    value: "CHUNG.CC/09",
                  },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </PageContainer>
  );
};
export default AllocationSchedule;
