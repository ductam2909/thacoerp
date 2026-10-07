import React, { useMemo, useState } from "react";
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  DashboardOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Column } from "@ant-design/plots";
import dayjs from "dayjs";
import colors from "../../assets/scss/variables.scss";

const { Text } = Typography;

const reportDates = ["28/09", "29/09", "30/09", "01/10", "02/10"];

const machines = [
  {
    machineId: 1,
    stt: 1,
    name: "Laser Mitsubishi ML3015",
    code: "MV3015_1_3KW",
    power: "3KW",
    shift1Time: 480,
    shift2Time: 210,
    shift3Time: 420,
    isExtra: false,
    totalStandardTime: 1110,
    dailyData: {
      "28/09": { gv: 420, thgv: 420, thtt: 365, hsgv: 100, hstt: 87 },
      "29/09": { gv: 480, thgv: 460, thtt: 390, hsgv: 96, hstt: 81 },
      "30/09": { gv: 520, thgv: 510, thtt: 420, hsgv: 98, hstt: 81 },
      "01/10": { gv: 460, thgv: 450, thtt: 315, hsgv: 98, hstt: 68 },
      "02/10": { gv: 560, thgv: 530, thtt: 455, hsgv: 95, hstt: 81 },
    },
  },
  {
    machineId: 2,
    stt: 2,
    name: "Laser Bodor P4020",
    code: "BD4020_2_6KW",
    power: "6KW",
    shift1Time: 480,
    shift2Time: 180,
    shift3Time: 360,
    isExtra: false,
    totalStandardTime: 1020,
    dailyData: {
      "28/09": { gv: 390, thgv: 380, thtt: 330, hsgv: 97, hstt: 85 },
      "29/09": { gv: 520, thgv: 510, thtt: 470, hsgv: 98, hstt: 90 },
      "30/09": { gv: 610, thgv: 595, thtt: 510, hsgv: 98, hstt: 84 },
      "01/10": { gv: 480, thgv: 450, thtt: 260, hsgv: 94, hstt: 54 },
      "02/10": { gv: 650, thgv: 620, thtt: 545, hsgv: 95, hstt: 84 },
    },
  },
  {
    machineId: 3,
    stt: 3,
    name: "Laser Han's G3015",
    code: "HG3015_3_12KW",
    power: "12KW",
    shift1Time: 480,
    shift2Time: 210,
    shift3Time: 450,
    isExtra: true,
    totalStandardTime: 1140,
    dailyData: {
      "28/09": { gv: 360, thgv: 350, thtt: 255, hsgv: 97, hstt: 71 },
      "29/09": { gv: 430, thgv: 420, thtt: 310, hsgv: 98, hstt: 72 },
      "30/09": { gv: 500, thgv: 485, thtt: 390, hsgv: 97, hstt: 78 },
      "01/10": { gv: 620, thgv: 590, thtt: 530, hsgv: 95, hstt: 85 },
      "02/10": { gv: 710, thgv: 690, thtt: 610, hsgv: 97, hstt: 86 },
    },
  },
  {
    machineId: 4,
    stt: 4,
    name: "Laser Amada Ensis",
    code: "AM3015_4_3KW",
    power: "3KW",
    shift1Time: 450,
    shift2Time: 180,
    shift3Time: 0,
    isExtra: false,
    totalStandardTime: 630,
    dailyData: {
      "28/09": { gv: 300, thgv: 280, thtt: 185, hsgv: 93, hstt: 62 },
      "29/09": { gv: 340, thgv: 320, thtt: 245, hsgv: 94, hstt: 72 },
      "30/09": { gv: 0, thgv: 0, thtt: 0, hsgv: 0, hstt: 0 },
      "01/10": { gv: 410, thgv: 380, thtt: 295, hsgv: 93, hstt: 72 },
      "02/10": { gv: 450, thgv: 430, thtt: 360, hsgv: 96, hstt: 80 },
    },
  },
  {
    machineId: 5,
    stt: 5,
    name: "Laser Bystronic Fiber",
    code: "BY4020_5_6KW",
    power: "6KW",
    shift1Time: 480,
    shift2Time: 210,
    shift3Time: 420,
    isExtra: true,
    totalStandardTime: 1110,
    dailyData: {
      "28/09": { gv: 520, thgv: 500, thtt: 420, hsgv: 96, hstt: 81 },
      "29/09": { gv: 580, thgv: 560, thtt: 500, hsgv: 97, hstt: 86 },
      "30/09": { gv: 640, thgv: 625, thtt: 590, hsgv: 98, hstt: 92 },
      "01/10": { gv: 600, thgv: 570, thtt: 440, hsgv: 95, hstt: 73 },
      "02/10": { gv: 720, thgv: 700, thtt: 650, hsgv: 97, hstt: 90 },
    },
  },
];

const getEfficiencyClass = (value) => {
  if (!value || value < 26) return "dashboard-efficiency-badge is-danger";
  if (value < 70) return "dashboard-efficiency-badge is-warning";
  return "dashboard-efficiency-badge is-success";
};

