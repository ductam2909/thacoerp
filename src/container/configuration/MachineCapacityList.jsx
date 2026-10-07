import React, { useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tooltip,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import PageContainer from "../../components/core/common/PageContainer";
import Modal from "../../components/core/common/Modal";
import ModalConfirm from "../../components/core/common/ModalConfirm";

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "Đang áp dụng", label: "Đang áp dụng" },
  { value: "Ngừng áp dụng", label: "Ngừng áp dụng" },
];

const gasOptions = [
  { value: "O2", label: "O2" },
  { value: "N2", label: "N2" },
  { value: "Air", label: "Air" },
];

const initialMachineCapacities = [
  {
    id: 1,
    capacityCode: "3KW",
    laserSourceName: "Nguồn Laser Fiber 3000W Standard",
    description: "Chuyên cắt tôn mỏng 0.8 - 3.0mm, tối ưu chi phí gia công",
    ratedCapacity: "3 kW (3000W)",
    manufacturer: "Raycus Laser",
    maxCuttingThickness: {
      carbonSteel: 16,
      stainlessSteel: 6,
      aluminum: 6,
    },
    supportedGases: ["O2", "N2", "Air"],
    ratedSpeed: 18,
    appliedMachines: 3,
    status: "Đang áp dụng",
  },
  {
    id: 2,
    capacityCode: "6KW",
    laserSourceName: "Nguồn Laser Fiber 6000W High-Power",
    description: "Dải công suất chủ lực cho thép tấm vừa và dày",
    ratedCapacity: "6 kW (6000W)",
    manufacturer: "IPG Photonics",
    maxCuttingThickness: {
      carbonSteel: 25,
      stainlessSteel: 16,
      aluminum: 14,
    },
    supportedGases: ["O2", "N2", "Air"],
    ratedSpeed: 28,
    appliedMachines: 8,
    status: "Đang áp dụng",
  },
  {
    id: 3,
    capacityCode: "12KW",
    laserSourceName: "Nguồn Laser Fiber 12000W Ultra",
    description: "Phù hợp đơn hàng vật liệu dày, yêu cầu tốc độ cao",
    ratedCapacity: "12 kW (12000W)",
    manufacturer: "Trumpf",
    maxCuttingThickness: {
      carbonSteel: 35,
      stainlessSteel: 25,
      aluminum: 22,
    },
    supportedGases: ["O2", "N2"],
    ratedSpeed: 42,
    appliedMachines: 3,
    status: "Đang áp dụng",
  },
];

