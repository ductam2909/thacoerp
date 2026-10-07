import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
} from "antd";
import Modal from "../../../components/core/common/Modal";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";
import { getRequest } from "../../../services/baseService";
import { toast } from "../../../utils/notification";

const MachineForm = ({
  form,
  open,
  editingRecord,
  saving,
  statusOptions,
  onCancel,
  onSubmit,
}) => {
  const [workShifts, setWorkShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryCuttingFiles, setCategoryCuttingFiles] = useState([]);

  const getResponseData = (response) =>
    response?.data?.data ?? response?.data ?? response;

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

  const fetchCategoryCuttingFiles = useCallback(
    async (page = 1, pageSize = 20) => {
      setLoading(true);
      try {
        const response = await getRequest(API_ENDPOINTS.CATEGORY_FILE.GET_ALL, {
          Page: page,
          PageSize: pageSize,
        });
        const result = getResponseData(response);
        const items = Array.isArray(result) ? result : (result?.items ?? []);
        setCategoryCuttingFiles(items);
      } catch (error) {
        console.error("Failed to fetch category cutting files:", error);
        toast.error(
          error?.response?.data?.message ||
            "Không thể tải danh sách loại file cắt.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchWorkShifts();
    fetchCategoryCuttingFiles();
  }, [fetchWorkShifts, fetchCategoryCuttingFiles]);
  return (
    <Modal
      title={editingRecord ? "Cập nhật máy" : "Thêm máy"}
      open={open}
      onCancel={onCancel}
      footer={null}
      focusTriggerAfterClose={false}
      width={760}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{
          powerKw: 0,
          performancePercent: 100,
          isReserveMachine: false,
          workShiftIds: [],
          categoryCuttingFileIds: [],
        }}
      >
        <Space className="machine-form-row machine-form-row--two" size={16}>
          <Form.Item
            name="machineName"
            label="Tên máy"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập tên máy",
              },
            ]}
          >
            <Input placeholder="Nhập tên máy" />
          </Form.Item>
          <Form.Item
            name="machineCode"
            label="Mã máy"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Vui lòng nhập mã máy",
              },
            ]}
          >
            <Input placeholder="Nhập mã máy" />
          </Form.Item>
        </Space>
        <Space className="machine-form-row machine-form-row--two" size={16}>
          <Form.Item
            name="powerKw"
            label="Công suất (kW)"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Nhập công suất"
            />
          </Form.Item>
          <Form.Item
            name="performancePercent"
            label="Hiệu suất (%)"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={0}
              style={{ width: "100%" }}
              placeholder="Nhập hiệu suất"
            />
          </Form.Item>
        </Space>
        <Form.Item name="isReserveMachine" valuePropName="checked">
          <Checkbox>Máy phát sinh</Checkbox>
        </Form.Item>
        <Space className="machine-form-row machine-form-row--two" size={16}>
          <Form.Item label="Độ dày cắt (mm)">
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="minCutThicknessMm"
                noStyle
                dependencies={["maxCutThicknessMm"]}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập chiều dài tối thiểu",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxLength = getFieldValue("maxCutThicknessMm");
                      if (
                        value == null ||
                        maxLength == null ||
                        value <= maxLength
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Chiều dài tối thiểu không được lớn hơn tối đa",
                        ),
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Từ (mm)"
                  style={{ width: "50%" }}
                />
              </Form.Item>
              <Form.Item
                name="maxCutThicknessMm"
                noStyle
                dependencies={["minCutThicknessMm"]}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập chiều dài tối đa",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minLength = getFieldValue("minCutThicknessMm");
                      if (
                        value == null ||
                        minLength == null ||
                        value >= minLength
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error(
                          "Chiều dài tối đa không được nhỏ hơn tối thiểu",
                        ),
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Đến (mm)"
                  style={{ width: "50%" }}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item label="Khổ bàn máy (mm)">
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="minCutLengthMm"
                noStyle
                dependencies={["maxCutLengthMm"]}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập chiều dài tối thiểu",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const maxLength = getFieldValue("maxCutLengthMm");
                      if (
                        value == null ||
                        maxLength == null ||
                        value <= maxLength
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Chiều dài tối thiểu không được lớn hơn tối đa",
                        ),
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Từ (mm)"
                  style={{ width: "50%" }}
                />
              </Form.Item>
              <Form.Item
                name="maxCutLengthMm"
                noStyle
                dependencies={["minCutLengthMm"]}
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập chiều dài tối đa",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minLength = getFieldValue("minCutLengthMm");
                      if (
                        value == null ||
                        minLength == null ||
                        value >= minLength
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error(
                          "Chiều dài tối đa không được nhỏ hơn tối thiểu",
                        ),
                      );
                    },
                  }),
                ]}
              >
                <InputNumber
                  min={0}
                  placeholder="Đến (mm)"
                  style={{ width: "50%" }}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </Space>
        <Form.Item
          name="categoryCuttingFileIds"
          label="Loại file cắt"
          style={{ width: "100%" }}
          rules={[{ required: true }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn loại file cắt"
            style={{ width: "100%" }}
            options={categoryCuttingFiles.map((item) => ({
              value: item.id,
              label: item.code,
            }))}
          />
        </Form.Item>
        {editingRecord && (
          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true }]}
          >
            <Select options={statusOptions} />
          </Form.Item>
        )}
        <Form.Item
          name="workShiftIds"
          label="Ca làm việc"
          style={{ width: "100%" }}
          rules={[{ required: true }]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn ca làm việc"
            style={{ width: "100%" }}
            options={workShifts}
            fieldNames={{ value: "id", label: "shiftName" }}
          />
        </Form.Item>
        <div className="nesting-form-footer">
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingRecord ? "Cập nhật" : "Thêm mới"}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default MachineForm;
