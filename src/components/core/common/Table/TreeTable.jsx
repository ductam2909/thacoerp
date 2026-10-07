import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Table,
  Input,
  InputNumber,
  Form,
  Button,
  Select,
  Tooltip,
  DatePicker,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import ModalConfirm from "../ModalConfirm";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
dayjs.extend(customParseFormat);

const TreetableContext = React.createContext(null);
const TREE_INDENT_WIDTH = 22;
const TREE_CELL_PADDING_LEFT = 12;
const TREE_ICON_CENTER = 8;

const SortableTreetableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  const rowId = String(props["data-row-key"] ?? `table-row-${index}`);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });
  return (
    <Form form={form} component={false}>
      <TreetableContext.Provider value={form}>
        <tr
          {...props}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          style={{
            ...props.style,
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : undefined,
            cursor: "grab",
            touchAction: "none",
          }}
        />
      </TreetableContext.Provider>
    </Form>
  );
};

const Treetable = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  type, // 'text', 'number', 'select'
  options,
  required = false,
  rowActions,
  isSubtask,
  treeLineConfig,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const editingRef = useRef(false);
  const inputRef = useRef(null);
  const form = useContext(TreetableContext);

  useEffect(() => {
    if (editing) {
      if (type === "select") {
        // Select auto focus
      } else {
        inputRef.current?.focus();
      }
    }
  }, [editing, type]);

  const toggleEdit = () => {
    const newEditing = !editing;
    setEditing(newEditing);
    editingRef.current = newEditing;
    if (!newEditing) {
      form.setFieldsValue({
        [dataIndex]: record[dataIndex],
      });
    }
  };

  const save = async () => {
    try {
      if (!editingRef.current) return;
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };

  const handleSelectChange = async (value) => {
    try {
      form.setFieldsValue({ [dataIndex]: value });
      if (!editingRef.current) return;
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (err) {
      console.log(err);
    }
  };

  let prefix = null;
  let actualContent = children;

  if (Array.isArray(children)) {
    if (children.length > 1) {
      prefix = children.slice(0, -1);
      actualContent = children[children.length - 1];
    } else if (children.length === 1) {
      actualContent = children[0];
    }
  }

  let childNode = children;

  if (editable) {
    childNode = (
      <div className="treetable-cell-inner">
        {prefix}
        {editing ? (
          <Form.Item
            className="treetable-editing-wrap"
            name={dataIndex}
            rules={[
              {
                required: required,
                message: `Vui lòng nhập ${title?.toLowerCase()}`,
              },
            ]}
            getValueProps={(i) => ({
              value:
                type === "date" && i && typeof i === "string"
                  ? dayjs(i, "DD/MM/YYYY")
                  : i,
            })}
            normalize={(value) =>
              type === "date" && value
                ? dayjs.isDayjs(value)
                  ? value.format("DD/MM/YYYY")
                  : value
                : value
            }
          >
            {type === "number" ? (
              <InputNumber
                ref={inputRef}
                onPressEnter={save}
                onBlur={save}
                style={{ width: "100%" }}
              />
            ) : type === "select" ? (
              <Select
                ref={inputRef}
                onChange={handleSelectChange}
                onBlur={save}
                options={options}
                style={{ width: "100%" }}
                autoFocus={true}
                defaultOpen={true}
              />
            ) : type === "date" ? (
              <DatePicker
                ref={inputRef}
                onChange={(date, dateString) => handleSelectChange(dateString)}
                onOpenChange={(open) => {
                  if (!open) save();
                }}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                autoFocus={true}
                defaultOpen={true}
              />
            ) : (
              <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            )}
          </Form.Item>
        ) : (
          <div
            className="treetable-cell-value-wrap"
            onClick={toggleEdit}
            style={{ flex: 1, minWidth: 0 }}
          >
            {actualContent || (
              <span className="treetable-cell-placeholder">
                Nhập {title?.toLowerCase()}...
              </span>
            )}
          </div>
        )}
        {rowActions && !editing && (
          <div className="task-name-actions" style={{ marginLeft: 8 }}>
            {rowActions}
          </div>
        )}
      </div>
    );
  } else {
    // Dành cho các cột không editable nhưng có expandIcon (ví dụ cột đầu tiên)
    if (rowActions || isSubtask) {
      childNode = (
        <div className="treetable-cell-inner">
          {prefix}
          <div
            className="treetable-first-col-wrap"
            style={{ flex: 1, minWidth: 0 }}
          >
            {actualContent}
          </div>
          {rowActions && (
            <div className="task-name-actions" style={{ marginLeft: 8 }}>
              {rowActions}
            </div>
          )}
        </div>
      );
    }
  }

  // Render các đường nối cây trong một wrapper kéo dài hết chiều cao cell
  const renderTreeLines = () => {
    if (!treeLineConfig) return null;
    const { depth, isLastPath, hasChildren, isExpanded } = treeLineConfig;
    if (depth === 0 && !(hasChildren && isExpanded)) return null;
    const lines = [];
    const LINE_COLOR = "#c0c5cc";

    // Tính toán tọa độ X để khớp với tâm của icon expand ở mỗi cấp
    const iconCenterX = (d) =>
      TREE_CELL_PADDING_LEFT + d * TREE_INDENT_WIDTH + TREE_ICON_CENTER;

    // Vẽ các đường nối cho từng cấp subtask
    for (let i = 0; i < depth; i++) {
      const x = iconCenterX(i);
      const isLast = isLastPath[i + 1];
      const isCurrentLevel = i === depth - 1;

      if (!isCurrentLevel) {
        // Cấp tổ tiên: đường dọc đứt nét liên tục nếu không phải node cuối cùng
        if (!isLast) {
          lines.push(
            <div
              key={`av-${i}`}
              className="treetable-line-v"
              style={{ left: x, top: 0, bottom: 0 }}
            />,
          );
        }
      } else {
        // Cấp hiện tại: đường dọc đứt nét + đường ngang đứt nét nối vào node
        lines.push(
          <div
            key={`cv-${i}`}
            className="treetable-line-v"
            style={{ left: x, top: 0, bottom: isLast ? "50%" : 0 }}
          />,
        );
        // Đường ngang đứt nét từ tâm icon cha nối vào vùng nội dung của node con
        const nextIconLeft =
          TREE_CELL_PADDING_LEFT + (i + 1) * TREE_INDENT_WIDTH;
        const hWidth = nextIconLeft - x;
        lines.push(
          <div
            key={`ch-${i}`}
            className="treetable-line-h"
            style={{ left: x, top: "50%", width: hWidth }}
          />,
        );
      }
    }

    // Đường đi xuống từ node cha: kẻ từ tâm icon expand đi xuống dưới
    if (hasChildren && isExpanded) {
      const x = iconCenterX(depth);
      lines.push(
        <div
          key="parent-down"
          className="treetable-line-v"
          style={{ left: x, top: "50%", bottom: 0 }}
        />,
      );
    }

    return lines;
  };

  return (
    <td {...restProps} style={{ ...restProps.style, position: "relative" }}>
      {treeLineConfig ? (
        <div className="treetable-lines-wrapper">
          {renderTreeLines()}
          {childNode}
        </div>
      ) : (
        childNode
      )}
    </td>
  );
};

// Recursive helpers
const updateTreeData = (list, key, row, rowKey) => {
  return list.map((node) => {
    if (node[rowKey] === key) {
      return { ...node, ...row };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, row, rowKey),
      };
    }
    return node;
  });
};