const MachineCapacityList = () => {
  const [machineCapacities, setMachineCapacities] = useState(
    initialMachineCapacities,
  );
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [form] = Form.useForm();

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return machineCapacities.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [item.capacityCode, item.laserSourceName, item.manufacturer].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(normalizedKeyword),
        );
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [keyword, machineCapacities, statusFilter]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      carbonSteel: record.maxCuttingThickness.carbonSteel,
      stainlessSteel: record.maxCuttingThickness.stainlessSteel,
      aluminum: record.maxCuttingThickness.aluminum,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const normalizeValues = (values) => {
    const { carbonSteel, stainlessSteel, aluminum, ...restValues } = values;

    return {
      ...restValues,
      maxCuttingThickness: {
        carbonSteel,
        stainlessSteel,
        aluminum,
      },
    };
  };

  const handleSubmit = (values) => {
    const normalizedValues = normalizeValues(values);

    if (editingRecord) {
      setMachineCapacities((prevData) =>
        prevData.map((item) =>
          item.id === editingRecord.id
            ? { ...item, ...normalizedValues }
            : item,
        ),
      );
    } else {
      setMachineCapacities((prevData) => [
        ...prevData,
        {
          id: Math.max(0, ...prevData.map((item) => item.id)) + 1,
          ...normalizedValues,
        },
      ]);
    }

    handleCloseForm();
  };

  const handleConfirmDelete = () => {
    if (!deleteRecord) return;

    setMachineCapacities((prevData) =>
      prevData.filter((item) => item.id !== deleteRecord.id),
    );
    setDeleteRecord(null);
  };

  const columns = [
    {
      title: "Stt",
      dataIndex: "id",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <span className="machine-capacity-text machine-capacity-index">
          {index + 1}
        </span>
      ),
    },
    {
      title: "Mã công suất",
      dataIndex: "capacityCode",
      width: 150,
      align: "center",
      render: (value) => (
        <span className={`machine-capacity-code machine-capacity-${value}`}>
          {value}
        </span>
      ),
    },
    {
      title: "Tên nguồn phát laser",
      dataIndex: "laserSourceName",
      width: 270,
      render: (value, record) => (
        <span className="machine-capacity-info">
          <span className="machine-capacity-name">{value}</span>
          <span className="machine-capacity-description">
            {record.description}
          </span>
        </span>
      ),
    },
    {
      title: "Công suất định mức",
      dataIndex: "ratedCapacity",
      width: 180,
      align: "center",
      render: (value) => (
        <span className="machine-capacity-rated">{value}</span>
      ),
    },
    {
      title: "Hãng sản xuất",
      dataIndex: "manufacturer",
      width: 210,
      render: (value) => <span className="machine-capacity-name">{value}</span>,
    },
    {
      title: "Độ dày cắt tối đa (mm)",
      dataIndex: "maxCuttingThickness",
      width: 240,
      render: (value) => (
        <span className="machine-capacity-info">
          <span className="machine-capacity-muted">
            Thép Carbon: <strong>{value.carbonSteel}mm</strong>
          </span>
          <span className="machine-capacity-muted">
            Inox SUS304: <strong>{value.stainlessSteel}mm</strong>
          </span>
          <span className="machine-capacity-muted">
            Nhôm A5052: <strong>{value.aluminum}mm</strong>
          </span>
        </span>
      ),
    },
    {
      title: "Khí cắt hỗ trợ",
      dataIndex: "supportedGases",
      width: 160,
      align: "center",
      render: (values) => (
        <span className="machine-gas-list">
          {values.map((value, index) => (
            <React.Fragment key={value}>
              <span className="machine-gas-tag">{value}</span>
              {index < values.length - 1 ? (
                <span className="machine-gas-separator">, </span>
              ) : null}
            </React.Fragment>
          ))}
        </span>
      ),
    },
    {
      title: "Tốc độ định mức",
      dataIndex: "ratedSpeed",
      width: 160,
      align: "center",
      render: (value) => (
        <span className="machine-capacity-name">{value} m/phút</span>
      ),
    },
    {
      title: "Máy áp dụng",
      dataIndex: "appliedMachines",
      width: 150,
      align: "center",
      render: (value) => (
        <span className="machine-applied-tag">{value} máy</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 170,
      align: "center",
      render: (value) => (
        <span
          className={
            value === "Đang áp dụng"
              ? "machine-active-tag"
              : "machine-inactive-tag"
          }
        >
          {value}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
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
              onClick={() => setDeleteRecord(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      className="nesting-page machine-page machine-capacity-page"
      title="công suất máy"
      searchPlaceholder="Tìm theo mã công suất, nguồn laser, hãng sản xuất..."
      searchValue={keyword}
      onSearch={setKeyword}
      actionButtons={[
        <Space key="status-filter" className="machine-header-filter" size={10}>
          <span className="machine-filter-label">Trạng thái:</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            style={{ width: 180 }}
          />
        </Space>,
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
        className="common-table machine-table machine-capacity-table"
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSizeOptions: ["20", "50", "100", "200"],
          pageSize: 50,
          showSizeChanger: false,
          size: "small",
          style: { marginTop: 5 },
        }}
        rowKey="id"
        scroll={{ x: 1870, y: "calc(100vh - 290px)" }}
      />

      <Modal
        title={editingRecord ? "Cập nhật công suất" : "Thêm công suất"}
        open={isFormOpen}
        onCancel={handleCloseForm}
        footer={null}
        width={860}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            supportedGases: ["O2", "N2", "Air"],
            status: "Đang áp dụng",
          }}
        >
          <Space className="machine-form-row" size={16}>
            <Form.Item
              name="capacityCode"
              label="Mã công suất"
              rules={[
                { required: true, message: "Vui lòng nhập mã công suất" },
              ]}
            >
              <Input placeholder="Ví dụ: 6KW" />
            </Form.Item>
            <Form.Item
              name="ratedCapacity"
              label="Công suất định mức"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập công suất định mức",
                },
              ]}
            >
              <Input placeholder="Ví dụ: 6 kW (6000W)" />
            </Form.Item>
            <Form.Item
              name="manufacturer"
              label="Hãng sản xuất"
              rules={[
                { required: true, message: "Vui lòng nhập hãng sản xuất" },
              ]}
            >
              <Input placeholder="Nhập hãng sản xuất" />
            </Form.Item>
          </Space>
          <Form.Item
            name="laserSourceName"
            label="Tên nguồn phát laser"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên nguồn phát laser",
              },
            ]}
          >
            <Input placeholder="Nhập tên nguồn phát laser" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả" />
          </Form.Item>
          <Space className="machine-form-row" size={16}>
            <Form.Item
              name="carbonSteel"
              label="Thép Carbon (mm)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="stainlessSteel"
              label="Inox SUS304 (mm)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="aluminum"
              label="Nhôm A5052 (mm)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Space className="machine-form-row" size={16}>
            <Form.Item
              name="supportedGases"
              label="Khí cắt hỗ trợ"
              rules={[{ required: true }]}
            >
              <Select mode="multiple" options={gasOptions} />
            </Form.Item>
            <Form.Item
              name="ratedSpeed"
              label="Tốc độ định mức (m/phút)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="appliedMachines"
              label="Máy áp dụng"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true }]}
          >
            <Select
              options={statusOptions.filter((item) => item.value !== "all")}
            />
          </Form.Item>
          <div className="nesting-form-footer">
            <Space>
              <Button onClick={handleCloseForm}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <ModalConfirm
        open={Boolean(deleteRecord)}
        title="Xác nhận xóa"
        content={
          deleteRecord
            ? `Bạn có chắc chắn muốn xóa công suất ${deleteRecord.capacityCode} không?`
            : ""
        }
        okText="Đồng ý"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteRecord(null)}
      />
    </PageContainer>
  );
};

export default MachineCapacityList;
