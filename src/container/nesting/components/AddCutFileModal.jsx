/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../../services/baseService";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";
const PRIORITY_TO_API = {
  Cao: 1,
  "Trung bình": 2,
  Thấp: 3,
};

const getCommandCuttingFileId = (record) =>
  record?.id ?? record?.commandCuttingFileId;

const getPriorityFormValue = (priority) => {
  if (priority === undefined || priority === null) return undefined;
  if (priority === "Cao") return "2";
  if (priority === "Trung bÃ¬nh") return "1";
  if (priority === "Tháº¥p") return "0";
  return String(priority);
};

const AddCutFileModal = ({
  visible,
  editingRecord = null,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isEditing = Boolean(editingRecord);
  const [categoryCuttingFiles, setCategoryCuttingFiles] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productionCommands, setProductionCommands] = useState([]);

  const getProductionCommandIds = (value) =>
    (Array.isArray(value) ? value : [value]).filter(Boolean);

  const toFormValues = (record = {}) => {
    const productionCommandIds =
      record.productionCommandIds ??
      record.productionCommandId ??
      record.productionCommands?.map(
        (item) => item.id ?? item.productionCommandId,
      );

    return {
      priority: getPriorityFormValue(record.priority),
      productionCommandIds: getProductionCommandIds(productionCommandIds),
      cuttingFileCode: record.cuttingFileCode,
      cuttingFileName: record.cuttingFileCode,
      categoryCuttingFileId:
        record.categoryCuttingFileId ?? record.categoryCuttingFile?.id,
      length: record.length ?? record.spec?.length,
      width: record.width ?? record.spec?.width,
      thickness: record.thickness ?? record.spec?.thickness,
      material: record.materialCode ?? record.material,
      quantity: record.quantity,
      plannedQuantity: record.plannedQuantity ?? record.partQuantity,
      cuttingLength: record.cuttingLength ?? record.cutLength,
      cutDurationMinutes: record.cuttingTime ?? record.cutDurationMinutes,
    };
  };

  useEffect(() => {
    if (!visible) return;

    if (!editingRecord) {
      form.resetFields();
    }
  }, [visible, editingRecord, form]);

  const getSelectedCuttingFile = (cuttingFileCode) =>
    categoryCuttingFiles.find((item) => item.code === cuttingFileCode);

  const getCuttingFileValues = (values) => {
    const selectedCuttingFile = getSelectedCuttingFile(values.cuttingFileCode);

    return {
      cuttingFileCode: values.cuttingFileCode,
      cuttingFileName: values.cuttingFileCode,
      categoryCuttingFileId:
        values.categoryCuttingFileId ??
        selectedCuttingFile?.id ??
        selectedCuttingFile?.categoryCuttingFileId,
    };
  };

  const buildApiPayload = (values, updateOnly = false) => {
    const numericPriority = Number(values.priority);

    const payload = {
      priority:
        PRIORITY_TO_API[values.priority] ??
        (Number.isNaN(numericPriority) ? 1 : numericPriority),
      materialCode: values.material,
      length: Number(values.length),
      width: Number(values.width),
      thickness: Number(values.thickness),
      quantity: Number(values.quantity),
      cuttingLength: Number(values.cuttingLength),
      cuttingTime: Number(values.cutDurationMinutes),
      plannedQuantity: Number(values.plannedQuantity),
    };
    if (updateOnly) return payload;

    const cuttingFileValues = getCuttingFileValues(values);

    return {
      priority: payload.priority,
      ...cuttingFileValues,
      productionCommandIds: getProductionCommandIds(
        values.productionCommandIds,
      ),
      materialCode: payload.materialCode,
      length: payload.length,
      width: payload.width,
      thickness: payload.thickness,
      quantity: payload.quantity,
      cuttingLength: payload.cuttingLength,
      cuttingTime: payload.cuttingTime,
      plannedQuantity: payload.plannedQuantity,
    };
  };

  const buildLocalCutFile = (values, apiData = {}) => {
    const productionCommandIds = getProductionCommandIds(
      values.productionCommandIds,
    );
    const productionCommandText = productionCommandIds
      .map(
        (id) =>
          productionCommands.find((item) => item.value === id)?.commandCode ??
          id,
      )
      .join(", ");

    return {
      id: apiData.id ?? apiData.commandCuttingFileId ?? `ord_${Date.now()}`,
      date: values.date
        ? values.date.format("DD/MM/YYYY")
        : dayjs().format("DD/MM/YYYY"),
      priority: values.priority,
      code: productionCommandText,
      ...getCuttingFileValues(values),
      productionCommandId: productionCommandIds[0],
      productionCommandIds,
      material: values.material,
      materialCode: values.material,
      spec: {
        length: Number(values.length),
        width: Number(values.width),
        thickness: Number(values.thickness),
      },
      length: Number(values.length),
      width: Number(values.width),
      thickness: Number(values.thickness),
      quantity: Number(values.quantity),
      partQuantity: Number(values.plannedQuantity),
      plannedQuantity: Number(values.plannedQuantity),
      cuttingLength: Number(values.cuttingLength),
      cutDurationMinutes: Number(values.cutDurationMinutes),
      cuttingTime: Number(values.cutDurationMinutes),
      ...apiData,
    };
  };

  const getResponseData = (response) =>
    response?.data?.data ?? response?.data ?? response;

  const getResponseItems = (response) => {
    const result = getResponseData(response);
    return Array.isArray(result) ? result : (result?.items ?? []);
  };

  const fetchCutFileDetail = async (id) => {
    setLoadingDetail(true);
    form.setFieldsValue(toFormValues(editingRecord));

    try {
      const response = await getRequest(
        API_ENDPOINTS.COMMAND_CUTTING_FILE.GET_BY_ID.replace("{id}", id),
      );
      const detail = getResponseData(response);

      form.setFieldsValue(toFormValues({ ...editingRecord, ...detail }));
    } catch (error) {
      console.error("Failed to fetch command cutting file detail:", error);
      message.error(
        error?.response?.data?.message || "Khong the tai chi tiet file cat.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!visible || !editingRecord) return;

    const id = getCommandCuttingFileId(editingRecord);
    if (!id) {
      form.setFieldsValue(toFormValues(editingRecord));
      return;
    }

    fetchCutFileDetail(id);
  }, [visible, editingRecord]);

  const handleFinish = async (values, keepOpen = false) => {
    const id = getCommandCuttingFileId(editingRecord);
    if (isEditing && !id) {
      message.error("Khong tim thay id file cat de cap nhat.");
      return;
    }

    const payload = buildApiPayload(values, isEditing);
    setSaving(true);
    try {
      const response = isEditing
        ? await putRequest(
            API_ENDPOINTS.COMMAND_CUTTING_FILE.UPDATE_BY_ID.replace("{id}", id),
            payload,
          )
        : await postRequest(API_ENDPOINTS.COMMAND_CUTTING_FILE.CREATE, payload);
      const savedData = getResponseData(response);

      if (isEditing) {
        const updatedCutFile = {
          ...editingRecord,
          ...buildLocalCutFile(values, savedData),
        };
        onSubmit?.(updatedCutFile);
        message.success(
          `Đã cập nhật file cắt "${values.cuttingFileCode}" thành công!`,
        );
        onCancel();
      } else {
        const newCutFile = {
          ...buildLocalCutFile(values, savedData),
          plan: null,
          status: "Chưa phân bổ",
          execution: {
            hasMaterial: false,
            completedQuantity: 0,
            executionStatus: "Chờ thực hiện",
          },
        };
        onSubmit?.(newCutFile);
        message.success(
          `Đã thêm file cắt "${values.cuttingFileCode}" thành công!`,
        );
        if (keepOpen) {
          form.resetFields([
            "cuttingFileCode",
            "cuttingFileName",
            "categoryCuttingFileId",
            "cuttingLength",
            "cutDurationMinutes",
          ]);
        } else {
          onCancel();
        }
      }
    } catch (error) {
      console.error("Failed to save command cutting file:", error);
      message.error(
        error?.response?.data?.message || "Không thể lưu file cắt.",
      );
    } finally {
      setSaving(false);
    }
  };
  const handleSubmitClick = async (keepOpen = false) => {
    try {
      const values = await form.validateFields();
      await handleFinish(values, keepOpen);
    } catch (errorInfo) {
      const firstErrorField = errorInfo?.errorFields?.[0]?.name;
      if (firstErrorField) {
        form.scrollToField(firstErrorField, {
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };
  const categoryCuttingFileOptions = useMemo(
    () =>
      categoryCuttingFiles.map((item) => ({
        label: item.name
          ? `${item.code ? `${item.code} - ` : ""}${item.name}`
          : item.code || "KhÃ´ng cÃ³ tÃªn",
        value: item.id ?? item.categoryCuttingFileId,
      })),
    [categoryCuttingFiles],
  );

  const fetchCategory = async (page = 1, pageSize = 2000) => {
    setLoadingCategory(true);
    try {
      const response = await getRequest(
        API_ENDPOINTS.CATEGORY_CUTTING_FILE.GET_ALL,
        {
          Page: page,
          PageSize: pageSize,
        },
      );
      const items = getResponseItems(response);

      setCategoryCuttingFiles(items);
    } catch (error) {
      console.error("Failed to fetch category cutting files:", error);
      setCategoryCuttingFiles([]);
      message.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách loại file cắt.",
      );
    } finally {
      setLoadingCategory(false);
    }
  };

  const fetchProductionCommand = async (page = 1, pageSize = 1000) => {
    try {
      const response = await getRequest(
        API_ENDPOINTS.PRODUCTION_COMMAND.GET_ALL,
        {
          Page: page,
          PageSize: pageSize,
        },
      );

      const responseData = response?.data ?? response;
      const result = responseData?.data ?? responseData;
      const items = Array.isArray(result) ? result : (result?.items ?? []);
      const option = items.map((item) => ({
        label: `${item.commandCode} - ${item.orderName}`,
        value: item.id ?? item.productionCommandId,
        commandCode: item.commandCode,
        orderName: item.orderName,
      }));
      setProductionCommands(option);
    } catch (error) {
      console.error("Failed to fetch production commands:", error);

      setProductionCommands([]);

      message.error(
        error?.response?.data?.message ||
          "Không thể tải danh sách lệnh sản xuất.",
      );
    } finally {
    }
  };

  useEffect(() => {
    fetchCategory();
    fetchProductionCommand();
  }, []);
  return (
    <Modal
      title={
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
          {isEditing
            ? `CHỈNH SỬA FILE CẮT - ${editingRecord?.cuttingFileCode || ""}`
            : "THÊM MỚI FILE CẮT"}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={860}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        disabled={saving || loadingDetail}
        onFinish={(values) => handleFinish(values, false)}
        style={{ marginTop: 12 }}
      >
        {/* SECTION 1 - THÔNG TIN CHUNG */}
        <div
          style={{
            background: "#f8fafc",
            padding: "12px 16px",
            borderRadius: 6,
            marginBottom: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#1e3a8a",
              fontSize: 13,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            CHỌN LỆNH SẢN XUẤT & ĐƠN HÀNG
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="cuttingFileCode"
                label="Mã file cắt"
                rules={[{ required: !isEditing, message: "Nhập mã file cắt" }]}
              >
                <Input placeholder="Nhập mã file cắt" disabled={isEditing} />
              </Form.Item>
            </Col>
            {/* <Col span={8}>
              <Form.Item
                name="cuttingFileName"
                label="Tên file cắt"
                rules={[
                  { required: !isEditing, message: "Nhập tên file cắt" },
                ]}
              >
                <Input placeholder="Tên file cắt" disabled={isEditing} />
              </Form.Item>
            </Col> */}
            <Col span={12}>
              <Form.Item
                name="categoryCuttingFileId"
                label="Loại file cắt"
                rules={[{ required: !isEditing }]}
              >
                <Select
                  showSearch
                  allowClear
                  disabled={isEditing}
                  loading={loadingCategory}
                  placeholder="-- Chon loai file cat --"
                  optionFilterProp="label"
                  options={categoryCuttingFileOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Mức độ ưu tiên"
                rules={[{ required: true }]}
              >
                <Select
                  maxTagCount={1}
                  placeholder="-- Chọn mức độ ưu tiên --"
                  allowClear
                  showSearch
                  options={[
                    { label: "Cao", value: "2" },
                    { label: "Trung bình", value: "1" },
                    { label: "Thấp", value: "0" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productionCommandIds"
                label="Lệnh sản xuất"
                rules={[
                  {
                    required: !isEditing,
                    message: "Vui lòng chọn Lệnh sản xuất",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  disabled={isEditing}
                  placeholder="-- Chọn Lệnh sản xuất từ danh sách --"
                  filterOption={(input, option) =>
                    String(option?.label || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={productionCommands}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
        {/* SECTION 2 - QUY CÁCH PHÔI */}
        <div
          style={{
            background: "#f8fafc",
            padding: "12px 16px",
            borderRadius: 6,
            marginBottom: 14,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#1e3a8a",
              fontSize: 13,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            QUY CÁCH PHÔI
          </div>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item
                name="length"
                label="Dài (mm)"
                rules={[{ required: true, message: "Nhập chiều dài" }]}
              >
                <InputNumber
                  min={100}
                  step={0.1}
                  max={12000}
                  style={{ width: "100%" }}
                  placeholder="VD: 2330"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="width"
                label="Rộng (mm)"
                rules={[{ required: true, message: "Nhập chiều rộng" }]}
              >
                <InputNumber
                  min={100}
                  max={3000}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="VD: 1250"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="thickness"
                label="Dày (mm)"
                rules={[{ required: true, message: "Nhập độ dày" }]}
              >
                <InputNumber
                  min={0.3}
                  max={50}
                  step={0.1}
                  style={{ width: "100%" }}
                  placeholder="VD: 1.0"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="material"
                label="Vật liệu"
                rules={[{ required: true }]}
              >
                <Input placeholder="VD: 387-3 1mmCC 03" />
              </Form.Item>
            </Col>
          </Row>
        </div>
        {/* SECTION 3 - THÔNG TIN CẮT */}
        <div
          style={{
            background: "#f8fafc",
            padding: "12px 16px",
            borderRadius: 6,
            marginBottom: 16,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#1e3a8a",
              fontSize: 13,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            THÔNG TIN CẮT
          </div>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item
                name="quantity"
                label="Số lượng tấm"
                rules={[{ required: true, message: "Nhập số tấm" }]}
              >
                <InputNumber
                  min={1}
                  max={10000}
                  style={{ width: "100%" }}
                  placeholder="VD: 96"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="plannedQuantity"
                label="Số lượng chi tiết"
                rules={[{ required: true, message: "Nhập số lượng chi tiết" }]}
              >
                <InputNumber
                  min={1}
                  max={100000}
                  style={{ width: "100%" }}
                  placeholder="VD: 384"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="cuttingLength"
                label="Số mét cắt (m)"
                rules={[{ required: true, message: "Nhập số mét cắt" }]}
              >
                <InputNumber
                  min={1}
                  max={100000}
                  style={{ width: "100%" }}
                  placeholder="VD: 2304"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="cutDurationMinutes"
                label="Thời gian cắt (phút)"
                rules={[
                  { required: true, message: "Nhập thời gian cắt dự kiến" },
                ]}
              >
                <InputNumber
                  min={5}
                  max={5000}
                  style={{ width: "100%" }}
                  placeholder="VD: 180"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
        {/* Form Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Button onClick={onCancel} disabled={saving || loadingDetail}>
            Hủy
          </Button>
          {!isEditing && (
            <Button
              onClick={() => handleSubmitClick(true)}
              loading={saving}
              disabled={saving || loadingDetail}
            >
              Lưu & thêm tiếp
            </Button>
          )}
          <Button
            type="primary"
            onClick={() => handleSubmitClick(false)}
            loading={saving || loadingDetail}
          >
            {isEditing ? "Cập nhật file cắt" : "Lưu file cắt"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
export default AddCutFileModal;
