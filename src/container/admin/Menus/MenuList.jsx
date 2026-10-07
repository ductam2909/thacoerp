import React, { useState, useEffect, useMemo } from "react";
import { Button, Form, Space } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import * as AntdIcons from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { toast } from "../../../utils/notification";
import PageContainer from "../../../components/core/common/PageContainer";
import Table from "../../../components/core/common/Table";
import ModalConfirm from "../../../components/core/common/ModalConfirm";
import MenuForm from "./MenuForm";
import {
  deleteRequest,
  postRequest,
  putRequest,
} from "../../../services/baseService";
import { API_ENDPOINTS } from "../../../constants/apiEndpoints";
import { getMenus, publishMenus } from "../../../services/menuService";

export const getIconComponent = (iconName) => {
  if (!iconName) return null;
  const iconAliases = {
    Users: "TeamOutlined",
    Organization: "ApartmentOutlined",
    Department: "BankOutlined",
    Position: "SolutionOutlined",
    Settings: "SettingOutlined",
    Permission: "SafetyCertificateOutlined",
    Audit: "HistoryOutlined",
    WhiteList: "CheckCircleOutlined",
    Task: "CheckSquareOutlined",
    Time: "ClockCircleOutlined",
    TimeLog: "FieldTimeOutlined",
    DailyLog: "CalendarOutlined",
    File: "FolderOpenOutlined",
    Category: "AppstoreOutlined",
  };
  const IconComponent =
    AntdIcons[iconAliases[iconName] || iconName] ||
    AntdIcons[`${iconName}Outlined`];
  if (!IconComponent) return null;
  return <IconComponent />;
};