const deleteTreeData = (list, key, rowKey) => {
  return list
    .filter((node) => node[rowKey] !== key)
    .map((node) => {
      if (node.children) {
        return {
          ...node,
          children: deleteTreeData(node.children, key, rowKey),
        };
      }
      return node;
    });
};

const addSubtaskTreeData = (list, parentKey, newSubtask, rowKey) => {
  return list.map((node) => {
    if (node[rowKey] === parentKey) {
      return {
        ...node,
        children: [...(node.children || []), newSubtask],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addSubtaskTreeData(
          node.children,
          parentKey,
          newSubtask,
          rowKey,
        ),
      };
    }
    return node;
  });
};

const TreeTable = ({
  columns,
  dataSource,
  setDataSource,
  loading,
  rowKey = "id",
  showIndex = false,
  indexOffset = 0,
  allowAddSubtask = false,
  onRowSave,
  onRowDelete,
  onAddRow,
  onRowOpen,
  openModal,
  setOpenModal,
  onAddSubtask,
  onExpandRow,
  rowToExpand,
  onExpandedRowIdsChange,
  addBtnText = "Thêm công việc (Task) mới...",
  pagination,
  isEditable = true,
  onRowDragEnd,
  onRowOrderChange,
  ...rest
}) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const getRecordId = (record) => record?.[rowKey] || record?.taskId;

  const updateExpandedKeys = (nextKeys, record, isExpanding) => {
    setExpandedKeys(nextKeys);
    if (!onExpandedRowIdsChange || !record) return;

    const recordId = getRecordId(record);
    if (!recordId) return;

    onExpandedRowIdsChange((current = []) => {
      if (isExpanding) {
        return current.includes(recordId) ? current : [...current, recordId];
      }
      return current.filter((id) => id !== recordId);
    });
  };

  const handleSave = (row) => {
    const newData = updateTreeData(dataSource, row[rowKey], row, rowKey);
    setDataSource(newData);
    if (onRowSave && !row.isNew) onRowSave(row);
  };

  const handleDelete = (key) => {
    const newData = deleteTreeData(dataSource, key, rowKey);
    setDataSource(newData);
    if (onRowDelete) onRowDelete(key);
  };

  const handleAddSubtask = (parentKey) => {
    const newKey = `temp_sub_${Date.now()}`;
    const newSubtask = { [rowKey]: newKey, isNew: true };
    const newData = addSubtaskTreeData(
      dataSource,
      parentKey,
      newSubtask,
      rowKey,
    );
    setDataSource(newData);

    if (!expandedKeys.includes(parentKey)) {
      setExpandedKeys((prev) => [...prev, parentKey]);
    }
  };

  const handleConfirmRow = (row) => {
    const updatedRow = { ...row, isNew: false };
    const newData = updateTreeData(dataSource, row[rowKey], updatedRow, rowKey);
    setDataSource(newData);
    if (onRowSave) onRowSave(updatedRow);
  };

  const handleAdd = () => {
    if (onAddRow) {
      onAddRow();
    } else {
      const newKey = `temp_${Date.now()}`;
      setDataSource([...dataSource, { [rowKey]: newKey, isNew: true }]);
    }
  };

  // xử lý hiển thị Row
  const reorderRows = (activeId, overId) => {
    // Tìm task đang kéo và task đích
    const activeRecord = visibleRows.find(
      (record) => `${record._tableKey}` === `${activeId}`,
    );
    const overRecord = visibleRows.find(
      (record) => `${record._tableKey}` === `${overId}`,
    );
    const activeRecordId = activeRecord?.[rowKey] || activeRecord?.taskId;
    const overRecordId = overRecord?.[rowKey] || overRecord?.taskId;

    // Tìm và di chuyển task (cha hoặc con)
    const findAndMove = (list, parentRecord = null, depth = 0) => {
      const fromIndex = list.findIndex(
        (row) => `${row[rowKey] || row.taskId}` === `${activeRecordId}`,
      );
      const toIndex = list.findIndex(
        (row) => `${row[rowKey] || row.taskId}` === `${overRecordId}`,
      );
      // Đổi vị trí trong cùng một danh sách
      // depth = 0: task cha
      // depth > 0: task con
      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        const next = [...list];
        const [movedRow] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, movedRow);
        return { rows: next, parentRecord, depth };
      }
      // Duyệt xuống children để tìm task con
      for (let index = 0; index < list.length; index += 1) {
        const children = list[index].children || list[index].childs;
        if (Array.isArray(children)) {
          const movedChildren = findAndMove(children, list[index], depth + 1);
          if (movedChildren) {
            return {
              ...movedChildren,
              rows: list.map((row, rowIndex) =>
                rowIndex === index
                  ? { ...row, children: movedChildren.rows }
                  : row,
              ),
            };
          }
        }
      }
      return null;
    };

    // Bắt đầu từ danh sách task cha
    const moveResult = findAndMove(dataSource || []);
    if (!moveResult) return;
    const nextRows = moveResult.rows;
    const rows = dataSource || [];
    const changedRows = [];
    // Đánh lại rowCount sau khi sắp xếp
    const assignRowCounts = (list, depth = 0, parentTaskId = null) =>
      list.map((row, index) => {
        const rowCount = depth > 0 ? index + 1 : indexOffset + index + 1;
        const taskId = row[rowKey] || row.taskId;

        const children = row.children || row.childs;
        const nextRow = { ...row, rowCount };
        if (Array.isArray(children) && children.length) {
          nextRow.children = assignRowCounts(children, depth + 1, taskId);
          if (row.childs) delete nextRow.childs;
        }
        changedRows.push({ taskId, rowCount, parentTaskId, depth });
        return nextRow;
      });
    const nextRowsWithRowCount = assignRowCounts(nextRows);
    setDataSource(nextRowsWithRowCount);

    const oldRowCounts = new Map();
    const collectOldRowCounts = (list = []) =>
      list.forEach((row) => {
        const id = row[rowKey] || row.taskId;
        if (id) oldRowCounts.set(id, row.rowCount);
        const children = row.children || row.childs;
        if (Array.isArray(children)) collectOldRowCounts(children);
      });
    collectOldRowCounts(rows);
    const parentRecordId =
      moveResult.parentRecord?.[rowKey] || moveResult.parentRecord?.taskId;
    // Chỉ cập nhật các task bị thay đổi
    const rowsToUpdate = changedRows
      .filter((item) => item.taskId)
      .filter((item) =>
        moveResult.depth > 0
          ? item.depth === moveResult.depth &&
            item.parentTaskId === parentRecordId
          : item.depth === 0,
      )
      .filter(
        (item) => `${oldRowCounts.get(item.taskId)}` !== `${item.rowCount}`,
      )
      .map(({ taskId, rowCount }) => ({ taskId, rowCount }));
    onRowOrderChange?.(rowsToUpdate, {
      isSubtask: moveResult.depth > 0,
      parentTaskId: parentRecordId,
      parentRecord: moveResult.parentRecord,
    });
    onRowDragEnd?.(activeRecord, overRecord, rowsToUpdate);
  };

  // 1. Chèn dòng "Thêm nhanh" giả vào children của cấp 1
  const enrichData = (
    list = [],
    depth = 0,
    parentIndex = "",
    parentIsLastPath = [],
  ) => {
    // Sắp xếp danh sách theo rowCount tăng dần.
    // Các phần tử không có rowCount hợp lệ sẽ được đưa xuống cuối danh sách.
    const sortedList = [...list].sort((a, b) => {
      const aRowCount = Number.isFinite(Number(a?.rowCount))
        ? Number(a.rowCount)
        : Number.MAX_SAFE_INTEGER;
      const bRowCount = Number.isFinite(Number(b?.rowCount))
        ? Number(b.rowCount)
        : Number.MAX_SAFE_INTEGER;

      return aRowCount - bRowCount;
    });

    return sortedList.map((item, index) => {
      const isLast = index === list.length - 1;
      const currentIsLastPath = [...parentIsLastPath, isLast];
      const currentIndex =
        depth === 0
          ? `${indexOffset + index + 1}`
          : `${parentIndex}.${index + 1}`;
      const childData = item.children?.length
        ? item.children
        : item.childs || item.children || [];
      const sourceChildren = Array.isArray(childData) ? childData : [];
      const realChildren = enrichData(
        sourceChildren,
        depth + 1,
        currentIndex,
        currentIsLastPath,
      );
      const enrichedChildren = [...realChildren];

      return {
        // trả ra các trường của row, không có dữ liệu childern = []
        ...item,
        // React key riêng theo vị trí trong cây, không phụ thuộc API có trả id hay không.
        _tableKey: `${currentIndex}-${item[rowKey] || item.taskId || "row"}`,
        subtask: depth > 0,
        _depth: depth,
        _isLastPath: currentIsLastPath,
        _stt: currentIndex,
        childrenLoaded: item.childrenLoaded || sourceChildren.length > 0,
        children: enrichedChildren.length > 0 ? enrichedChildren : [],
      };
    });
  };

  const enrichedDataSource = enrichData(dataSource || []);

  const visibleRows = React.useMemo(() => {
    const flatten = (items) =>
      items.reduce((result, item) => {
        result.push(item);
        if (item.children?.length && expandedKeys.includes(item._tableKey)) {
          result.push(...flatten(item.children));
        }
        return result;
      }, []);
    return flatten(enrichedDataSource);
  }, [enrichedDataSource, expandedKeys]);

  useEffect(() => {
    const targetId = rowToExpand?.id;
    if (!targetId) return;

    const findTableKey = (items, parentIndex = "", depth = 0) => {
      const sortedItems = [...items].sort((a, b) => {
        const aRowCount = Number.isFinite(Number(a?.rowCount))
          ? Number(a.rowCount)
          : Number.MAX_SAFE_INTEGER;
        const bRowCount = Number.isFinite(Number(b?.rowCount))
          ? Number(b.rowCount)
          : Number.MAX_SAFE_INTEGER;

        return aRowCount - bRowCount;
      });

      for (let index = 0; index < sortedItems.length; index += 1) {
        const item = sortedItems[index];
        const currentIndex =
          depth === 0
            ? `${indexOffset + index + 1}`
            : `${parentIndex}.${index + 1}`;

        if ((item[rowKey] || item.taskId) === targetId) {
          return `${currentIndex}-${item[rowKey] || item.taskId || "row"}`;
        }

        const childData = item.children?.length
          ? item.children
          : item.childs || item.children || [];
        const children = Array.isArray(childData) ? childData : [];
        const childKey = findTableKey(children, currentIndex, depth + 1);
        if (childKey) return childKey;
      }
      return null;
    };

    const tableKey = findTableKey(dataSource || []);
    if (tableKey) {
      setExpandedKeys((current) =>
        current.includes(tableKey) ? current : [...current, tableKey],
      );
      if (onExpandedRowIdsChange) {
        onExpandedRowIdsChange((current = []) =>
          current.includes(targetId) ? current : [...current, targetId],
        );
      }
    }
  }, [rowToExpand, dataSource, rowKey, indexOffset, onExpandedRowIdsChange]);

  const expandColumn = [];
  const indexColumn = showIndex
    ? [
        {
          title: "Stt",
          key: "index",
          width: 60,
          align: "center",
          fixed: "left",
          render: (_, record) => record._stt,
          onCell: (record) => {
            // Ẩn đường kẻ ngang ở cột STT cho các dòng subtask
            if (record._depth > 0) {
              return { style: { borderBottom: "none" } };
            }
            return {};
          },
        },
      ]
    : [];

  const defaultColumns = [...expandColumn, ...indexColumn, ...columns];

  const firstDataColIndex = expandColumn.length + indexColumn.length;

  let maxDepth = 0;
  const calculateMaxDepth = (list, currentDepth = 0) => {
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    if (list && Array.isArray(list)) {
      list.forEach((item) => {
        // Chỉ đếm chiều sâu của các node con nếu node hiện tại đang được mở (expand)
        if (
          item.children &&
          item.children.length > 0 &&
          expandedKeys.includes(item._tableKey)
        ) {
          calculateMaxDepth(item.children, currentDepth + 1);
        }
      });
    }
  };
  calculateMaxDepth(enrichedDataSource);

  // 2. Map Columns để xử lý render và colSpan cho dòng giả
  const mappedColumns = defaultColumns.map((col, index) => {
    const isFirstCol = index === firstDataColIndex;
    const originalRender = col.render;

    let finalCol = { ...col };
    if (isFirstCol) {
      const calculatedMinWidth = 250 + maxDepth * TREE_INDENT_WIDTH;
      if (finalCol.width) {
        finalCol.width = Math.max(
          parseInt(finalCol.width) || 0,
          calculatedMinWidth,
        );
      } else {
        finalCol.width = calculatedMinWidth;
      }
    }

    return {
      ...finalCol,
      render: (text, record, rowIndex) => {
        let childNode = originalRender
          ? originalRender(text, record, rowIndex)
          : text;

        if (isFirstCol) {
          const depth = record._depth || 0;
          const childCount =
            Number(record.subtaskCount) || record.children?.length || 0;
          const hasChildren = childCount > 0;
          const isExpanded = expandedKeys.includes(record._tableKey);
          const indentWidth = depth * TREE_INDENT_WIDTH;

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: indentWidth,
              }}
            >
              {/* Expand/collapse icon */}
              {hasChildren ? (
                <div className="treetable-expand-icon-wrap">
                  <span
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (isExpanded) {
                        updateExpandedKeys(
                          expandedKeys.filter((k) => k !== record._tableKey),
                          record,
                          false,
                        );
                      } else {
                        if (
                          onExpandRow &&
                          !record.childrenLoaded &&
                          record.children.length === 0
                        ) {
                          const loaded = await onExpandRow(record);
                          if (!loaded) return;
                        }
                        updateExpandedKeys(
                          [...expandedKeys, record._tableKey],
                          record,
                          true,
                        );
                      }
                    }}
                    className={`ant-table-row-expand-icon ${isExpanded ? "ant-table-row-expand-icon-expanded" : "ant-table-row-expand-icon-collapsed"}`}
                    style={{ margin: 0, cursor: "pointer" }}
                  />
                  {!isExpanded && (
                    <div className="treetable-expand-count">↳ {childCount}</div>
                  )}
                </div>
              ) : (
                <span className="treetable-empty-spacer" />
              )}
              {/* Content */}
              <div className="task-name-text">{childNode}</div>
            </div>
          );
        }

        return childNode;
      },
      onCell: (record) => {
        let rowActions = null;
        if (isFirstCol) {
          rowActions = (
            <>
              {/* {onRowOpen && (
                <Tooltip title="Mở ở bên">
                  <Button
                    size="small"
                    className="task-action-btn btn-open"
                    onClick={(e) => { e.stopPropagation(); onRowOpen(record); }}
                    icon={<ExpandAltOutlined />}
                  >
                    Mở
                  </Button>
                </Tooltip>
              )} */}
              {allowAddSubtask && (
                <Tooltip title="Thêm mới công việc con">
                  <Button
                    type="text"
                    size="small"
                    className="task-action-btn btn-add"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddSubtask) {
                        onAddSubtask(record);
                        // handleAddSubtask(record[rowKey]);
                      } else {
                        setOpenModal(true);
                      }
                    }}
                    icon={<PlusOutlined />}
                  />
                </Tooltip>
              )}
            </>
          );
        }

        const depth = record._depth || 0;
        const hasChildren = record.children && record.children.length > 0;
        const isExpanded = expandedKeys.includes(record._tableKey);

        return {
          record,
          className: isFirstCol ? "app-first-data-col" : "",
          editable: isEditable && col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          type: col.type || "text",
          options: col.options,
          required: col.required,
          handleSave,
          rowActions,
          isSubtask: record.subtask && isFirstCol,
          treeLineConfig:
            isFirstCol && allowAddSubtask
              ? {
                  depth,
                  isLastPath: record._isLastPath || [],
                  hasChildren,
                  isExpanded,
                }
              : undefined,
        };
      },
    };
  });

  const components = React.useMemo(
    () => ({
      body: {
        row: SortableTreetableRow,
        cell: Treetable,
      },
    }),
    [],
  );

  const expandableProps = allowAddSubtask
    ? {
        expandedRowKeys: expandedKeys,
        onExpandedRowsChange: setExpandedKeys,
        expandIcon: () => null,
        expandIconColumnIndex: -1,
      }
    : undefined;

  return (
    <div className="tree-table-container">
      <DndContext
        sensors={sensors}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) {
            reorderRows(String(active.id), String(over.id));
          }
        }}
      >
        <SortableContext
          items={visibleRows.map((record) => String(record._tableKey))}
          strategy={verticalListSortingStrategy}
        >
          <Table
            components={components}
            rowClassName={() => "treetable-row"}
            // bordered={false}
            dataSource={enrichedDataSource}
            columns={mappedColumns}
            rowKey={(record) => record._tableKey}
            loading={loading}
            indentSize={0}
            expandable={expandableProps}
            pagination={pagination}
            {...rest}
          />
        </SortableContext>
      </DndContext>
      {/* <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9',
          padding: '4px 12px',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div
          className="treetable-add-btn"
          onClick={handleAdd}
          style={{ color: '#1677ff', background: 'transparent', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <PlusOutlined style={{ marginRight: 8 }} /> {addBtnText}
        </div>
      </div> */}

      <ModalConfirm
        open={deleteModalOpen}
        title="Xác nhận xóa"
        content="Bạn có chắc chắn muốn xóa công việc này?"
        okText="Đồng ý"
        cancelText="Hủy"
        onOk={() => {
          if (rowToDelete) {
            handleDelete(rowToDelete[rowKey]);
            setDeleteModalOpen(false);
            setRowToDelete(null);
          }
        }}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRowToDelete(null);
        }}
      />
    </div>
  );
};

export default TreeTable;
