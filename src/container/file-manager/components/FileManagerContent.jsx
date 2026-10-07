import React, { useRef, useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  Form,
  Space,
  Tooltip,
  Dropdown,
  Upload,
  List,
} from "antd";
import {
  FolderFilled,
  FileOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  EyeOutlined,
  DownloadOutlined,
  ScissorOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileTextOutlined,
  FolderAddOutlined,
  SnippetsOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import ModalConfirm from "../../../components/core/common/ModalConfirm";

const getFileIcon = (filename, fontSize) => {
  if (!filename) {
    return <FileOutlined className="file-icon-default" style={{ fontSize }} />;
  }

  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "xls":
    case "xlsx":
    case "csv":
      return (
        <FileExcelOutlined className="file-icon-excel" style={{ fontSize }} />
      );
    case "pdf":
      return <FilePdfOutlined className="file-icon-pdf" style={{ fontSize }} />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return (
        <FileImageOutlined className="file-icon-image" style={{ fontSize }} />
      );
    case "doc":
    case "docx":
      return (
        <FileWordOutlined className="file-icon-word" style={{ fontSize }} />
      );
    case "ppt":
    case "pptx":
      return <FilePptOutlined className="file-icon-ppt" style={{ fontSize }} />;
    case "zip":
    case "rar":
    case "7z":
      return <FileZipOutlined className="file-icon-zip" style={{ fontSize }} />;
    case "txt":
      return (
        <FileTextOutlined className="file-icon-txt" style={{ fontSize }} />
      );
    case "dwg":
    case "dxf":
      return <FileOutlined className="file-icon-cad" style={{ fontSize }} />;
    default:
      return (
        <FileOutlined className="file-icon-default" style={{ fontSize }} />
      );
  }
};

