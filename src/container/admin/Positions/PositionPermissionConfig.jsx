import React, { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Input, Space, Table, Typography } from "antd";
import { ArrowLeftOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../../components/core/common/PageContainer";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";
import { getRequest, postRequest } from "../../../services/baseService";
import { toast } from "../../../utils/notification";

const { Text } = Typography;

const ACTION_LABELS = {
  View: "Xem",
  Create: "Thêm",
  Update: "Cập nhật",
  Delete: "Xóa",
  UpdateStatus: "Cập nhật trạng thái",
  Assign: "Phân công",
  Manage: "Quản lý",
  Upload: "Tải lên",
  Download: "Tải xuống",
  Export: "Xuất file",
  Import: "Nhập file",
  Approve: "Phê duyệt",
  AssignPermission: "Gán quyền",
  ManageMember: "Quản lý thành viên",
  ToggleStatus: "Bật/tắt trạng thái",
  ViewReport: "Xem báo cáo",
  Promote: "Quyền QL",
  Demote: "Xóa quyền QL",
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const getActionLabel = (action) => ACTION_LABELS[action] ?? action;

const unwrapList = (response) => {
  const result =
    response?.data?.data || response?.data || response?.Data || response;
  return Array.isArray(result) ? result : result?.items || result?.Items || [];
};

const unwrapDetail = (response) =>
  response?.data?.data || response?.data || response?.Data || response || {};
const getPermissionId = (item) =>
  typeof item === "string"
    ? item
    : item?.permissionId || item?.permission?.id || item?.id;
const getMenuId = (item) => item?.menuId || item?.menu?.id;
const parseCode = (code = "") => {
  const index = code.lastIndexOf(".");
  return index > 0
    ? { functionName: code.slice(0, index), action: code.slice(index + 1) }
    : { functionName: code, action: "" };
};

const PositionPermissionConfig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [position, setPosition] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [permissionResponse, assignedResponse, positionResponse] = await Promise.all([
          getRequest(API_ENDPOINTS.PERMISSION.GET_ALL),
          getRequest(
            API_ENDPOINTS.PERMISSION.GET_BY_POSITION.replace("{positionId}", id),
          ),
          getRequest(
            API_ENDPOINTS.POSITION.GET_BY_ID.replace("{positionId}", id),
          ),
        ]);
        const detail = unwrapDetail(positionResponse);
        const assignedData = unwrapDetail(assignedResponse);
        const assigned = Array.isArray(assignedData?.permissionIds)
          ? assignedData.permissionIds
          : unwrapList(assignedResponse);
        const assignedIds = assigned
          .map(getPermissionId)
          .filter(Boolean);

        setPermissions(unwrapList(permissionResponse));
        setPosition(detail);
        setSelectedIds(assignedIds);
      } catch (error) {
        console.error("Failed to load permission matrix:", error);
        toast.error("Không thể tải dữ liệu phân quyền.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const permissionRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const rows = new Map();

    permissions.forEach((permission) => {
      const menuId = getMenuId(permission) || "common";
      const { functionName, action } = parseCode(permission.code);
      if (!functionName || !action) return;

      const key = `${menuId}:${functionName}`;
      if (!rows.has(key)) {
        rows.set(key, {
          key,
          menuId,
          name: functionName,
          menuName: permission.menuName || permission.menu?.name,
          permissions: {},
        });
      }
      rows.get(key).permissions[action.toLowerCase()] = permission;
    });

    return Array.from(rows.values())
      .filter(
        (row) =>
          !keyword ||
          [row.name, row.menuName].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword),
          ),
      )
      .map((row, index) => ({ ...row, stt: index + 1 }));
  }, [permissions, search]);

  const updatePermissions = async (nextIds) => {
    if (updating) return;
    setUpdating(true);
    try {
      await postRequest(API_ENDPOINTS.PERMISSION.ASSIGN_POSITION, {
        positionId: id,
        permissionIds: nextIds,
      });
      setSelectedIds(nextIds);
      toast.success("Cập nhật quyền thành công!");
    } catch (error) {
      console.error("Failed to update position permission:", error);
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật quyền.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const togglePermission = (permissionId, checked) => {
    if (!permissionId) return;
    updatePermissions(
      checked
        ? Array.from(new Set([...selectedIds, permissionId]))
        : selectedIds.filter((item) => item !== permissionId),
    );
  };

  const getRowPermissionIds = (record) =>
    ALL_ACTIONS.map((action) =>
      getPermissionId(record.permissions[action.toLowerCase()]),
    ).filter(Boolean);

  const toggleRowPermissions = (permissionIds, checked) => {
    const nextIds = checked
      ? Array.from(new Set([...selectedIds, ...permissionIds]))
      : selectedIds.filter((item) => !permissionIds.includes(item));
    if (nextIds.length !== selectedIds.length) updatePermissions(nextIds);
  };

  const columns = [
    {
      title: "Stt",
      dataIndex: "stt",
      width: 100,
      align: "center",
      fixed: "left",
    },
    {
      title: "Menu/ Chức năng",
      dataIndex: "name",
      fixed: "left",
      width: 240,
      render: (name, record) => (
        <Space>
          <Text>
            {record.menuName} / {name}
          </Text>
          {/* <Text>{name}</Text> */}
        </Space>
      ),
    },
    ...ALL_ACTIONS.map((action) => ({
      title: getActionLabel(action),
      key: action,
      width: 105,
      align: "center",
      render: (_, record) => {
        const permission = record.permissions[action.toLowerCase()];
        const permissionId = getPermissionId(permission);
        return (
          <Checkbox
            disabled={!permissionId || updating}
            checked={Boolean(
              permissionId && selectedIds.includes(permissionId),
            )}
            title={
              permissionId
                ? permission?.name
                : `Menu chưa có quyền ${getActionLabel(action)}`
            }
            onChange={(event) =>
              togglePermission(permissionId, event.target.checked)
            }
          />
        );
      },
    })),
    {
      title: "Tất cả",
      key: "all",
      width: 90,
      align: "center",
      render: (_, record) => {
        const ids = getRowPermissionIds(record);
        const checkedCount = ids.filter((permissionId) =>
          selectedIds.includes(permissionId),
        ).length;
        return (
          <Checkbox
            disabled={
              ids.length === 0 || updating
            }
            checked={ids.length > 0 && checkedCount === ids.length}
            indeterminate={checkedCount > 0 && checkedCount < ids.length}
            onChange={(event) =>
              toggleRowPermissions(ids, event.target.checked)
            }
          />
        );
      },
    },
  ];

  return (
    <PageContainer
      title={`Cấu hình quyền${position.positionName ? ` - ${position.positionName}` : ""}`}
      actionButtons={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>,
      ]}
    >
      <Space style={{ marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm menu..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ width: 320 }}
        />
        <Text type="secondary">
          Đã chọn {selectedIds.length}/{permissions.length} quyền
        </Text>
      </Space>
      <Table
        columns={columns}
        dataSource={permissionRows}
        rowKey="key"
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: "max-content", y: "calc(100vh - 330px)" }}
      />
    </PageContainer>
  );
};

export default PositionPermissionConfig;
