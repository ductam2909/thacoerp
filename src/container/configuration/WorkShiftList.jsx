import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Space, Table, TimePicker, Tooltip } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageContainer from "../../components/core/common/PageContainer";
import Modal from "../../components/core/common/Modal";
import ModalConfirm from "../../components/core/common/ModalConfirm";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "../../services/baseService";
import { toast } from "../../utils/notification";

const toPickerTime = (value) => (value ? dayjs(`2000-01-01T${value}`) : null);

const getWorkShiftId = (record) => record?.id ?? record?.workShiftId;

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? response;

const toFormShiftBreaks = (breaks = []) =>
  (Array.isArray(breaks) ? breaks : []).map((item) => ({
    ...item,
    startTime: toPickerTime(item.startTime),
    endTime: toPickerTime(item.endTime),
  }));

const toShiftCode = (value = "") => {
  const words = String(value)
    .trim()
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return words
    .map((word, index) => {
      const lowerWord = word.toLowerCase();
      return index === 0
        ? lowerWord
        : lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    })
    .join("");
};

const WorkShiftList = () => {
  const [workShifts, setWorkShifts] = useState([]);

  const [keyword, setKeyword] = useState("");

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);

  const [deleteRecord, setDeleteRecord] = useState(null);

  const [form] = Form.useForm();

  const fetchWorkShifts = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.WORK_SHIFT.GET_ALL, {
        Page: page,
        PageSize: pageSize,
      });

      const result = getResponseData(response);

      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setWorkShifts(items);
      setPagination({
        current: result?.page ?? page,
        pageSize: result?.pageSize ?? pageSize,
        total: result?.total ?? items.length,
      });
    } catch (error) {
      console.error("Failed to fetch work shifts:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách ca làm việc.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkShifts();
  }, [fetchWorkShifts]);

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return workShifts;
    return workShifts.filter((item) =>
      [item.shiftCode, item.shiftName].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedKeyword),
      ),
    );
  }, [keyword, workShifts]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ shiftBreaks: [] });
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (record) => {
    try {
      const response = await getRequest(
        API_ENDPOINTS.WORK_SHIFT.GET_BY_ID.replace(
          "{id}",
          getWorkShiftId(record),
        ),
      );

      const workShift = getResponseData(response) ?? record;
      const shiftBreaks = toFormShiftBreaks(
        workShift.breaks ?? workShift.shiftBreaks,
      );
      setEditingRecord(workShift);
      form.setFieldsValue({
        ...workShift,
        startTime: toPickerTime(workShift.startTime),
        endTime: toPickerTime(workShift.endTime),
        shiftBreaks,
      });
      setIsFormOpen(true);
    } catch (error) {
      console.error("Failed to load work shift:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể tải thông tin ca làm việc.",
      );
    }
  };

  const handleCloseForm = () => {
    document.activeElement?.blur?.();
    setIsFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    const shiftName = values.shiftName.trim();
    // Lấy toàn bộ các dòng đang có trong Form.List:
    // gồm giờ nghỉ cũ và tất cả giờ nghỉ vừa thêm.
    const currentShiftBreaks =
      form.getFieldValue("shiftBreaks") ?? values.shiftBreaks ?? [];

    const shiftBreaks = currentShiftBreaks.map((item, index) => {
      const breakData = {
        breakName: item?.breakName?.trim() || `Ca_${index + 1}`,
        startTime: item?.startTime?.format("HH:mm:ss"),
        endTime: item?.endTime?.format("HH:mm:ss"),
      };

      // Giờ nghỉ cũ khi cập nhật phải giữ id.
      if (editingRecord && item?.id) {
        return {
          id: item.id,
          ...breakData,
        };
      }

      // Giờ nghỉ mới không gửi id.
      return breakData;
    });

    const payload = {
      shiftCode: toShiftCode(shiftName),
      shiftName,
      startTime: values?.startTime?.format("HH:mm:ss"),
      endTime: values?.endTime?.format("HH:mm:ss"),
      shiftBreaks,
    };

    console.log("FORM SHIFT BREAKS:", currentShiftBreaks);
    console.log("PAYLOAD:", payload);
    setSaving(true);
    try {
      if (editingRecord) {
        await putRequest(
          API_ENDPOINTS.WORK_SHIFT.UPDATE_BY_ID.replace(
            "{id}",
            getWorkShiftId(editingRecord),
          ),
          payload,
        );

        toast.success("Cập nhật ca làm việc thành công!");
      } else {
        await postRequest(API_ENDPOINTS.WORK_SHIFT.CREATE, payload);
        toast.success("Thêm ca làm việc thành công!");
      }

      handleCloseForm();
      fetchWorkShifts(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Failed to save work shift:", error);
      toast.error(
        error?.response?.data?.message ||
          (editingRecord
            ? "Không thể cập nhật ca làm việc."
            : "Không thể thêm ca làm việc."),
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
        API_ENDPOINTS.WORK_SHIFT.DELETE_BY_ID.replace(
          "{id}",
          getWorkShiftId(deleteRecord),
        ),
      );

      toast.success("Xóa ca làm việc thành công!");
      setDeleteRecord(null);

      const nextPage =
        workShifts.length === 1 && pagination.current > 1
          ? pagination.current - 1
          : pagination.current;
      await fetchWorkShifts(nextPage, pagination.pageSize);
    } catch (error) {
      console.error("Failed to delete work shift:", error);
      toast.error(
        error?.response?.data?.message || "Không thể xóa ca làm việc.",
      );
    } finally {
      setSaving(false);
    }
  };

  function convertMinutes(totalMinutes) {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    const result = [];

    if (days > 0) result.push(`${days} ngày`);
    if (hours > 0) result.push(`${hours} giờ`);
    if (minutes > 0) result.push(`${minutes} phút`);

    return result.length > 0 ? result.join(" ") : "0 phút";
  }

  const columns = [
    {
      title: "STT",
      dataIndex: "id",
      width: 80,
      align: "center",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Mã ca",
      dataIndex: "shiftCode",
      width: 180,
    },
    {
      title: "Tên ca",
      dataIndex: "shiftName",
      width: 260,
      render: (value) => <span className="machine-name">{value}</span>,
    },
    {
      title: "Từ giờ",
      dataIndex: "startTime",
      width: 180,
      align: "center",
      render: (value) => value?.slice(0, 5),
    },
    {
      title: "Đến giờ",
      dataIndex: "endTime",
      width: 180,
      align: "center",
      render: (value) => value?.slice(0, 5),
    },
    {
      title: "Thời gian nghỉ",
      dataIndex: "breaks",
      key: "breaks",
      width: 180,
      align: "center",
      render: (breaks) => {
        if (!Array.isArray(breaks) || breaks.length === 0) {
          return "";
        }

        return breaks
          .map((item) => {
            const startTime = item.startTime?.slice(0, 5);
            const endTime = item.endTime?.slice(0, 5);

            return `${startTime} - ${endTime}`;
          })
          .join(", ");
      },
    },
    {
      title: "Thời gian khả dụng",
      dataIndex: "standardTimeMinutes",
      width: 180,
      align: "center",
      render: (value) => <span>{convertMinutes(value)}</span>,
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
      className="nesting-page machine-page"
      title="Cấu hình ca làm việc"
      searchPlaceholder="Tìm theo mã ca, tên ca..."
      searchValue={keyword}
      onSearch={setKeyword}
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
        className="common-table machine-table"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          size: "small",
          style: { marginTop: 5 },
          onChange: (page, pageSize) => fetchWorkShifts(page, pageSize),
        }}
        rowKey={getWorkShiftId}
        scroll={{ x: 1000, y: "calc(100vh - 290px)" }}
      />
      <Modal
        title={editingRecord ? "Cập nhật ca làm việc" : "Thêm ca làm việc"}
        open={isFormOpen}
        onCancel={handleCloseForm}
        footer={null}
        focusTriggerAfterClose={false}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="shiftName"
            label="Tên ca"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên ca",
              },
            ]}
          >
            <Input placeholder="Nhập tên ca" />
          </Form.Item>
          <span>Thời gian làm việc</span>
          <Space
            className="machine-form-row machine-form-row--two"
            size={16}
            style={{ marginTop: 10 }}
          >
            <Form.Item
              name="startTime"
              label="Từ giờ"
              rules={[{ required: true, message: "Vui lòng chọn từ giờ" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="endTime"
              label="Đến giờ"
              rules={[{ required: true, message: "Vui lòng chọn đến giờ" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <span>Thời gian nghỉ</span>
          <Form.List name="shiftBreaks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      marginTop: 10,
                    }}
                  >
                    <Form.Item {...restField} name={[name, "id"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "breakName"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "startTime"]}
                      label="Từ giờ"
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[
                        { required: true, message: "Vui lòng chọn từ giờ" },
                      ]}
                    >
                      <TimePicker format="HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "endTime"]}
                      label="Đến giờ"
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[
                        { required: true, message: "Vui lòng chọn đến giờ" },
                      ]}
                    >
                      <TimePicker format="HH:mm" style={{ width: "100%" }} />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      style={{ marginTop: 28, flexShrink: 0 }}
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      id: undefined,
                      breakName: undefined,
                      startTime: null,
                      endTime: null,
                    })
                  }
                  style={{ width: "100%", marginTop: 8 }}
                >
                  Thêm giờ nghỉ
                </Button>
              </>
            )}
          </Form.List>
          <div className="nesting-form-footer">
            <Space>
              <Button onClick={handleCloseForm}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
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
            ? `Bạn có chắc chắn muốn xóa ca ${deleteRecord.shiftName} không?`
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

export default WorkShiftList;