const FileManagerContent = ({
  viewMode,
  displayFiles,
  currentFolderId,
  openRenameModal,
  openDeleteModal,
  handleRowDoubleClick,
  folderModalOpen,
  setFolderModalOpen,
  handleCreateFolder,
  form,
  renameModalOpen,
  setRenameModalOpen,
  handleRename,
  renameForm,
  deleteModalOpen,
  setDeleteModalOpen,
  handleDelete,
  selectedFile,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleCopy,
  selectedKeys,
  setSelectedKeys,
  canEditFile,
  openPreviewModal,
  handleDownload,
  handleCut,
  handlePaste,
  clipboard,
  handleFileUpload,
  canRenameFile,
  canDeleteFile,
  canMoveFile,
  canDowLoadFile,
  canPreviewFile,
}) => {
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionBox(null);
      }
    };
    window.addEventListener("mouseup", handleMouseUpGlobal);
    return () => window.removeEventListener("mouseup", handleMouseUpGlobal);
  }, [isSelecting]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (
      e.target.closest(".file-selectable") ||
      e.target.closest(".ant-dropdown-trigger") ||
      e.target.closest(".ant-modal-root")
    ) {
      return;
    }

    if (!e.ctrlKey && !e.metaKey) {
      setSelectedKeys([]);
    }

    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setIsSelecting(true);
    setSelectionBox({
      startX,
      startY,
      width: 0,
      height: 0,
      left: startX,
      top: startY,
    });
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !selectionBox) return;
    const rect = containerRef.current.getBoundingClientRect();
    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;

    currentX = Math.max(0, Math.min(currentX, rect.width));
    currentY = Math.max(0, Math.min(currentY, rect.height));

    const width = Math.abs(currentX - selectionBox.startX);
    const height = Math.abs(currentY - selectionBox.startY);
    const left = Math.min(currentX, selectionBox.startX);
    const top = Math.min(currentY, selectionBox.startY);

    setSelectionBox((prev) => ({ ...prev, width, height, left, top }));

    const selectionRect = {
      left: left + rect.left,
      right: left + width + rect.left,
      top: top + rect.top,
      bottom: top + height + rect.top,
    };

    const items = document.querySelectorAll(".file-selectable");
    const newSelected = [];
    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      if (
        itemRect.left < selectionRect.right &&
        itemRect.right > selectionRect.left &&
        itemRect.top < selectionRect.bottom &&
        itemRect.bottom > selectionRect.top
      ) {
        newSelected.push(item.getAttribute("data-id"));
      }
    });
    setSelectedKeys(newSelected);
  };

  const handleItemClick = (e, id) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedKeys((prev) =>
        prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
      );
      return;
    }

    setSelectedKeys([id]);
  };

  const getItemMenuItems = (record) =>
    [
      ...(record.type === "file" && record.url
        ? [
            canPreviewFile && {
              key: "view",
              label: "Xem",
              icon: <EyeOutlined />,
              onClick: () => openPreviewModal(record),
            },
            canDowLoadFile && {
              key: "download",
              label: "Tải xuống",
              icon: <DownloadOutlined />,
              onClick: () => handleDownload(record),
            },
          ]
        : []),
      canMoveFile &&
        canEditFile(record) && {
          key: "cut",
          label: "Cắt",
          icon: <ScissorOutlined />,
          onClick: () => handleCut(record),
        },
      canMoveFile && {
        key: "copy",
        label: "Copy",
        icon: <CopyOutlined />,
        onClick: () => handleCopy(record),
      },
      canRenameFile &&
        (record.type === "folder" || record.type === "file") &&
        canEditFile(record) && {
          key: "rename",
          label: "Đổi tên",
          icon: <EditOutlined />,
          onClick: () => openRenameModal(record),
        },
      canDeleteFile &&
        canEditFile(record) && {
          key: "delete",
          label: "Xóa",
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => openDeleteModal(record),
        },
    ].filter(Boolean);

  const renderFileName = (record, iconSize = 20) => (
    <div className="col-name">
      {record.type === "folder" ? (
        <div className="folder-icon-wrapper">
          <FolderFilled style={{ color: "#faad14", fontSize: 22 }} />
          <div className="folder-file-count flex flex-center">
            {record.fileCount ?? 0}
          </div>
        </div>
      ) : (
        getFileIcon(record.name, iconSize)
      )}
      <span className="file-name">{record.name}</span>
    </div>
  );

  const renderActions = (record) => (
    <Space className="file-actions" onClick={(e) => e.stopPropagation()}>
      {record.type === "file" && record.url && canPreviewFile && (
        <Tooltip title="Xem">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openPreviewModal(record)}
          />
        </Tooltip>
      )}
      {record.type === "file" && record.url && canDowLoadFile && (
        <Tooltip title="Tai xuong">
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          />
        </Tooltip>
      )}
      {canEditFile(record) && canRenameFile && (
        <Tooltip title="Chinh sua">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openRenameModal(record)}
          />
        </Tooltip>
      )}
      {canEditFile(record) && canDeleteFile && (
        <Tooltip title="Xoa">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => openDeleteModal(record)}
          />
        </Tooltip>
      )}
    </Space>
  );

  const renderListItem = (record) => (
    <Dropdown
      key={record.id}
      trigger={["contextMenu"]}
      menu={{ items: getItemMenuItems(record) }}
    >
      <List.Item
        className={`file-list-item file-selectable ${selectedKeys.includes(record.id) ? "selected" : ""}`}
        data-id={record.id}
        onClick={(e) => handleItemClick(e, record.id)}
        onDoubleClick={() => handleRowDoubleClick(record)}
        onContextMenu={(e) => e.stopPropagation()}
        draggable
        onDragStart={(e) => handleDragStart(e, record)}
        onDragOver={(e) => handleDragOver(e, record)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, record)}
      >
        <div className="file-list-main">{renderFileName(record)}</div>
        {currentFolderId === null ? (
          <div className="file-list-description" title={record.description}>
            {record.description || ""}
          </div>
        ) : (
          <div className="file-list-meta">
            <div className="col-date">{record.updatedAt || ""}</div>
            <div className="col-uploader">{record.uploadedBy || ""}</div>
            <div className="col-size">{record.size || ""}</div>
          </div>
        )}
        <div className="col-actions">{renderActions(record)}</div>
      </List.Item>
    </Dropdown>
  );

  return (
    <Dropdown
      trigger={["contextMenu"]}
      menu={{
        items: [
          ...(currentFolderId === null
            ? [
                {
                  key: "newFolder",
                  label: "Tạo thư mục mới",
                  icon: <FolderAddOutlined />,
                  onClick: () => setFolderModalOpen(true),
                },
              ]
            : []),
          ...(currentFolderId !== null
            ? [
                {
                  key: "upload",
                  label: (
                    <Upload
                      multiple
                      showUploadList={false}
                      customRequest={({ file, onSuccess }) => {
                        handleFileUpload(file);
                        onSuccess("ok");
                      }}
                    >
                      <span>Tải file lên</span>
                    </Upload>
                  ),
                  icon: <CloudUploadOutlined />,
                },
              ]
            : []),
          { type: "divider" },
          {
            key: "paste",
            label: "Dán",
            icon: <SnippetsOutlined />,
            onClick: handlePaste,
            disabled: !clipboard || clipboard.length === 0,
          },
        ],
      }}
    >
      <div
        className="file-manager-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          position: "relative",
          userSelect: isSelecting ? "none" : "auto",
        }}
      >
        {selectionBox && (
          <div
            className="selection-box"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
        {/* Content */}
        <div className="file-content">
          {viewMode === "grid" ? (
            <div className="file-grid">
              {displayFiles.length === 0 ? (
                <div className="empty-folder">Thư mục trống</div>
              ) : (
                displayFiles.map((record) => (
                  <Dropdown
                    key={record.id}
                    trigger={["contextMenu"]}
                    menu={{ items: getItemMenuItems(record) }}
                  >
                    <Tooltip title={record.description}>
                      <div
                        className={`file-grid-item file-selectable ${selectedKeys.includes(record.id) ? "selected" : ""}`}
                        data-id={record.id}
                        onClick={(e) => handleItemClick(e, record.id)}
                        onDoubleClick={() => handleRowDoubleClick(record)}
                        onContextMenu={(e) => e.stopPropagation()}
                        draggable
                        onDragStart={(e) => handleDragStart(e, record)}
                        onDragOver={(e) => handleDragOver(e, record)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, record)}
                      >
                        <div className="file-icon">
                          {record.type === "folder" ? (
                            <div className="folder-icon-wrapper">
                              <FolderFilled className="folder-icon" />
                              <div className="folder-file-count flex flex-center">
                                {record.fileCount ?? 0}
                              </div>
                            </div>
                          ) : (
                            getFileIcon(record.name, 30)
                          )}
                        </div>
                        <div className="file-name" title={record.name}>
                          {record.name}
                        </div>
                      </div>
                    </Tooltip>
                  </Dropdown>
                ))
              )}
            </div>
          ) : (
            <div className="file-list-view">
              {displayFiles.length === 0 ? (
                <div className="empty-folder">Thư mục trống</div>
              ) : (
                <>
                  <div className="file-list-header">
                    <div className="header-col header-col-name">Tên</div>
                    {currentFolderId === null ? (
                      <div className="header-col header-col-description">
                        Mô tả
                      </div>
                    ) : (
                      <div className="file-list-meta-header">
                        <div className="header-col">Thời gian cập nhật</div>
                        <div className="header-col">Người upload</div>
                        <div className="header-col header-col-size">
                          Dung lượng
                        </div>
                      </div>
                    )}
                    <div className="header-col header-col-actions" />
                  </div>
                  <List
                    dataSource={displayFiles}
                    split={false}
                    renderItem={renderListItem}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Tạo thư mục */}
        <Modal
          title="Tạo thư mục mới"
          open={folderModalOpen}
          onOk={handleCreateFolder}
          onCancel={() => {
            setFolderModalOpen(false);
            form.resetFields();
          }}
          okText="Tạo mới"
          cancelText="Hủy"
          centered
        >
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            <Form.Item
              name="name"
              label="Tên thư mục"
              rules={[{ required: true, message: "Vui lòng nhập tên thư mục" }]}
            >
              <Input placeholder="Nhập tên thư mục..." autoFocus />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={3} placeholder="Nhập mô tả..." />
            </Form.Item>
          </Form>
        </Modal>

        {/* Modal Đổi tên */}
        <Modal
          title="Đổi tên"
          open={renameModalOpen}
          onOk={handleRename}
          onCancel={() => setRenameModalOpen(false)}
          okText="Lưu"
          cancelText="Hủy"
          centered
        >
          <Form form={renameForm} layout="vertical" style={{ marginTop: 20 }}>
            <Form.Item
              name="name"
              label="Tên mới"
              rules={[{ required: true, message: "Vui lòng nhập tên" }]}
            >
              <Input placeholder="Nhập tên..." autoFocus />
            </Form.Item>
            {selectedFile?.type === "folder" && (
              <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Nhập mô tả..." />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Modal Xóa */}
        <ModalConfirm
          open={deleteModalOpen}
          title={
            selectedKeys.length > 1
              ? "Xóa nhiều mục"
              : `Xóa ${selectedFile?.type === "folder" ? "thư mục" : "file"}`
          }
          content={
            <span>
              {selectedKeys.length > 1
                ? `Bạn có chắc chắn muốn xóa ${selectedKeys.length} mục đã chọn không? Tất cả nội dung bên trong các thư mục cũng sẽ bị xóa.`
                : `Bạn có chắc chắn muốn xóa `}
              {selectedKeys.length <= 1 && <b>{selectedFile?.name}</b>}
              {selectedKeys.length <= 1 &&
                ` không? ${selectedFile?.type === "folder" ? "Tất cả nội dung bên trong cũng sẽ bị xóa." : ""}`}
            </span>
          }
          onOk={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />
      </div>
    </Dropdown>
  );
};

export default FileManagerContent;
