import React, { memo, useRef, useState } from "react";
import { Typography, Button, Modal, Space, notification, Progress } from "antd";
import { DownloadOutlined, FileOutlined } from "@ant-design/icons";
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import apiClient from "../../../../services/apiClient";
import { ENV } from "../../../../config/env";
import { API_ENDPOINTS } from "../../../../constants/apiEndpoints";

const { Text } = Typography;

const getFileExtension = (name = "") =>
  String(name).split(".").pop()?.toLowerCase() || "";

const getOnlyOfficeDocumentType = (extension) => {
  if (["doc", "docx", "odt", "rtf", "txt", "html", "htm"].includes(extension)) {
    return "word";
  }

  if (["xls", "xlsx", "ods", "csv"].includes(extension)) {
    return "cell";
  }

  if (["ppt", "pptx", "odp"].includes(extension)) {
    return "slide";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  return null;
};

const createDocumentKey = (url, name) => {
  const value = `${url}|${name}`;
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return `preview-${hash}`;
};

const OnlyOfficePreview = memo(({ url, fileName }) => {
  const extension = getFileExtension(fileName);
  const documentType = getOnlyOfficeDocumentType(extension);

  if (!url || !documentType) {
    return (
      <div className="file-preview-fallback">
        <Text type="secondary">
          ONLYOFFICE không hỗ trợ định dạng file này.
        </Text>
      </div>
    );
  }

  const documentKey = createDocumentKey(url, fileName);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <DocumentEditor
        id={`onlyoffice-${documentKey}`}
        documentServerUrl={ENV.BASE_URL_PREVIEW}
        config={{
          document: {
            fileType: extension,
            key: documentKey,
            title: fileName || `document.${extension}`,
            url,
            permissions: {
              edit: false,
              download: false,
              print: false,
              comment: false,
              review: false,
            },
          },

          documentType,

          editorConfig: {
            mode: "view",
            lang: "vi",

            customization: {
              compactHeader: true,
              hideRightMenu: true,
              hideRulers: false,
            },
          },

          height: "100%",
          width: "100%",
        }}
        onLoadComponentError={(errorCode, errorDescription) => {
          console.error("ONLYOFFICE load error:", errorCode, errorDescription);
        }}
      />
    </div>
  );
});

OnlyOfficePreview.displayName = "OnlyOfficePreview";

const FILE_BASE_URL = ENV.API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");

const resolveFileUrl = (url) => {
  if (!url) return "";

  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  return `${FILE_BASE_URL}/${String(url).replace(/^\/+/, "")}`;
};