const buildChartData = (machine) =>
  reportDates.flatMap((date) => {
    const day = machine.dailyData[date] || {};

    return [
      {
        date,
        type: "Thời gian GV",
        value: day.gv || 0,
        chart: "time",
      },
      {
        date,
        type: "Thời gian thực tế",
        value: day.thtt || 0,
        chart: "time",
      },
      {
        date,
        type: "HS giao việc",
        value: day.hsgv || 0,
        chart: "performance",
      },
      {
        date,
        type: "HS thực tế",
        value: day.hstt || 0,
        chart: "performance",
      },
    ];
  });

const Dashboard = () => {
  const [selectedMachineCode, setSelectedMachineCode] = useState(
    machines[0].code,
  );
  const [powerFilter, setPowerFilter] = useState("ALL");
  const [selectedReportDate, setSelectedReportDate] = useState(
    dayjs("2026-10-02"),
  );

  const selectedMachine = useMemo(
    () =>
      machines.find((machine) => machine.code === selectedMachineCode) ||
      machines[0],
    [selectedMachineCode],
  );

  const filteredMachines = useMemo(() => {
    if (powerFilter === "ALL") return machines;
    return machines.filter((machine) => machine.power === powerFilter);
  }, [powerFilter]);

  const chartData = useMemo(
    () => buildChartData(selectedMachine),
    [selectedMachine],
  );
  const todayData = selectedMachine.dailyData["02/10"] || {};
  const fullHoursCount = machines.filter(
    (machine) => (machine.dailyData["02/10"]?.hsgv || 0) >= 95,
  ).length;
  const lackHoursCount = machines.length - fullHoursCount;

  const kpiCards = [
    {
      title: "Tổng số máy",
      value: machines.length,
      suffix: "",
      helper: "Máy cắt Laser",
      color: colors.colorPrimary500,
      icon: <DashboardOutlined />,
    },
    {
      title: "Tổng HS thực hiện GV",
      value: todayData.hsgv || 0,
      suffix: "%",
      helper: "Theo kế hoạch ngày",
      color: colors.colorSuccess500,
      icon: <BarChartOutlined />,
    },
    {
      title: "Tổng HS thực tế",
      value: todayData.hstt || 0,
      suffix: "%",
      helper: "Hiệu suất thực hiện",
      color: colors.colorInfo500,
      icon: <BarChartOutlined />,
    },
    {
      title: "Giao việc đủ giờ",
      value: `${fullHoursCount} (${Math.round((fullHoursCount / machines.length) * 100)}%)`,
      helper: "Đủ định mức ca",
      color: colors.colorWarning500,
      icon: <DashboardOutlined />,
    },
    {
      title: "Chưa đủ giờ",
      value: `${lackHoursCount} (${Math.round((lackHoursCount / machines.length) * 100)}%)`,
      helper: "Cần bổ sung kế hoạch",
      color: colors.colorDanger500,
      icon: <DashboardOutlined />,
    },
  ];

  const chartConfig = {
    xField: "date",
    yField: "value",
    colorField: "type",
    group: true,
    height: 190,
    legend: {
      color: {
        position: "bottom",
        layout: { justifyContent: "center" },
      },
    },
    axis: {
      y: { grid: true },
    },
    style: {
      radiusTopLeft: 3,
      radiusTopRight: 3,
    },
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      width: 54,
      fixed: "left",
      align: "center",
    },
    {
      title: "Tên máy",
      dataIndex: "name",
      width: 190,
      fixed: "left",
      ellipsis: true,
      render: (text, record) => (
        <button
          type="button"
          className="dashboard-machine-button"
          onClick={() => setSelectedMachineCode(record.code)}
        >
          {text}
        </button>
      ),
    },
    {
      title: "Mã máy GV",
      dataIndex: "code",
      width: 140,
      fixed: "left",
      render: (code) => (
        <button
          type="button"
          className="dashboard-machine-code"
          onClick={() => setSelectedMachineCode(code)}
        >
          {code}
        </button>
      ),
    },
    {
      title: "Công suất",
      dataIndex: "power",
      width: 90,
      align: "center",
      render: (power) => {
        const color =
          power === "12KW" ? "magenta" : power === "6KW" ? "blue" : "cyan";
        return <Tag color={color}>{power}</Tag>;
      },
    },
    {
      title: "T.Gian chuẩn (phút)",
      children: [
        {
          title: "7:30 - 16:30",
          dataIndex: "shift1Time",
          width: 96,
          align: "center",
        },
        {
          title: "17:15 - 20:45",
          dataIndex: "shift2Time",
          width: 100,
          align: "center",
        },
        {
          title: "20:45 - 5:30",
          dataIndex: "shift3Time",
          width: 100,
          align: "center",
          render: (value) => value || "",
        },
      ],
    },
    {
      title: "Máy phát sinh",
      dataIndex: "isExtra",
      width: 94,
      align: "center",
      render: (isExtra) =>
        isExtra ? <span className="dashboard-extra-mark">x</span> : "",
    },
    {
      title: "Tổng TG chuẩn",
      dataIndex: "totalStandardTime",
      width: 110,
      align: "center",
      render: (value) => <Text strong>{value}</Text>,
    },
    ...reportDates.map((date) => ({
      title: (
        <div className="dashboard-date-title">
          <span>{date}</span>
          {date === "02/10" && <span>Hôm nay</span>}
        </div>
      ),
      children: [
        {
          title: "GV",
          width: 64,
          align: "center",
          render: (_, record) => record.dailyData[date]?.gv || 0,
        },
        {
          title: "THGV",
          width: 68,
          align: "center",
          render: (_, record) => record.dailyData[date]?.thgv || 0,
        },
        {
          title: "THTT",
          width: 68,
          align: "center",
          render: (_, record) => record.dailyData[date]?.thtt || 0,
        },
        {
          title: "HSGV",
          width: 74,
          align: "center",
          render: (_, record) => {
            const value = record.dailyData[date]?.hsgv || 0;
            return <span className={getEfficiencyClass(value)}>{value}%</span>;
          },
        },
        {
          title: "HSTT",
          width: 74,
          align: "center",
          render: (_, record) => {
            const value = record.dailyData[date]?.hstt || 0;
            return <span className={getEfficiencyClass(value)}>{value}%</span>;
          },
        },
      ],
    })),
  ];

  return (
    <div className="dashboard-page">
      <Row gutter={[12, 12]} className="dashboard-kpi-row">
        {kpiCards.map((item) => (
          <Col
            key={item.title}
            xs={24}
            sm={12}
            md={8}
            lg={6}
            className="dashboard-kpi-col"
          >
            <Card
              className="dashboard-summary-card"
              style={{ "--dashboard-accent": item.color }}
            >
              <div className="dashboard-summary-icon">{item.icon}</div>
              <div className="dashboard-summary-content">
                <Text>{item.title}</Text>
                <Statistic value={item.value} suffix={item.suffix} />
                <Text type="secondary">{item.helper}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[12, 12]} className="dashboard-report-row">
        <Col xs={24} lg={7} xl={6}>
          <Card
            className="dashboard-panel dashboard-filter-panel"
            title={
              <span className="dashboard-panel-title">
                <FilterOutlined />
                Bộ lọc báo cáo
              </span>
            }
          >
            <div className="dashboard-filter-field">
              <Text>Chọn máy báo cáo</Text>
              <Select
                value={selectedMachineCode}
                onChange={setSelectedMachineCode}
                options={machines.map((machine) => ({
                  label: `${machine.name} (${machine.power})`,
                  value: machine.code,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </div>

            <div className="dashboard-filter-field">
              <Text>Khoảng ngày</Text>
              <DatePicker
                value={selectedReportDate}
                onChange={(value) => value && setSelectedReportDate(value)}
                format="DD/MM/YYYY"
              />
            </div>

            <div className="dashboard-filter-field">
              <Text>Công suất</Text>
              <Select
                value={powerFilter}
                onChange={setPowerFilter}
                options={[
                  { label: "Tất cả công suất", value: "ALL" },
                  { label: "3KW", value: "3KW" },
                  { label: "6KW", value: "6KW" },
                  { label: "12KW", value: "12KW" },
                ]}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={17} xl={18}>
          <Row gutter={[12, 12]}>
            <Col xs={24} xl={12}>
              <Card
                className="dashboard-panel dashboard-chart-card"
                title={
                  <span className="dashboard-panel-title">
                    <BarChartOutlined />
                    TG giao việc vs TG thực tế (phút)
                  </span>
                }
                extra={<Text type="secondary">28/09 - 02/10</Text>}
              >
                <Column
                  {...chartConfig}
                  data={chartData.filter((item) => item.chart === "time")}
                />
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                className="dashboard-panel dashboard-chart-card"
                title={
                  <span className="dashboard-panel-title">
                    <BarChartOutlined />
                    Hiệu suất GV vs HS thực tế (%)
                  </span>
                }
                extra={<Text type="secondary">28/09 - 02/10</Text>}
              >
                <Column
                  {...chartConfig}
                  data={chartData.filter(
                    (item) => item.chart === "performance",
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* <Card
        className="dashboard-panel dashboard-table-card"
        title="Bảng theo dõi giao việc và hiệu suất máy Laser"
        extra={
          <Text type="secondary">
            Tổng cộng: <Text strong>{filteredMachines.length} máy</Text> | Đơn
            vị tính: Phút / %
          </Text>
        }
      >
        <Table
          className="dashboard-tracking-table"
          columns={columns}
          dataSource={filteredMachines}
          rowKey="machineId"
          size="small"
          pagination={false}
          scroll={{ x: 2300, y: 430 }}
          bordered
          rowClassName={(record) =>
            record.code === selectedMachineCode ? "dashboard-selected-row" : ""
          }
        />
      </Card> */}
    </div>
  );
};

export default Dashboard;
