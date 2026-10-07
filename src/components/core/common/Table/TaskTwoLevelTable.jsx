import React, { useEffect, useMemo, useState } from "react";
import { Table } from "antd";

const TREE_INDENT_WIDTH = 22;
const TREE_CELL_PADDING_LEFT = 0;
const TREE_ICON_CENTER = TREE_INDENT_WIDTH / 2;
// Cho nét dọc phủ qua phần padding/chiều cao dư của hàng AntD để các task nối liền nhau.
const TREE_LINE_ROW_OVERLAP = 12;
const TASK_ROW_VERTICAL_PADDING = 6;
const TASK_ROW_MIN_HEIGHT = 40;

const getChildren = (record) => {
  const children = record?.children?.length
    ? record.children
    : record?.childs || record?.children;

  return Array.isArray(children) ? children : [];
};

const getRecordId = (record, rowKey) => record?.[rowKey] || record?.taskId;

const hasTaskChildren = (record) =>
  Number(record?.subtaskCount) > 0 || getChildren(record).length > 0;

const TaskTwoLevelTable = ({
  columns = [],
  dataSource = [],
  loading = false,
  rowKey = "id",
  showIndex = false,
  indexOffset = 0,
  onExpandRow,
  rowToExpand,
  onExpandedRowIdsChange,
  pagination = false,
  childColumns = [],
  childDataIndex = "attendance",
  childRowKey = "id",
  childPagination = false,
  childLoading = false,
  onChildPaginationChange,
  fixedIndexColumn = true,
  keepDetailRowOpen = false,
  detailExpandedRowKeys,
  ...tableProps
}) => {
  const [treeExpandedKeys, setTreeExpandedKeys] = useState([]);
  const activeDetailExpandedKeys = Array.isArray(detailExpandedRowKeys)
    ? detailExpandedRowKeys
    : [];

  const getChildPaginationConfig = (record) =>
    typeof childPagination === "function"
      ? childPagination(record)
      : childPagination;
  const getChildLoading = (record) =>
    typeof childLoading === "function" ? childLoading(record) : childLoading;

  // Chuẩn hóa dữ liệu cây và tạo STT dạng 1, 1.1, 1.2.
  const enrichedDataSource = useMemo(() => {
    const enrichData = (
      list = [],
      depth = 0,
      parentIndex = "",
      parentIsLastPath = [],
    ) => {
      const sortedList = [...list].sort((first, second) => {
        const firstRowCount = Number.isFinite(Number(first?.rowCount))
          ? Number(first.rowCount)
          : Number.MAX_SAFE_INTEGER;
        const secondRowCount = Number.isFinite(Number(second?.rowCount))
          ? Number(second.rowCount)
          : Number.MAX_SAFE_INTEGER;

        return firstRowCount - secondRowCount;
      });

      return sortedList.map((item, index) => {
        const isLast = index === sortedList.length - 1;
        const currentIsLastPath = [...parentIsLastPath, isLast];
        const currentIndex =
          depth === 0
            ? `${indexOffset + index + 1}`
            : `${parentIndex}.${index + 1}`;
        const sourceChildren = getChildren(item);
        const children = enrichData(
          sourceChildren,
          depth + 1,
          currentIndex,
          currentIsLastPath,
        );
        const recordId = getRecordId(item, rowKey);

        return {
          ...item,
          _tableKey: `${currentIndex}-${recordId || "row"}`,
          _detailKey: recordId,
          _depth: depth,
          _isLastPath: currentIsLastPath,
          _stt: currentIndex,
          childrenLoaded: item.childrenLoaded || sourceChildren.length > 0,
          children,
        };
      });
    };

    return enrichData(dataSource);
  }, [dataSource, indexOffset, rowKey]);

  // Làm phẳng các task đang mở để cây task không dùng expandedRowKeys của Antd.
  const visibleDataSource = useMemo(() => {
    const flatten = (items) =>
      items.reduce((result, item) => {
        result.push(item);

        if (
          item.children?.length &&
          treeExpandedKeys.includes(item._tableKey)
        ) {
          result.push(...flatten(item.children));
        }

        return result;
      }, []);

    return flatten(enrichedDataSource);
  }, [enrichedDataSource, treeExpandedKeys]);

  // Đồng bộ danh sách ID công việc đang mở ra bên ngoài.
  const updateExpandedKeys = (nextKeys, record, isExpanding) => {
    setTreeExpandedKeys(nextKeys);
    if (!onExpandedRowIdsChange || !record) return;

    const recordId = getRecordId(record, rowKey);
    if (!recordId) return;

    onExpandedRowIdsChange((current = []) => {
      if (isExpanding) {
        return current.includes(recordId) ? current : [...current, recordId];
      }

      return current.filter((id) => id !== recordId);
    });
  };

  // Mở hoặc đóng danh sách công việc con.
  const handleToggleTask = async (record) => {
    const isExpanded = treeExpandedKeys.includes(record._tableKey);

    if (isExpanded) {
      updateExpandedKeys(
        treeExpandedKeys.filter((key) => key !== record._tableKey),
        record,
        false,
      );
      return;
    }

    if (onExpandRow && !record.childrenLoaded && record.children.length === 0) {
      const loaded = await onExpandRow(record);
      if (!loaded) return;
    }

    updateExpandedKeys([...treeExpandedKeys, record._tableKey], record, true);
  };

  // Vẽ đường nối giữa công việc cha và công việc con.
  const renderTreeLines = (record, hasChildren, isExpanded) => {
    const depth = record._depth || 0;
    const isLastPath = record._isLastPath || [];

    if (depth === 0 && !(hasChildren && isExpanded)) return null;

    const lines = [];
    const iconCenterX = (currentDepth) =>
      TREE_CELL_PADDING_LEFT +
      currentDepth * TREE_INDENT_WIDTH +
      TREE_ICON_CENTER;

    for (let index = 0; index < depth; index += 1) {
      const left = iconCenterX(index);
      const isLast = isLastPath[index + 1];
      const isCurrentLevel = index === depth - 1;

      if (!isCurrentLevel && !isLast) {
        lines.push(
          <div
            key={`ancestor-${index}`}
            className="treetable-line-v"
            style={{
              left,
              top: -TREE_LINE_ROW_OVERLAP,
              bottom: -TREE_LINE_ROW_OVERLAP,
            }}
          />,
        );
      }

      if (isCurrentLevel) {
        const nextIndentLeft =
          TREE_CELL_PADDING_LEFT + (index + 1) * TREE_INDENT_WIDTH;

        lines.push(
          <div
            key={`current-v-${index}`}
            className="treetable-line-v"
            style={{
              left,
              top: -TREE_LINE_ROW_OVERLAP,
              bottom: isLast ? "50%" : -TREE_LINE_ROW_OVERLAP,
            }}
          />,
          <div
            key={`current-h-${index}`}
            className="treetable-line-h"
            style={{
              left,
              top: "50%",
              width: nextIndentLeft - left,
            }}
          />,
        );
      }
    }

    if (hasChildren && isExpanded) {
      const left = iconCenterX(depth);
      lines.push(
        <div
          key="parent-down"
          className="treetable-line-v"
          style={{
            left,
            top: "50%",
            bottom: -TREE_LINE_ROW_OVERLAP,
          }}
        />,
      );
    }

    return lines;
  };

  // Tìm task được truyền từ ngoài và mở toàn bộ cấp cha của task đó.
  useEffect(() => {
    const targetId = rowToExpand?.id;
    if (!targetId) return;

    const findExpandedPath = (
      items,
      parentIndex = "",
      depth = 0,
      parentKeys = [],
    ) => {
      const sortedItems = [...items].sort((first, second) => {
        const firstRowCount = Number(first?.rowCount);
        const secondRowCount = Number(second?.rowCount);

        return (
          (Number.isFinite(firstRowCount)
            ? firstRowCount
            : Number.MAX_SAFE_INTEGER) -
          (Number.isFinite(secondRowCount)
            ? secondRowCount
            : Number.MAX_SAFE_INTEGER)
        );
      });

      for (let index = 0; index < sortedItems.length; index += 1) {
        const item = sortedItems[index];
        const currentIndex =
          depth === 0
            ? `${indexOffset + index + 1}`
            : `${parentIndex}.${index + 1}`;
        const recordId = getRecordId(item, rowKey);
        const tableKey = `${currentIndex}-${recordId || "row"}`;

        if (`${recordId}` === `${targetId}`) {
          return [...parentKeys, tableKey];
        }

        const childPath = findExpandedPath(
          getChildren(item),
          currentIndex,
          depth + 1,
          [...parentKeys, tableKey],
        );
        if (childPath) return childPath;
      }

      return null;
    };

    const expandedPath = findExpandedPath(dataSource);
    if (!expandedPath) return;

    setTreeExpandedKeys((current) => [
      ...new Set([...current, ...expandedPath]),
    ]);

    onExpandedRowIdsChange?.((current = []) =>
      current.includes(targetId) ? current : [...current, targetId],
    );
  }, [dataSource, indexOffset, onExpandedRowIdsChange, rowKey, rowToExpand]);

  const indexColumn = showIndex
    ? [
        {
          title: "STT",
          key: "index",
          width: 60,
          align: "center",
          ...(fixedIndexColumn && { fixed: "left" }),
          render: (_, record) => record._stt,
        },
      ]
    : [];

  const maxDepth = useMemo(() => {
    const getMaxDepth = (items) =>
      items.reduce(
        (maximum, item) =>
          Math.max(maximum, item._depth || 0, getMaxDepth(item.children || [])),
        0,
      );

    return getMaxDepth(enrichedDataSource);
  }, [enrichedDataSource]);

  const firstDataColumnIndex = indexColumn.length;
  const hasCustomAttendanceAction = columns.some(
    (column) => column.key === "_attendanceAction",
  );
  const mappedColumns = [...indexColumn, ...columns].map(
    (column, columnIndex) => {
      const isFirstDataColumn = columnIndex === firstDataColumnIndex;
      if (!isFirstDataColumn) return column;

      const baseColumnWidth = Number(column.width) || 250;
      const minimumWidth = baseColumnWidth + maxDepth * TREE_INDENT_WIDTH;
      const originalRender = column.render;
      const originalOnCell = column.onCell;

      return {
        ...column,
        width: minimumWidth,
        onCell: (record, rowIndex) => {
          const originalCellProps = originalOnCell?.(record, rowIndex) || {};

          return {
            ...originalCellProps,
            className: [originalCellProps.className, "task-tree-name-cell"]
              .filter(Boolean)
              .join(" "),
            style: {
              ...originalCellProps.style,
              position: "relative",
              padding: 0,
              overflow: "visible",
            },
          };
        },
        render: (value, record, rowIndex) => {
          const content = originalRender
            ? originalRender(value, record, rowIndex)
            : value;
          const childCount =
            Number(record.subtaskCount) || record.children?.length || 0;
          const hasChildren = childCount > 0;
          const isExpanded = treeExpandedKeys.includes(record._tableKey);
          const indentWidth = (record._depth || 0) * TREE_INDENT_WIDTH;

          return (
            <div
              className="treetable-lines-wrapper"
              style={{
                // Icon và đường cây dùng chung wrapper làm mốc tọa độ.
                position: "relative",
                display: "flex",
                alignItems: "center",
                alignSelf: "stretch",
                width: "100%",
                height: "100%",
                minHeight: TASK_ROW_MIN_HEIGHT,
                boxSizing: "border-box",
                paddingTop: TASK_ROW_VERTICAL_PADDING,
                paddingRight: 16,
                paddingBottom: TASK_ROW_VERTICAL_PADDING,
                paddingLeft: indentWidth,
                overflow: "visible",
              }}
            >
              {renderTreeLines(record, hasChildren, isExpanded)}

              {hasChildren ? (
                <div
                  className="treetable-expand-icon-wrap"
                  style={{
                    position: "relative",
                    flex: `0 0 ${TREE_INDENT_WIDTH}px`,
                    width: TREE_INDENT_WIDTH,
                    height: 22,
                    margin: 0,
                    padding: 0,
                    overflow: "visible",
                  }}
                >
                  <button
                    type="button"
                    className="treetable-expand-button"
                    aria-label={
                      isExpanded ? "Thu gọn công việc" : "Mở rộng công việc"
                    }
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: TREE_ICON_CENTER,
                      width: 17,
                      height: 17,
                      minWidth: 17,
                      margin: 0,
                      padding: 0,
                      border: "1px solid #d0d5dd",
                      borderRadius: 6,
                      background: "#fdfdfd",
                      color: "#667085",
                      cursor: "pointer",
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleTask(record);
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 4.5,
                        right: 4.5,
                        height: 1,
                        borderRadius: 1,
                        background: "currentColor",
                        transform: "translateY(-50%)",
                      }}
                    />

                    {!isExpanded && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: 4.5,
                          bottom: 4.5,
                          left: "50%",
                          width: 1,
                          borderRadius: 1,
                          background: "currentColor",
                          transform: "translateX(-50%)",
                        }}
                      />
                    )}
                  </button>

                  {!isExpanded && (
                    <div className="treetable-expand-count">↳ {childCount}</div>
                  )}
                </div>
              ) : (
                <span
                  className="treetable-empty-spacer"
                  style={{
                    flex: "0 0 0",
                    width: 0,
                    margin: 0,
                  }}
                />
              )}

              <div className="task-name-text">{content}</div>
            </div>
          );
        },
      };
    },
  );

  // Chèn dòng bảng công ngay sau task đang mở, không dùng expandedRowRender.
  const tableDataSource = visibleDataSource.flatMap((record) => {
    const detailKey = record._detailKey || record._tableKey;
    const isDetailExpanded =
      activeDetailExpandedKeys.includes(detailKey) ||
      activeDetailExpandedKeys.includes(record._tableKey);

    if (
      (hasTaskChildren(record) && !hasCustomAttendanceAction) ||
      !isDetailExpanded
    ) {
      return [record];
    }

    const attendanceData = Array.isArray(record?.[childDataIndex])
      ? record[childDataIndex]
      : [];
    if (!attendanceData.length && !keepDetailRowOpen) {
      return [record];
    }

    return [
      record,
      {
        _tableKey: `${record._tableKey}-attendance-detail`,
        _isAttendanceDetail: true,
        _attendanceData: attendanceData,
        _parentRecord: record,
      },
    ];
  });

  // Gộp toàn bộ cột ở dòng chi tiết để render một bảng công duy nhất.
  const displayColumns = mappedColumns.map((column, columnIndex) => {
    const originalRender = column.render;
    const originalOnCell = column.onCell;
    const isFirstColumn = columnIndex === 0;

    return {
      ...column,
      onCell: (record, rowIndex) => {
        if (record._isAttendanceDetail) {
          return isFirstColumn
            ? {
                colSpan: mappedColumns.length,
                className: "task-attendance-detail-cell",
                style: { padding: 0 },
              }
            : { colSpan: 0 };
        }

        const cellProps = originalOnCell?.(record, rowIndex) || {};

        if (isFirstColumn) return cellProps;

        return {
          ...cellProps,
          style: {
            ...cellProps.style,
            paddingTop: TASK_ROW_VERTICAL_PADDING,
            paddingBottom: TASK_ROW_VERTICAL_PADDING,
          },
        };
      },
      render: (value, record, rowIndex) => {
        if (record._isAttendanceDetail) {
          if (!isFirstColumn) return null;

          const childPaginationConfig = getChildPaginationConfig(
            record._parentRecord,
          );
          const originalChildPaginationChange =
            childPaginationConfig && childPaginationConfig.onChange;
          const resolvedChildPagination =
            childPaginationConfig === false
              ? false
              : {
                  size: "small",
                  ...(childPaginationConfig || {}),
                  onChange: (page, pageSize) => {
                    originalChildPaginationChange?.(page, pageSize);
                    onChildPaginationChange?.(record._parentRecord, {
                      current: page,
                      pageSize,
                    });
                  },
                };

          const childDataSource = record._attendanceData.map((item, index) => ({
            ...item,
            _parentStt: record._parentRecord?._stt,
            _childStt: record._parentRecord?._stt
              ? `${record._parentRecord._stt}.${index + 1}`
              : `${index + 1}`,
          }));

          return (
            <div className="task-child-table-wrapper">
              <Table
                className="task-child-table"
                rowKey={(item) =>
                  item?.[childRowKey] ??
                  item?.id ??
                  item?.logId ??
                  item?.taskLogId ??
                  item?.timeLogId ??
                  item?.attendanceId
                }
                columns={childColumns}
                dataSource={record._attendanceData}
                // dataSource={childDataSource}
                loading={getChildLoading(record._parentRecord)}
                pagination={
                  record._attendanceData?.length > 10
                    ? resolvedChildPagination
                    : false
                }
                size="small"
                bordered
                tableLayout="auto"
              />
            </div>
          );
        }

        return originalRender ? originalRender(value, record, rowIndex) : value;
      },
    };
  });

  return (
    <div className="tree-table-container task-two-level-table">
      <Table
        rowClassName={(record) =>
          record._isAttendanceDetail
            ? "task-expanded-row task-attendance-detail-row"
            : "treetable-row"
        }
        dataSource={tableDataSource}
        columns={displayColumns}
        rowKey={(record) => record._tableKey}
        loading={loading}
        indentSize={0}
        expandable={{
          childrenColumnName: "__disabledTaskChildren",
          expandIcon: () => null,
          expandIconColumnIndex: -1,
        }}
        pagination={pagination}
        {...tableProps}
      />
    </div>
  );
};

export default TaskTwoLevelTable;