const getFileNameFromUrl = (url) => {
  const removeUuid = (name) =>
    name.replace(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i,
      "",
    );

  const previewName = String(url || "").match(/#previewFileName=([^&]+)/i)?.[1];

  if (previewName) {
    try {
      return removeUuid(decodeURIComponent(previewName));
    } catch {
      return removeUuid(previewName);
    }
  }

  const cleanUrl = String(url || "").split(/[?#]/)[0];
  const pathName = cleanUrl.split(/[\\/]/).pop() || cleanUrl;

  try {
    return removeUuid(decodeURIComponent(pathName));
  } catch {
    return removeUuid(pathName);
  }
};

const getFileBlob = async (url) => {
  if (url.startsWith("blob:") || url.startsWith("data:")) {
    const response = await fetch(url);
    return response.blob();
  }

  const response = await apiClient.get(url, {
    responseType: "blob",
  });

  return response?.data instanceof Blob ? response.data : response;
};

const FilePreview = ({
  url,
  fileUrl,
  fileName,
  onClose,
  canDownload = false,
  canDownloadPhieuYeuCau = false,
  type = "",
}) => {
  const lastProgressRef = useRef(-1);

  const [downloadProgress, setDownloadProgress] = useState(null);

  const rawUrl = String(fileUrl || url || "").replace(
    /#previewFileName=[^&]+/i,
    "",
  );

  const sourceUrl = resolveFileUrl(rawUrl);

  const nameStr = fileName || getFileNameFromUrl(url || fileUrl);

  const name = String(nameStr || "").toLowerCase();

  const isImage = /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(name);
  const isPdf = /\.pdf$/i.test(name);
  const isOffice = /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(name);

  const allowDownload =
    sourceUrl &&
    canDownload &&
    (type !== "phieuYeuCau" || canDownloadPhieuYeuCau);

  const handleDownload = async () => {
    if (!sourceUrl || downloadProgress) return;

    let downloadUrl = "";

    try {
      lastProgressRef.current = -1;

      setDownloadProgress({
        name: nameStr,
        percent: 0,
      });

      const rawPath = String(fileUrl || rawUrl || "")
        .split("#")[0]
        .replace(FILE_BASE_URL, "")
        .replace(/^\/+/, "");

      let responseBlob;

      if (/^(blob:|data:)/i.test(sourceUrl)) {
        responseBlob = await getFileBlob(sourceUrl);
      } else {
        const query = new URLSearchParams({
          filePath: rawPath,
        });

        responseBlob = await apiClient.get(
          `${API_ENDPOINTS.FILE.DOWNLOAD_PATH}?${query.toString()}`,
          {
            responseType: "blob",

            timeout: 15 * 60 * 1000,

            onDownloadProgress: (event) => {
              if (!event.total) return;

              const percent = Math.min(
                99,
                Math.round((event.loaded / event.total) * 100),
              );

              if (percent === lastProgressRef.current) {
                return;
              }

              lastProgressRef.current = percent;

              setDownloadProgress({
                name: nameStr,
                percent,
              });
            },
          },
        );
      }

      const blob =
        responseBlob?.data instanceof Blob ? responseBlob.data : responseBlob;

      if (!(blob instanceof Blob)) {
        throw new Error("API tải xuống không trả về dữ liệu file hợp lệ");
      }

      setDownloadProgress({
        name: nameStr,
        percent: 100,
      });

      downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = nameStr || "download";

      document.body.appendChild(link);

      link.click();

      link.remove();
    } catch (downloadError) {
      console.error("Download failed:", downloadError);

      notification.error({
        message: "Không thể tải xuống file!",
      });
    } finally {
      if (downloadUrl) {
        window.setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
        }, 1000);
      }

      window.setTimeout(() => {
        lastProgressRef.current = -1;
        setDownloadProgress(null);
      }, 300);
    }
  };

  if (!url && !fileUrl) {
    return null;
  }

  const renderContent = () => {
    if (isImage && sourceUrl) {
      return (
        <img
          src={sourceUrl}
          alt="preview"
          className="file-preview-image"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      );
    }

    if ((isOffice || isPdf) && sourceUrl) {
      return <OnlyOfficePreview url={sourceUrl} fileName={nameStr} />;
    }

    return (
      <div
        className="file-preview-fallback"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <Text type="secondary" className="fallback-text">
          Không thể xem trước định dạng file này.
          {name ? ` (${name})` : ""}
        </Text>

        {allowDownload && (
          <Button
            type="primary"
            onClick={handleDownload}
            loading={Boolean(downloadProgress)}
          >
            Tải xuống file
          </Button>
        )}

        {!sourceUrl && (
          <Text type="danger">File chưa được tải lên hoàn tất.</Text>
        )}
      </div>
    );
  };

  return (
    <Modal
      className="file-preview-modal"
      open={Boolean(url || fileUrl)}
      title={
        <div className="file-preview-modal-header">
          <Space size={10} className="file-preview-modal-title">
            <FileOutlined />

            <span
              title={nameStr || "Xem file"}
              style={{
                display: "inline-block",
                maxWidth: "100%",
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                lineHeight: 1.4,
              }}
            >
              {nameStr || "Xem file"}
            </span>
          </Space>

          {allowDownload && (
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={Boolean(downloadProgress)}
              disabled={Boolean(downloadProgress)}
            >
              Tải xuống
            </Button>
          )}
        </div>
      }
      footer={null}
      onCancel={onClose}
      width="80vw"
      centered
      styles={{
        body: {
          height: "90vh",
          padding: 0,
          overflow: "hidden",
          position: "relative",
        },
      }}
      destroyOnHidden
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,

            display: downloadProgress ? "block" : "none",

            padding: downloadProgress ? "8px 16px" : 0,

            background: "#fff",

            boxShadow: downloadProgress ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <Text>
            {downloadProgress
              ? `Đang tải xuống ${downloadProgress.name}: ${downloadProgress.percent}%`
              : ""}
          </Text>

          <Progress percent={downloadProgress?.percent ?? 0} size="small" />
        </div>

        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};

export default FilePreview;
