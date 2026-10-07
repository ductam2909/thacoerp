import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import PageContainer from "../../components/core/common/PageContainer";
import ModalConfirm from "../../components/core/common/ModalConfirm";
import MachineForm from "./components/MachineForm";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../services/baseService";
import { toast } from "../../utils/notification";

const { Text } = Typography;
const statusOptions = [
  { value: 0, label: "Hoạt động" },
  { value: 1, label: "Bảo trì" },
  { value: 2, label: "Ngừng hoạt động" },
];

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? response;

const getMachineId = (record) => record?.machineId ?? record?.id;

const toIdList = (value, idKeys = ["id"]) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      return idKeys.map((key) => item?.[key]).find(Boolean);
    })
    .filter(Boolean);
};

const MachineList = () => {
  const [machines, setMachines] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [powerFilter, setPowerFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [form] = Form.useForm();

  const fetchMachines = useCallback(async (page = 1, pageSize = 50) => {
    setLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.MACHINE.GET_ALL, {
        Page: page,
        PageSize: pageSize,
      });
      const result = getResponseData(response);
      console.log(response);
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setMachines(items);
      setPagination({
        current: result?.page ?? page,
        pageSize: result?.pageSize ?? pageSize,
        total: result?.total ?? items.length,
      });
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách máy.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const powerOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả" },
      ...Array.from(
        new Set(
          machines.map((item) => item.powerKw).filter((value) => value != null),
        ),
      )
        .sort((a, b) => a - b)
        .map((value) => ({ value, label: `${value} kW` })),
    ],
    [machines],
  );

  const filteredData = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return machines.filter(
      (item) =>
        (powerFilter === "all" || item.powerKw === powerFilter) &&
        (!query ||
          [item.machineName, item.machineCode].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          )),
    );
  }, [keyword, machines, powerFilter]);

  const closeForm = () => {
    document.activeElement?.blur?.();
    setIsFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const openEdit = async (record) => {
    try {
      const response = await getRequest(
        API_ENDPOINTS.MACHINE.GET_BY_ID.replace("{id}", getMachineId(record)),
      );
      const machine = getResponseData(response);
      setEditingRecord(machine);
      form.setFieldsValue({
        ...machine,
        workShiftIds:
          machine?.workShiftIds ??
          toIdList(machine?.workShifts, ["id", "workShiftId"]),
        categoryCuttingFileIds:
          machine?.categoryCuttingFileIds ??
          toIdList(machine?.categoryCuttingFiles, [
            "id",
            "categoryCuttingFileId",
            "categoryFileId",
          ]),
      });
      setIsFormOpen(true);
    } catch (error) {
      console.error("Failed to load machine:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải thông tin máy.",
      );
    }
  };

  const handleSubmit = async (values) => {
    const payload = {
      machineCode: values.machineCode.trim(),
      machineName: values.machineName.trim(),
      powerKw: values.powerKw,
      isReserveMachine: Boolean(values.isReserveMachine),
      minCutLengthMm: values.minCutLengthMm,
      maxCutLengthMm: values.maxCutLengthMm,
      minCutThicknessMm: values.minCutThicknessMm,
      maxCutThicknessMm: values.maxCutThicknessMm,
      performancePercent: values.performancePercent,
      workShiftIds: values.workShiftIds ?? [],
      categoryCuttingFileIds: values.categoryCuttingFileIds ?? [],
    };
    if (editingRecord) payload.status = values.status;
    setSaving(true);
    try {
      if (editingRecord) {
        await putRequest(
          API_ENDPOINTS.MACHINE.UPDATE_BY_ID.replace(
            "{id}",
            getMachineId(editingRecord),
          ),
          payload,
        );
      } else {
        await postRequest(API_ENDPOINTS.MACHINE.CREATE, payload);
      }
      toast.success(
        editingRecord ? "Cập nhật máy thành công!" : "Thêm máy thành công!",
      );
      closeForm();
      const nextPage = editingRecord ? pagination.current : 1;
      if (!editingRecord) {
        setKeyword("");
        setPowerFilter("all");
      }
      await fetchMachines(nextPage, pagination.pageSize);
    } catch (error) {
      console.error("Failed to save machine:", error);
      toast.error(
        error?.response?.data?.message || "Không thể lưu thông tin máy.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteRecord) return;
    setSaving(true);
    try {
      await deleteRequest(
        API_ENDPOINTS.MACHINE.DELETE_BY_ID.replace(
          "{id}",
          getMachineId(deleteRecord),
        ),
      );
      toast.success("Xóa máy thành công!");
      setDeleteRecord(null);
      const nextPage =
        machines.length === 1 && pagination.current > 1
          ? pagination.current - 1
          : pagination.current;
      await fetchMachines(nextPage, pagination.pageSize);
    } catch (error) {
      console.error("Failed to delete machine:", error);
      toast.error(error?.response?.data?.message || "Không thể xóa máy.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã máy",
      dataIndex: "machineCode",
      width: 120,
      render: (value) => <span className="machine-code">{value}</span>,
    },
    {
      title: "Tên máy",
      dataIndex: "machineName",
      width: 200,
      render: (value) => <span className="machine-name">{value}</span>,
    },
    {
      title: "Công suất",
      dataIndex: "powerKw",
      width: 120,
      align: "center",
      render: (value) => <Tag className="machine-power-tag">{value} kW</Tag>,
    },
    {
      title: "Khổ bàn máy",
      dataIndex: "minCutLengthMm",
      width: 140,
      align: "center",
      render: (_, record) => {
        const minLength = record?.minCutLengthMm;
        const maxLength = record?.maxCutLengthMm;

        if (minLength == null && maxLength == null) return "";

        return `${minLength ?? 0} mm - ${maxLength ?? 0} mm`;
      },
    },
    {
      title: "Độ dày cắt",
      dataIndex: "minCutThicknessMm",
      width: 130,
      align: "center",
      render: (_, record) => {
        const minThickness = record?.minCutThicknessMm;
        const maxThickness = record?.maxCutThicknessMm;

        if (minThickness == null && maxThickness == null) return "—";

        return `${minThickness ?? 0} mm - ${maxThickness ?? 0} mm`;
      },
    },
    {
      title: "Hiệu suất",
      dataIndex: "performancePercent",
      width: 110,
      align: "center",
      render: (value) => (value == null ? "" : `${value}%`),
    },
    {
      title: "Loại file cắt",
      dataIndex: "categoryCuttingFiles",
      width: 160,
      align: "center",
      render: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          return "—";
        }

        return (
          <Space size={[2, 2]} wrap>
            {value.map((item) => (
              <Tag key={item.id}>{item.code || ""}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 100,
      align: "center",
      render: (value, record) => (
        <Tag
          className={
            value === 0 ? "machine-active-tag" : "machine-inactive-tag"
          }
        >
          {statusOptions.find((option) => option.value === value)?.label ??
            record.statusName ??
            value}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space className="nesting-action-list" size={10}>
          <Tooltip title="Sửa">
            <Button
              className="nesting-action-button nesting-edit-button"
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
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
      className="nesting-page machine-page"
      title="Danh sách máy"
      searchPlaceholder="Tìm theo tên máy, mã máy GV..."
      searchValue={keyword}
      onSearch={setKeyword}
      actionButtons={[
        <Space key="power-filter" className="machine-header-filter" size={10}>
          <Text>Công suất:</Text>
          <Select
            value={powerFilter}
            onChange={setPowerFilter}
            options={powerOptions}
            style={{ width: 180 }}
          />
        </Space>,
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            form.resetFields();
            setIsFormOpen(true);
          }}
        >
          Thêm mới
        </Button>,
      ]}
      hideScroll
    >
      <Table
        bordered
        className="common-table machine-table"
        columns={columns}
        dataSource={filteredData}
        rowKey={getMachineId}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          pageSizeOptions: ["20", "50", "100", "200"],
          showSizeChanger: true,
          size: "small",
          style: { marginTop: 5 },
          onChange: (page, pageSize) => fetchMachines(page, pageSize),
        }}
        scroll={{ x: 1100, y: "calc(100vh - 300px)" }}
      />
      <MachineForm
        form={form}
        open={isFormOpen}
        editingRecord={editingRecord}
        saving={saving}
        statusOptions={statusOptions}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />
      <ModalConfirm
        open={Boolean(deleteRecord)}
        title="Xác nhận xóa"
        content={
          deleteRecord
            ? `Bạn có chắc chắn muốn xóa máy ${deleteRecord.machineCode} không?`
            : ""
        }
        okText="Đồng ý"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: saving }}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteRecord(null)}
      />
    </PageContainer>
  );
};

export default MachineList;