const MenuList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [form] = Form.useForm();

  //  Chuyển đổi dữ liệu để tạo các stt chính xác cho chế độ hiển thị dạng cây
  const cleanTreeData = (treeData, prefix = "") => {
    return [...treeData]
      .sort(
        (a, b) =>
          (Number(a.orderDisplay ?? a.order) || 0) -
          (Number(b.orderDisplay ?? b.order) || 0),
      )
      .map((item, index) => {
        const currentNumber = prefix
          ? `${prefix}.${index + 1}`
          : `${index + 1}`;
        const newItem = {
          ...item,
          menuId: item.id || item.menuId,
          menuName: item.name || item.menuName,
          url: item.path ?? item.url,
          order: item.orderDisplay ?? item.order,
          indexNum: currentNumber,
        };
        if (newItem.children && newItem.children.length === 0) {
          delete newItem.children;
        } else if (newItem.children && newItem.children.length > 0) {
          newItem.children = cleanTreeData(newItem.children, currentNumber);
        }
        return newItem;
      });
  };

  const getAllKeys = (items) => {
    let keys = [];
    items.forEach((item) => {
      keys.push(item.menuId);
      if (item.children) {
        keys = keys.concat(getAllKeys(item.children));
      }
    });
    return keys;
  };

  const fetchMenus = async (force = false) => {
    setLoading(true);
    try {
      const menuList = await getMenus({ force, scope: "all" });
      const processedData = cleanTreeData(menuList);

      publishMenus(menuList, { scope: "all" });
      setData(processedData);
      setExpandedRowKeys(getAllKeys(processedData));
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: processedData.length,
      }));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu từ máy chủ:", error);
      toast.error("Lỗi khi tải dữ liệu từ máy chủ.");
      setData([]);
      setExpandedRowKeys([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return data;

    const filterTree = (items = []) =>
      items.reduce((result, item) => {
        const isMatched = [item.menuName, item.url, item.icon].some((value) =>
          String(value || "").toLowerCase().includes(keyword),
        );
        const matchedChildren = filterTree(item.children || []);
        if (isMatched || matchedChildren.length) {
          result.push({
            ...item,
            ...(matchedChildren.length ? { children: matchedChildren } : {}),
          });
        }
        return result;
      }, []);

    return filterTree(data);
  }, [data, searchText]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.menuName?.trim(),
        parentId: values.parentId || null,
        path: values.url?.trim() || null,
        icon: values.icon?.trim() || null,
        orderDisplay: Number(values.order) || 0,
      };

      setLoading(true);
      if (isEdit) {
        await putRequest(
          API_ENDPOINTS.MENU.UPDATE_BY_ID.replace("{id}", selectedId),
          payload,
        );
        toast.success("Cập nhật menu thành công!");
      } else {
        await postRequest(API_ENDPOINTS.MENU.CREATE, payload);
        toast.success("Thêm mới menu thành công!");
      }

      setIsModalOpen(false);
      setIsEdit(false);
      setSelectedId(null);
      form.resetFields();
      await fetchMenus(true);
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Lỗi khi lưu menu:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.msg ||
          (isEdit ? "Không thể cập nhật menu." : "Không thể thêm mới menu."),
      );
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setLoading(true);
    try {
      await deleteRequest(
        API_ENDPOINTS.MENU.DELETE_BY_ID.replace("{id}", selectedId),
      );
      toast.success("Xóa thành công!");
      setIsDelete(false);
      setSelectedId(null);
      await fetchMenus(true);
    } catch (error) {
      console.error("Failed to delete menu:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.msg ||
          "Không thể xóa menu.",
      );
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Stt",
      dataIndex: "indexNum",
      key: "indexNum",
      align: "center",
      width: 60,
      render: (text) => {
        const isParent = !text.includes(".");
        return (
          <span style={{ fontWeight: isParent ? "normal" : "normal" }}>
            {text}
          </span>
        );
      },
    },
    {
      title: "Tên menu",
      dataIndex: "menuName",
      key: "menuName",
      render: (text, record) => {
        const isParent = !record.indexNum?.includes(".");
        return (
          <span
            style={{
              fontWeight: isParent ? 600 : "normal",
              color: isParent ? "#1e293b" : "#475569",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {!isParent && <span style={{ marginRight: 8 }}>-</span>}
            {text}
          </span>
        );
      },
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      align: "center",
      width: 150,
      render: (iconString) => {
        if (!iconString) return null;
        return (
          <Space style={{ color: "#64748b", fontSize: "16px" }}>
            {getIconComponent(iconString)}
          </Space>
        );
      },
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (text) => <span style={{ color: "#64748b" }}>{text}</span>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <div className="flex flex-center">
          <Button
            type="text"
            icon={<SettingOutlined style={{ color: "#fa8c16" }} />}
            title="Cấu hình quyền"
            onClick={() =>
              navigate(
                `/permissions?menuId=${encodeURIComponent(record.menuId)}`,
              )
            }
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1677ff" }} />}
            onClick={() => {
              setIsEdit(true);
              setSelectedId(record.menuId);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
            className="btn-edit-table"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setSelectedId(record.menuId);
              setIsDelete(true);
            }}
            className="btn-remove-table"
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Danh sách Menu"
      searchPlaceholder="Tìm kiếm menu..."
      searchValue={searchText}
      onSearch={(value) => {
        setSearchText(value);
        setPagination((current) => ({ ...current, current: 1 }));
      }}
      actionButtons={[
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setIsEdit(false);
            form.resetFields();
            setIsModalOpen(true);
          }}
        >
          Thêm mới
        </Button>,
      ]}
      hideScroll={true}
    >
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="menuId"
        scroll={{ x: "max-content", y: "calc(100vh - 300px)" }}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredData.length,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bản ghi`,
        }}
        onChange={(newPagination) => setPagination(newPagination)}
        expandable={{
          expandedRowKeys: expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
          expandIcon: () => null, // comment lại nếu muốn hiển thị nút xổ xuống
        }}
      />

      <MenuForm
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setIsEdit(false);
          setSelectedId(null);
          form.resetFields();
        }}
        onSave={handleSave}
        form={form}
        isEdit={isEdit}
        menus={data}
      />
      <ModalConfirm
        open={isDelete}
        title="Xác nhận xóa Menu"
        content="Bạn có chắc chắn muốn xóa menu này?"
        okText="Đồng ý"
        cancelText="Hủy"
        onOk={handleDelete}
        onCancel={() => {
          setIsDelete(false);
          setSelectedId(null);
        }}
      />
    </PageContainer>
  );
};

export default MenuList;
