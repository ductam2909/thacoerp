import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Space,
  Table,
  TimePicker,
  Tooltip,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
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
import TextArea from "antd/es/input/TextArea";

function CategoryFile() {
  const [categoryFile, setCategoryFile] = useState([]);
  const [keyword, setKeyword] = useState("");
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
  const getResponseData = (response) =>
    response?.data?.data ?? response?.data ?? response;
  const toPickerTime = (value) => (value ? dayjs(`2000-01-01T${value}`) : null);

  const getWorkShiftId = (record) => record?.id ?? record?.workShiftId;

  const fetchCategoryFile = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.CATEGORY_FILE.GET_ALL, {
        Page: page,
        PageSize: pageSize,
      });
      const result = getResponseData(response);
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      setCategoryFile(items);
      setPagination({
        current: result?.page ?? page,
        pageSize: result?.pageSize ?? pageSize,
        total: result?.total ?? items.length,
      });
    } catch (error) {
      console.error("Failed to fetch category files:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách loại file.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoryFile();
  }, [fetchCategoryFile]);

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      startTime: toPickerTime(record.startTime),
      endTime: toPickerTime(record.endTime),
    });
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    document.activeElement?.blur?.();
    setIsFormOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleConfirmDelete = async () => {
    if (!deleteRecord) return;
    setSaving(true);
    try {
      await deleteRequest(
        API_ENDPOINTS.CATEGORY_FILE.DELETE_BY_ID.replace(
          "{id}",
          getWorkShiftId(deleteRecord),
        ),
      );
      toast.success("Xóa loại file thành công!");
      setDeleteRecord(null);
      const nextPage =
        categoryFile.length === 1 && pagination.current > 1
          ? pagination.current - 1
          : pagination.current;
      await fetchCategoryFile(nextPage, pagination.pageSize);
    } catch (error) {
      console.error("Failed to delete work shift:", error);
      toast.error(error?.response?.data?.message || "Không thể xóa loại file.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (values) => {
    const payload = {
      code: values.code,
      name: values?.name,
      description: values?.description
    };
    setSaving(true);
    try {
      if (editingRecord) {
        await putRequest(
          API_ENDPOINTS.CATEGORY_FILE.UPDATE_BY_ID.replace(
            "{id}",
            getWorkShiftId(editingRecord),
          ),
          payload,
        );
      } else {
        await postRequest(API_ENDPOINTS.CATEGORY_FILE.CREATE, payload);
      }
      toast.success(
        editingRecord
          ? "Cập nhật ca làm việc thành công!"
          : "Thêm ca làm việc thành công!",
      );
      handleCloseForm();
      await fetchCategoryFile(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Failed to save work shift:", error);
      toast.error(
        error?.response?.data?.message || "Không thể lưu ca làm việc.",
      );
    } finally {
      setSaving(false);
    }
  };

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
      title: "Mã file cắt",
      dataIndex: "code",
    },
     {
      title: "Tên file cắt",
      dataIndex: "name",
    },
     {
      title: "Mô tả",
      dataIndex: "description",
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
      title="Cấu hình mã file cắt"
      searchPlaceholder="Tìm theo mã file cắt..."
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
        dataSource={categoryFile}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          size: "small",
          style: { marginTop: 5 },
          onChange: (page, pageSize) => fetchCategoryFile(page, pageSize),
        }}
        rowKey={getWorkShiftId}
        scroll={{ x: 1000, y: "calc(100vh - 290px)" }}
      />

      <Modal
        title={editingRecord ? "Cập nhật mã file cắt" : "Thêm mã file cắt"}
        open={isFormOpen}
        onCancel={handleCloseForm}
        footer={null}
        focusTriggerAfterClose={false}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="code"
                label="Mã file cắt"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng nhập mã file cắt",
                  },
                ]}
              >
                <Input placeholder="Nhập mã file cắt" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Tên file cắt"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Vui lòng nhập tên file cắt",
                  },
                ]}
              >
                <Input placeholder="Nhập tên file cắt" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="Mô tả"
              >
                <TextArea placeholder="Nhập mô tả"  autoSize={{ minRows: 4, maxRows: 8 }} />
              </Form.Item>
            </Col>
          </Row>

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
}

export default CategoryFile;
