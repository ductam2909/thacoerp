import React, { useMemo } from "react";
import {
  Table as AntdTable,
  Input as AntdInput,
  Row,
  Col,
  Space,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  FilterFilled,
} from "@ant-design/icons";
import Button from "../Button";
import AsyncFilterDropdown from "./components/AsyncFilterDropdown";
import MultiSelectFilterDropdown from "../Select/MultiSelectFilterDropdown";

export const buildTableQueryParams = (columns, filters, sorter) => {
  const filterParts = [];

  if (filters) {
    Object.keys(filters).forEach((key) => {
      const values = filters[key];

      if (!values || !values.length) return;

      const col = columns?.find(
        (c) => c.key === key || c.dataIndex === key,
      );

      if (col && col.filterConfig) {
        if (col.filterConfig.buildFilter) {
          const customFilter =
            col.filterConfig.buildFilter(values);

          if (customFilter) {
            filterParts.push(customFilter);
          }
        } else if (col.filterConfig.filterKey) {
          const field = col.filterConfig.filterKey;

          if (values.length === 1) {
            filterParts.push(`${field}:eq:${values[0]}`);
          } else {
            filterParts.push(
              `${field}:in:(${values.join(",")})`,
            );
          }
        }
      }
    });
  }

  let sortQuery = "";

  if (sorter) {
    const sorterList = Array.isArray(sorter)
      ? sorter
      : [sorter];

    const validSorters = sorterList.filter(
      (item) => item?.order && item?.field,
    );

    if (validSorters.length) {
      sortQuery = validSorters
        .map((item) => {
          const col = columns?.find(
            (c) =>
              c.key === item.field ||
              c.dataIndex === item.field,
          );

          const sortField =
            col?.sortConfig?.sortKey || item.field;

          return `${sortField}:${item.order === "ascend" ? "ASC" : "DESC"
            }`;
        })
        .join(",");
    }
  }

  return {
    filterQuery: filterParts.join(","),
    sortQuery,
  };
};

// Lấy key dùng chung để xác định cột.
export const getTableColumnKey = (column, index) => {
  if (
    column?.key !== undefined &&
    column?.key !== null
  ) {
    return String(column.key);
  }

  if (Array.isArray(column?.dataIndex)) {
    return column.dataIndex.join(".");
  }

  if (
    column?.dataIndex !== undefined &&
    column?.dataIndex !== null
  ) {
    return String(column.dataIndex);
  }

  return `column-${index}`;
};

// Lấy toàn bộ key cột để khởi tạo danh sách hiển thị.
export const getAllTableColumnKeys = (columns = []) => {
  return columns.map((column, index) =>
    getTableColumnKey(column, index),
  );
};

const Table = ({
  columns,
  dataSource,
  loading,
  pagination,
  rowKey = "id",
  title,
  searchPlaceholder,
  onSearch,
  onAdd,
  onReload,
  extraButtons,
  scroll,
  containerClassName = "",
  onChange,

  // Chỉ thêm mới: danh sách key các cột được hiển thị.
  visibleColumnKeys,

  ...rest
}) => {
  const enhancedColumns = useMemo(() => {
    const normalizedVisibleColumnKeys =
      visibleColumnKeys?.map(String);

    return columns
      ?.filter((col, index) => {
        // Cột hideable=false luôn được hiển thị.
        if (col.hideable === false) {
          return true;
        }

        // Không truyền visibleColumnKeys thì giữ nguyên logic cũ.
        if (!normalizedVisibleColumnKeys) {
          return true;
        }

        const columnKey = getTableColumnKey(col, index);

        return normalizedVisibleColumnKeys.includes(columnKey);
      })
      .map((col) => {
        if (col.filterConfig) {
          const {
            type,
            fetchOptions,
            options,
            width,
            filterIconColor = "#77cdec",
          } = col.filterConfig;

          if (
            type === "multiSelect" ||
            type === "select"
          ) {
            return {
              ...col,
              filterDropdown: (props) => {
                if (fetchOptions) {
                  return (
                    <AsyncFilterDropdown
                      {...props}
                      fetchOptions={fetchOptions}
                      width={width}
                    />
                  );
                }

                if (options) {
                  return (
                    <MultiSelectFilterDropdown
                      {...props}
                      options={options}
                      width={width}
                    />
                  );
                }

                return null;
              },
              filterIcon: (filtered) => (
                <FilterFilled
                  style={{
                    color: filtered
                      ? filterIconColor
                      : "#fff",
                  }}
                />
              ),
            };
          }
        }

        return col;
      });
  }, [columns, visibleColumnKeys]);

  const handleTableChange = (
    paginationInfo,
    filters,
    sorter,
    extra,
  ) => {
    const { filterQuery, sortQuery } =
      buildTableQueryParams(
        columns,
        filters,
        sorter,
      );

    if (onChange) {
      onChange(paginationInfo, filters, sorter, {
        ...extra,
        filterQuery,
        sortQuery,
      });
    }
  };

  return (
    <div
      className={`app-table-container ${containerClassName}`.trim()}
    >
      {(title || onSearch || onAdd || onReload) && (
        <Row
          justify="space-between"
          align="middle"
          style={{
            marginBottom: 16,
            rowGap: 16,
          }}
        >
          <Col xs={24} sm={12}>
            <Space size="middle" wrap>
              {title && (
                <h3 style={{ margin: 0 }}>{title}</h3>
              )}

              {onSearch && (
                <AntdInput
                  placeholder={
                    searchPlaceholder || "Tìm kiếm..."
                  }
                  prefix={<SearchOutlined />}
                  onChange={(e) =>
                    onSearch(e.target.value)
                  }
                  style={{
                    width: "100%",
                    maxWidth: 250,
                  }}
                  allowClear
                />
              )}
            </Space>
          </Col>

          <Col
            xs={24}
            sm={12}
            style={{ textAlign: "right" }}
          >
            <Space wrap>
              {onReload && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onReload}
                >
                  Làm mới
                </Button>
              )}

              {extraButtons}

              {onAdd && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={onAdd}
                >
                  Thêm mới
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      )}

      <AntdTable
        scroll={
          dataSource?.length > 0
            ? {
              x: "max-content",
              ...(scroll || {}),
            }
            : undefined
        }
        columns={enhancedColumns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={
          pagination !== false
            ? {
              showSizeChanger: true,
              pageSizeOptions: [
                "20",
                "50",
                "100",
                "200",
              ],
              position: ["bottomRight"],
              current: 1,
              pageSize: 50,
              total: dataSource?.length || 0,
              ...(pagination || {}),
            }
            : false
        }
        onChange={handleTableChange}
        {...rest}
      />
    </div>
  );
};

export default Table;