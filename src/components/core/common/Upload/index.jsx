import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Upload, List, Button, Typography, notification, message } from "antd";
import {
  PaperClipOutlined,
  InboxOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { uploadMultipleFiles } from "../../../../services/uploadService";
import { deleteRequest } from "../../../../services/baseService";
import { ENV } from "../../../../config/env";
import apiClient from "../../../../services/apiClient";
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints";
import FilePreview from "../FilePreview";

const { Text } = Typography;

const AttachmentUpload = forwardRef(
  (
    {
      value,
      isEditing = false,
      onChange,
      onSaveComplete, // Callback trả ra kết quả upload sau khi lưu
      uploadUrl, // URL hoặc function gọi API upload
      deleteUrl, // URL hoặc function gọi API xóa
      onUpload, // Hàm custom xử lý upload (nếu có)
      onDelete, // Hàm custom xử lý xóa file (nếu có)
      maxCount, // Số lượng file tối đa có thể chọn tải lên
      multiple = true,
      canDownload = true,
      className = "",
      style = {},
      type = "default",
      permission = {},
      supportText = "",
      supportType= ""
    },
    ref,
  ) => {
    const [fileList, setFileList] = useState([]);
    const [uploadedAttachments, setUploadedAttachments] = useState([]);
    const [filesToDelete, setFilesToDelete] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);
    const fileListRef = useRef(fileList);
    const uploadedAttachmentsRef = useRef(uploadedAttachments);
    const filesToDeleteRef = useRef(filesToDelete);

    // Luôn giữ state mới nhất để các thao tác xóa liên tiếp không dùng lại
    // closure cũ và ghi đè lần xóa trước.
    fileListRef.current = fileList;
    uploadedAttachmentsRef.current = uploadedAttachments;
    filesToDeleteRef.current = filesToDelete;

    // Hàm xử lý cắt ngắn tên file dài để không làm vỡ giao diện
    const truncateFileName = (name, maxLength = 35) => {
      if (typeof name !== "string") return name;

      // Bỏ UUID ở đầu tên file nếu có
      name = name.replace(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i,
        "",
      );

      if (name.length <= maxLength) return name;

      const lastDotIndex = name.lastIndexOf(".");
      if (lastDotIndex === -1) {
        return name.substring(0, maxLength - 3) + "...";
      }

      const extension = name.substring(lastDotIndex);
      const baseName = name.substring(0, lastDotIndex);
      const truncateLength = maxLength - extension.length - 3;

      if (truncateLength <= 0) {
        return name.substring(0, maxLength - 3) + "...";
      }

      return baseName.substring(0, truncateLength) + "..." + extension;
    };

    const buildFileUrl = (path) => {
      if (typeof path !== "string" || !path.trim()) return null;
      if (/^https?:\/\//i.test(path)) return path;
      const baseUrl = ENV.API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
      const cleanPath = path.replace(/^\/+/, "");
      return `${baseUrl}/${cleanPath}`;
    };

    const getFileUrl = (file) => {
      if (!file) return null;
      let path;
      if (type === "phieuYeuCau") {
        path = file.path;
      } else path = file.path || file.filePath || file.response?.path;
      if (path) return buildFileUrl(path);
      if (file.url) return file.url;
      if (file.originFileObj) return URL.createObjectURL(file.originFileObj);
      if (file instanceof File) return URL.createObjectURL(file);
      return null;
    };

    const parseValue = (val) => {
      if (!val) return [];
      if (typeof val === "string") {
        return val
          .split(";")
          .filter(Boolean)
          .map((path, index) => {
            const name = path.split(/[\\/]/).pop() || path;
            return {
              uid: path || String(index),
              name: name,
              path: path,
              fileName: name,
            };
          });
      }
      if (Array.isArray(val)) {
        return val.map((file, index) => {
          const path =
            file.path || file.filePath || file.response?.path || file.url;
          const name =
            file.name ||
            file.fileName ||
            (path ? path.split(/[\\/]/).pop() : `file-${index}`);
          return {
            ...file,
            uid: file.uid || path || String(index),
            name: name,
            path: path,
            fileName: name,
          };
        });
      }
      return [];
    };

    useEffect(() => {
      if (!isEditing) {
        setUploadedAttachments(parseValue(value));
        setFileList([]);
        setFilesToDelete([]);
      } else {
        const parsed = parseValue(value);
        const currentPaths = uploadedAttachments
          .map((f) => f.path || f.filePath)
          .join(";");
        const incomingPaths = parsed.map((f) => f.path || f.filePath).join(";");
        if (
          currentPaths !== incomingPaths &&
          filesToDelete.length === 0 &&
          fileList.length === 0
        ) {
          setUploadedAttachments(parsed);
        }
      }
    }, [value, isEditing]);

    const handlePreviewFile = (file) => {
      const fileUrl = getFileUrl(file);
      if (!fileUrl) {
        notification.error({ message: "Không tìm thấy đường dẫn file!" });
        return;
      }
      const fileName = file?.name || file?.fileName;
      setPreviewFile(
        fileName
          ? `${fileUrl}#previewFileName=${encodeURIComponent(fileName)}`
          : fileUrl,
      );
    };

    const handleClosePreview = () => {
      setPreviewFile(null);
    };

    const handleDownloadFile = async (file) => {
      const url = getFileUrl(file);
      if (url) {
        const fileName =
          file.name ||
          file.fileName ||
          file.response?.fileName ||
          (file.response && file.response[0]?.fileName) ||
          "download";
        try {
          message.info({
            content: "Đang tải file...",
            key: "downloading",
          });
          const filePath = file.filePath;
          const query = new URLSearchParams({ filePath: filePath });
          const responseBlob = filePath
            ? await apiClient.get(
                `${API_ENDPOINTS.FILE.DOWNLOAD_PATH}?${query.toString()}`,
                {
                  responseType: "blob",
                  timeout: 15 * 60 * 1000,
                },
              )
            : await fetch(url).then((response) => {
                if (!response.ok) {
                  throw new Error(`Không thể tải file (${response.status})`);
                }
                return response.blob();
              });
          const blob =
            responseBlob?.data instanceof Blob
              ? responseBlob.data
              : responseBlob;
          if (!(blob instanceof Blob)) {
            throw new Error("API tải xuống không trả về dữ liệu file hợp lệ");
          }
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = blobUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
          notification.success({
            message: "Tải file thành công!",
            key: "downloading",
            duration: 2,
            placement: "topRight",
          });
        } catch (error) {
          console.error("Download failed:", error);
          notification.destroy("downloading");
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    };

    const handleRemoveAttachment = (fileToRemove) => {
      const filePath = fileToRemove.filePath || fileToRemove.path;
      if (!filePath) return;

      const isMatch = (file) =>
        file.uid === fileToRemove.uid ||
        (file.filePath || file.path) === filePath;

      const currentFilesToDelete = filesToDeleteRef.current;
      const currentUploadedAttachments = uploadedAttachmentsRef.current;
      const nextFilesToDelete = currentFilesToDelete.some(
        (item) => (item.filePath || item.path) === filePath,
      )
        ? currentFilesToDelete
        : [...currentFilesToDelete, { ...fileToRemove, filePath }];
      const nextUploadedAttachments = currentUploadedAttachments.filter(
        (file) => !isMatch(file),
      );

      filesToDeleteRef.current = nextFilesToDelete;
      uploadedAttachmentsRef.current = nextUploadedAttachments;

      setFilesToDelete(nextFilesToDelete);
      setUploadedAttachments(nextUploadedAttachments);

      if (onChange) {
        onChange({
          fileList: fileListRef.current,
          uploadedAttachments: nextUploadedAttachments,
          filesToDelete: nextFilesToDelete,
        });
      }
    };

    useImperativeHandle(ref, () => ({
      save: async () => {
        // Upload file mới trước để không làm mất file cũ nếu upload thất bại.
        let newAttachments = [];
        if (fileList.length > 0) {
          try {
            let uploadedFiles = [];
            if (onUpload) {
              uploadedFiles = await onUpload(fileList);
            } else if (uploadUrl) {
              const uploadResponses = await uploadMultipleFiles(
                fileList,
                uploadUrl,
              );
              uploadedFiles = uploadResponses.flatMap((response) => {
                const data = response?.data?.data || response?.data || response;
                return (Array.isArray(data) ? data : [data]).filter(Boolean);
              });
            } else if (fileList.length > 0) {
              throw new Error(
                "AttachmentUpload requires uploadUrl or onUpload",
              );
            }

            newAttachments = uploadedFiles.map((res, i) => {
              const path = res?.filePath || res?.path;
              return {
                uid: fileList[i]?.uid || path || String(Date.now() + i),
                name: res?.name || res?.fileName || fileList[i]?.name,
                path,
                fileName: res?.fileName || res?.name || fileList[i]?.name,
                url: buildFileUrl(path),
                type: fileList[i]?.type,
              };
            });
          } catch (error) {
            console.error("Lỗi khi upload file mới:", error);
            throw error;
          }
        }

        const allAttachments = [...uploadedAttachments, ...newAttachments];

        // Ghi nhận file đã upload ngay cả khi bước xóa phía sau thất bại.
        // Khi người dùng bấm Lưu lại, file mới sẽ không bị upload trùng.
        if (newAttachments.length > 0) {
          setFileList([]);
          setUploadedAttachments(allAttachments);
        }

        // File cũ chỉ bị xóa khi bấm Lưu. Không nuốt lỗi xóa để tránh submit
        // payload trong khi trạng thái file trên server chưa đồng bộ.
        if (filesToDelete.length > 0) {
          await Promise.all(
            filesToDelete.map(async (fileToRemove) => {
              const filePath = fileToRemove.filePath || fileToRemove.path;
              if (!filePath) return;

              if (onDelete) {
                await onDelete(fileToRemove);
              } else if (deleteUrl) {
                await deleteRequest(deleteUrl, { filePath });
              }
            }),
          );
        }

        const pathFile =
          [
            ...new Set(
              allAttachments
                .map((file) => file.filePath || file.path)
                .filter(Boolean),
            ),
          ].join(";") || null;

        setFileList([]);
        setFilesToDelete([]);
        setUploadedAttachments(allAttachments);

        const result = {
          allAttachments,
          pathFile,
          newAttachments,
        };

        if (onSaveComplete) {
          onSaveComplete(result);
        }

        return result;
      },
      reset: () => {
        setUploadedAttachments(parseValue(value));
        setFileList([]);
        setFilesToDelete([]);
      },
    }));

    return (
      <div
        className={`attachment-upload-container ${className}`}
        style={{ style }}
      >
        {isEditing && (
          <Upload.Dragger
            multiple={multiple && maxCount !== 1}
            fileList={fileList}
            maxCount={maxCount}
            accept={supportType === "image" ? ".png,image/png" : undefined}
            beforeUpload={(file) => {
              let nextUploadedAttachments = uploadedAttachments;
              let nextFilesToDelete = filesToDelete;
              if (maxCount === 1 && uploadedAttachments.length > 0) {
                const oldFiles = uploadedAttachments
                  .filter((attachment) => {
                    const path = attachment.filePath || attachment.path;
                    return (
                      path &&
                      !filesToDelete.some(
                        (item) => (item.filePath || item.path) === path,
                      )
                    );
                  })
                  .map((attachment) => ({
                    ...attachment,
                    filePath: attachment.filePath || attachment.path,
                  }));
                nextFilesToDelete = [...filesToDelete, ...oldFiles];
                nextUploadedAttachments = [];
              }

              const currentTotal =
                fileList.length + nextUploadedAttachments.length;
              if (maxCount && currentTotal >= maxCount) {
                notification.warning({
                  message: `Chỉ được phép tải lên tối đa ${maxCount} file!`,
                });
                return Upload.LIST_IGNORE;
              }

              const nextFileList = [...fileList, file];
              setFileList(nextFileList);
              setUploadedAttachments(nextUploadedAttachments);
              setFilesToDelete(nextFilesToDelete);
              if (onChange) {
                onChange({
                  fileList: nextFileList,
                  uploadedAttachments: nextUploadedAttachments,
                  filesToDelete: nextFilesToDelete,
                });
              }
              return false;
            }}
            onRemove={(file) => {
              const nextFileList = fileList.filter((f) => f.uid !== file.uid);
              setFileList(nextFileList);
              if (onChange) {
                onChange({
                  fileList: nextFileList,
                  uploadedAttachments,
                  filesToDelete,
                });
              }
            }}
            itemRender={(originNode, file, currentFileList, actions) => (
              <div className="task-file-item">
                <div className="task-file-item-content">
                  <PaperClipOutlined />
                  <span className="task-file-item-name" title={file.name}>
                    {truncateFileName(file.name)}
                  </span>
                </div>
                <Button
                  className="task-file-item-btn delete-btn"
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.remove();
                  }}
                />
              </div>
            )}
            className="upload-dragger upload-dragger-custom"
          >
            <p>
              <InboxOutlined className="upload-icon" />
            </p>
            <p className="upload-text">
              Kéo thả file vào đây hoặc{" "}
              <span className="upload-highlight">chọn file</span>
            </p>
            <p className="upload-hint">
              {supportText || "Hỗ trợ: PDF, Word, Excel, hình ảnh..."}
            </p>
          </Upload.Dragger>
        )}

        {uploadedAttachments.length > 0 && (
          <div style={{ marginTop: isEditing ? 12 : 0 }}>
            <List
              dataSource={uploadedAttachments}
              renderItem={(file) => (
                <List.Item
                  className="attachment-item"
                  style={{ padding: 0, border: "none" }}
                >
                  <div className="task-file-item">
                    <div className="task-file-item-content">
                      <PaperClipOutlined />
                      <span
                        className="task-file-item-name"
                        title={file.name || file.fileName}
                      >
                        {truncateFileName(file.name || file.fileName)}
                      </span>
                    </div>
                    <div className="task-file-item-actions">
                      <Button
                        className="task-file-item-btn action-btn"
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewFile(file);
                        }}
                      />
                      {(type === "phieuYeuCau"
                        ? permission.canDownloadPhieuYeuCau !== false
                        : true) && (
                        <Button
                          className="task-file-item-btn action-btn"
                          type="text"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                        />
                      )}
                      {(type === "phieuYeuCau"
                        ? permission.canDeletePhieuYeuCau !== false
                        : isEditing) && (
                        <Button
                          className="task-file-item-btn delete-btn"
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttachment(file);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {!isEditing && uploadedAttachments.length === 0 && (
          <Text type="secondary" italic>
            Không có file đính kèm
          </Text>
        )}

        <FilePreview
          type={type}
          url={previewFile}
          onClose={handleClosePreview}
          canDownload={canDownload}
        />
      </div>
    );
  },
);

export default AttachmentUpload;
