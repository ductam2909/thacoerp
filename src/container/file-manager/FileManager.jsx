/* eslint-disable no-lone-blocks */
/* eslint-disable no-loop-func */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Breadcrumb,
  Button,
  Form,
  Space,
  notification,
  Upload,
  Select,
  Row,
  Col,
  Segmented,
  Spin,
} from "antd";
import {
  UploadOutlined,
  FolderAddOutlined,
  HomeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageContainer from "../../components/core/common/PageContainer";
import FileManagerContent from "./components/FileManagerContent";
import FileTransferProgress from "../../components/core/common/FileTransferProgress";
import { dataProject } from "../../helpers/mock/mockupData";
import {
  postRequest,
  getRequest,
  deleteRequest,
  putRequest,
} from "../../services/baseService";
import { uploadFile, uploadFileMultipart } from "../../services/uploadService";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { ENV } from "../../config/env";
import FilePreview from "../../components/core/common/FilePreview";

const FILE_BASE_URL = ENV.API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");

const unwrapList = (response) => {
  const value =
    response?.data?.data ??
    response?.data ??
    response?.Data ??
    response?.items ??
    response?.Items ??
    response;
  return Array.isArray(value) ? value : [];
};

const buildFileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${FILE_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
};

// Tiến trình chỉ tồn tại trong state của component, không lưu vào store/storage.
const saveProgressItem = () => {};
const clearProgressItem = () => {};
const UPLOAD_PROGRESS_STORAGE_KEY = "upload";
const DOWNLOAD_PROGRESS_STORAGE_KEY = "download";

const FileManager = ({ isComponent, defaultProjectId }) => {
  const { permissionsByPath } = useSelector((state) => state.menu);
  const permissionCodes = isComponent
    ? permissionsByPath["/projects"] || []
    : permissionsByPath["/files"] || [];

  const canCreateFolder = permissionCodes.includes("File.Create");
  const canUploadFile = permissionCodes.includes("File.Create");
  const canRenameFile = permissionCodes.includes("File.Update");
  const canDeleteFile = permissionCodes.includes("File.Delete");
  const canMoveFile = permissionCodes.includes("File.Update");
  const canDowLoadFile = permissionCodes.includes("File.Download");
  const canPreviewFile = permissionCodes.includes("File.Preview");

  const [api, contextHolder] = notification.useNotification();
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || 1,
  );
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const [draggedItem, setDraggedItem] = useState(null);
  const [clipboard, setClipboard] = useState([]);
  const [clipboardAction, setClipboardAction] = useState(null); // 'copy' or 'cut'
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isUploadHidden, setIsUploadHidden] = useState(false);
  const [isDownloadHidden, setIsDownloadHidden] = useState(false);
  const uploadControllersRef = useRef({});
  const downloadControllersRef = useRef({});
  const dismissedUploadKeysRef = useRef(new Set());
  const dismissedDownloadKeysRef = useRef(new Set());

  const stopUpload = () => {
    setUploadProgress({});
    setIsUploadHidden(true);
  };

  const stopDownload = () => {
    setDownloadProgress({});
    setIsDownloadHidden(true);
  };

  const clearUploadItem = (uploadKey) => {
    setUploadProgress((current) => {
      const next = { ...current };
      delete next[uploadKey];
      return next;
    });
  };

  const clearDownloadItem = (downloadKey) => {
    setDownloadProgress((current) => {
      const next = { ...current };
      delete next[downloadKey];
      return next;
    });
  };

  const cancelUploadItem = (item) => {
    const uploadKey = item?.key;
    if (!uploadKey) return;
    uploadControllersRef.current[uploadKey]?.abort?.();
    delete uploadControllersRef.current[uploadKey];
    setUploadProgress((current) => {
      const next = { ...current };
      delete next[uploadKey];
      return next;
    });
  };

  const cancelDownloadItem = (item) => {
    const downloadKey = item?.key;
    if (!downloadKey) return;
    downloadControllersRef.current[downloadKey]?.abort?.();
    delete downloadControllersRef.current[downloadKey];
    setDownloadProgress((current) => {
      const next = { ...current };
      delete next[downloadKey];
      return next;
    });
  };

  const canEditFile = (record) => {
    if (!record) return false;
    return record.canEdit !== false;
  };

  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();

  const fetchFolders = async () => {
    setFilesLoading(true);
    try {
      const url = API_ENDPOINTS.PROJECT_FOLDER.GET_ALL_BY_PROJECT.replace(
        "{projectId}",
        selectedProjectId,
      );
      const res = await getRequest(url);
      const fetchedFolders = unwrapList(res);

      const mappedFolders = fetchedFolders.map((f) => ({
        id: f.id || f.projectFolderId || f.folderId || Math.random().toString(),
        name: f.name || f.folderName || f.title || "Untitled Folder",
        type: "folder",
        parentId: f.parentId || null,
        projectId: selectedProjectId,
        description: f.description || "",
        fileCount: f.fileCount ?? f.totalFiles ?? 0,
        size: "-",
        updatedAt: f.updatedAt || f.createdTime || dayjs().format("DD/MM/YYYY"),
        canEdit: true,
      }));

      setFiles(mappedFolders);
    } catch (err) {
      console.error("Lỗi lấy danh sách folder:", err);
      notification.error({ message: "Lấy danh sách thư mục thất bại" });
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchFolders();
    }
  }, [selectedProjectId]);

  const fetchFilesByFolder = async (folderId) => {
    if (!selectedProjectId || !folderId) return;
    setFilesLoading(true);
    try {
      const response = await getRequest(API_ENDPOINTS.FILE.GET_ALL, {
        projectId: selectedProjectId,
        folderId,
        page: 1,
        pageSize: 1000,
      });
      const mappedFiles = unwrapList(response).map((file, index) => {
        const path = file.path || file.filePath || file.url;
        const fileId = file.fileId || file.id || file.projectFileId;
        return {
          ...file,
          id: fileId || `${folderId}-file-${index}`,
          fileId,
          name: file.fileName || file.name || "Untitled file",
          type: "file",
          parentId: folderId,
          projectId: selectedProjectId,
          size: file.size || file.fileSize || "-",
          updatedAt: dayjs(file.createdDate).format("DD/MM/YYYY HH:mm") || "",
          path,
          url: buildFileUrl(path),
          uploadedBy:
            file.uploadedByName ||
            file.uploaderName ||
            file.createdByName ||
            file.createdByFullName ||
            file.createdBy?.fullName ||
            (typeof file.createdBy === "string" ? file.createdBy : "") ||
            file.userName ||
            "",
          canEdit: file.canEdit !== false,
        };
      });

      setFiles((current) => [
        ...current.filter(
          (item) => item.type === "folder" || item.parentId !== folderId,
        ),
        ...mappedFiles,
      ]);
    } catch (error) {
      console.error("Lỗi:", error);
      notification.error({
        message: "Không thể tải danh sách file trong thư mục",
      });
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    if (currentFolderId) fetchFilesByFolder(currentFolderId);
  }, [currentFolderId, selectedProjectId]);

  // --- Lấy danh sách Breadcrumb ---
  const breadcrumbItems = useMemo(() => {
    const items = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = files.find((f) => f.id === currentId);
      if (folder) {
        items.unshift({ title: folder.name, id: folder.id });
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return [
      {
        title: (
          <>
            <HomeOutlined /> Trang chủ
          </>
        ),
        id: null,
      },
      ...items,
    ];
  }, [currentFolderId, files]);

  // --- Lọc danh sách hiển thị hiện tại ---
  const displayFiles = useMemo(() => {
    let filtered = files.filter(
      (f) =>
        f.parentId === currentFolderId && f.projectId === selectedProjectId,
    );
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(lowerSearch),
      );
    }
    // Sắp xếp: Thư mục trước, File sau, rồi theo tên
    return filtered.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [files, currentFolderId, searchText, selectedProjectId]);

  const openFilePreview = (record) => {
    const fileUrl =
      record?.url || buildFileUrl(record?.filePath || record?.path);
    if (!fileUrl) {
      notification.error({ message: "Không tìm thấy đường dẫn file!" });
      return;
    }

    const fileName = record?.name || record?.fileName;
    setPreviewFile(
      fileName
        ? `${fileUrl}#previewFileName=${encodeURIComponent(fileName)}`
        : fileUrl,
    );
  };

  const handleRowDoubleClick = (record) => {
    if (record.type === "folder") {
      setCurrentFolderId(record.id);
      setSearchText("");
    } else if (record.type === "file" && record.url) {
      openFilePreview(record);
    }
  };

  const handleBreadcrumbClick = (id) => {
    setCurrentFolderId(id);
    setSearchText("");
  };

  const handleCreateFolder = async () => {
    // Chỉ cho phép tạo thư mục cấp 1 tại thư mục gốc.
    if (currentFolderId !== null) {
      setFolderModalOpen(false);
      form.resetFields();
      api.warning({ message: "Không thể tạo thư mục con" });
      return;
    }

    try {
      const values = await form.validateFields();
      const payload = {
        folderName: values.name,
        description: values.description || "",
      };

      const url = API_ENDPOINTS.PROJECT_FOLDER.CREATE.replace(
        "{projectId}",
        selectedProjectId,
      );
      await postRequest(url, payload);

      setFolderModalOpen(false);
      form.resetFields();
      notification.success({ message: "Tạo thư mục thành công" });
      fetchFolders(); // Tải lại danh sách từ BE
    } catch (error) {
      console.error(error);
      notification.error({ message: "Tạo thư mục thất bại" });
    }
  };

  const handleRename = async () => {
    try {
      const values = await renameForm.validateFields();

      if (selectedFile.type === "folder") {
        const url = API_ENDPOINTS.PROJECT_FOLDER.UPDATE_BY_ID.replace(
          "{projectId}",
          selectedProjectId,
        ).replace("{folderId}", selectedFile.id);
        const payload = {
          folderName: values.name,
          description: values.description || "",
        };
        await putRequest(url, payload);
      }
      if (selectedFile.type === "file") {
        const targetFileId = selectedFile.fileId || selectedFile.id;

        const params = new URLSearchParams({
          fileName: values.name,
        });

        const url = `${API_ENDPOINTS.FILE.UPDATE_BY_ID.replace(
          "{id}",
          targetFileId,
        )}?${params.toString()}`;

        await putRequest(url);
      }

      const updatedFiles = files.map((f) =>
        f.id === selectedFile.id
          ? { ...f, name: values.name, description: values.description }
          : f,
      );
      setFiles(updatedFiles);
      setRenameModalOpen(false);
      setSelectedFile(null);
      notification.success({
        message:
          selectedFile.type === "file"
            ? "Cập nhật file thành công"
            : "Đổi tên thành công",
      });
    } catch (error) {
      console.error("Lỗi khi đổi tên:", error);
      notification.error({ message: "Đổi tên thất bại" });
    }
  };

  const handleDelete = async () => {
    let itemsToDelete = [];
    if (selectedKeys.length > 0) {
      itemsToDelete = files.filter((f) => selectedKeys.includes(f.id));
    } else if (selectedFile) {
      itemsToDelete = [selectedFile];
    }

    if (itemsToDelete.some((item) => !canEditFile(item))) {
      notification.error({
        message: "Không thể xóa các thư mục/file cấu hình gốc!",
      });
      return;
    }

    if (itemsToDelete.length > 0) {
      try {
        const folderItems = itemsToDelete.filter((i) => i.type === "folder");
        const fileItems = itemsToDelete.filter((i) => i.type === "file");

        // Gọi API xóa từng folder
        await Promise.all(
          folderItems.map((folder) => {
            const url = API_ENDPOINTS.PROJECT_FOLDER.DELETE_BY_ID.replace(
              "{projectId}",
              selectedProjectId,
            ).replace("{folderId}", folder.id);
            return deleteRequest(url);
          }),
        );

        await Promise.all(
          fileItems.map((file) =>
            deleteRequest(
              API_ENDPOINTS.FILE.DELETE_BY_ID.replace("{id}", file.id),
            ),
          ),
        );

        notification.success({
          message: `Đã xóa ${itemsToDelete.length} mục thành công`,
        });
        setDeleteModalOpen(false);
        setSelectedFile(null);
        setSelectedKeys([]);
        if (folderItems.length > 0) {
          await fetchFolders();
        }
        if (fileItems.length > 0 && currentFolderId) {
          await fetchFilesByFolder(currentFolderId);
        }
      } catch (error) {
        console.error(error);
        notification.error({ message: "Xóa mục thất bại!" });
      }
    }
  };

  const openRenameModal = (record) => {
    setSelectedFile(record);
    renameForm.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setRenameModalOpen(true);
  };

  const openDeleteModal = (record) => {
    if (record && !selectedKeys.includes(record.id)) {
      setSelectedKeys([record.id]);
      setSelectedFile(record);
    } else if (selectedKeys.length === 1) {
      setSelectedFile(files.find((f) => f.id === selectedKeys[0]));
    }
    setDeleteModalOpen(true);
  };

  const openPreviewModal = (record) => {
    if (record && record.type === "file" && record.url) {
      openFilePreview(record);
    }
  };

  const handleDownload = async (record) => {
    if (!record?.id) return;
    const downloadKey = record.id;
    dismissedDownloadKeysRef.current.delete(downloadKey);
    setIsDownloadHidden(false);
    const initialDownloadItem = {
      key: downloadKey,
      name: record.name,
      percent: 0,
    };
    saveProgressItem(
      DOWNLOAD_PROGRESS_STORAGE_KEY,
      downloadKey,
      initialDownloadItem,
    );
    setDownloadProgress((current) => ({
      ...current,
      [downloadKey]: initialDownloadItem,
    }));
    {
      if (dismissedDownloadKeysRef.current.has(downloadKey)) {
        clearProgressItem(DOWNLOAD_PROGRESS_STORAGE_KEY, downloadKey);
        clearDownloadItem(downloadKey);
        return;
      }
      try {
        const controller = new AbortController();
        const cancelSource = axios.CancelToken.source();
        downloadControllersRef.current[downloadKey] = {
          abort: () => {
            controller.abort();
            cancelSource.cancel("Canceled by user");
          },
        };
        notification.info({
          message: `Đang chuẩn bị tải xuống ${record.name}...`,
          key: `download_${record.id}`,
        });
        const blob = await apiClient.get(
          API_ENDPOINTS.FILE.DOWNLOAD.replace("{id}", record.id),
          {
            responseType: "blob",
            timeout: 5 * 60 * 1000,
            signal: controller.signal,
            cancelToken: cancelSource.token,
            onDownloadProgress: (event) => {
              if (dismissedDownloadKeysRef.current.has(downloadKey)) return;
              const item = {
                key: downloadKey,
                name: record.name,
                percent: event.total
                  ? Math.min(99, Math.round((event.loaded / event.total) * 100))
                  : 0,
              };
              saveProgressItem(
                DOWNLOAD_PROGRESS_STORAGE_KEY,
                downloadKey,
                item,
              );
              setDownloadProgress((current) => ({
                ...current,
                [downloadKey]: item,
              }));
            },
          },
        );
        if (dismissedDownloadKeysRef.current.has(downloadKey)) return;
        const completedDownloadItem = {
          key: downloadKey,
          name: record.name,
          percent: 100,
        };
        saveProgressItem(
          DOWNLOAD_PROGRESS_STORAGE_KEY,
          downloadKey,
          completedDownloadItem,
        );
        setDownloadProgress((current) => ({
          ...current,
          [downloadKey]: completedDownloadItem,
        }));
        const localUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = localUrl;
        link.download = record.name || record.fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notification.success({
          message: `Đã tải xuống ${record.name}`,
          key: `download_${record.id}`,
        });
      } catch (error) {
        if (
          axios.isCancel?.(error) ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          notification.info({
            message: `Đã hủy tải xuống ${record.name}`,
            key: `download_${record.id}`,
          });
          clearProgressItem(DOWNLOAD_PROGRESS_STORAGE_KEY, downloadKey);
          clearDownloadItem(downloadKey);
          return;
        }
        console.error("Download failed:", error);
        notification.error({
          message: "Không thể tải xuống file!",
          key: `download_${record.id}`,
        });
      } finally {
        delete downloadControllersRef.current[downloadKey];
        clearProgressItem(DOWNLOAD_PROGRESS_STORAGE_KEY, downloadKey);
        clearDownloadItem(downloadKey);
      }
    }
  };

  const handleDragStart = (e, record) => {
    e.dataTransfer.setData("text/plain", record.id);
    setDraggedItem(record);
  };

  const handleDragOver = (e, record) => {
    if (
      record.type === "folder" &&
      draggedItem &&
      record.id !== draggedItem.id
    ) {
      e.preventDefault();
      e.currentTarget.style.backgroundColor = "#e6f4ff";
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = "";
  };

  const handleDrop = (e, targetRecord) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "";

    if (
      targetRecord.type === "folder" &&
      draggedItem &&
      targetRecord.id !== draggedItem.id
    ) {
      let itemsToMove = selectedKeys.includes(draggedItem.id)
        ? files.filter((f) => selectedKeys.includes(f.id))
        : [draggedItem];

      if (itemsToMove.some((item) => !canEditFile(item))) {
        notification.error({
          message: "Không thể di chuyển thư mục/file cấu hình gốc!",
        });
        setDraggedItem(null);
        return;
      }

      let isLoop = false;
      for (let item of itemsToMove) {
        let currentParent = targetRecord.parentId;
        while (currentParent) {
          if (currentParent === item.id) {
            isLoop = true;
            break;
          }
          const parentFile = files.find((f) => f.id === currentParent);
          currentParent = parentFile ? parentFile.parentId : null;
        }
        if (isLoop) break;
      }

      if (isLoop) {
        notification.error({
          message: "Không thể di chuyển thư mục cha vào thư mục con",
        });
        setDraggedItem(null);
        return;
      }

      const idsToMove = itemsToMove.map((i) => i.id);
      const updatedFiles = files.map((f) =>
        idsToMove.includes(f.id) ? { ...f, parentId: targetRecord.id } : f,
      );
      setFiles(updatedFiles);
      notification.success({
        message: `Đã di chuyển ${itemsToMove.length} mục vào ${targetRecord.name}`,
      });
      setSelectedKeys([]);
    }
    setDraggedItem(null);
  };

  const handleCopy = (record = null) => {
    let itemsToCopy = [];
    if (record && !selectedKeys.includes(record.id)) {
      itemsToCopy = [record];
    } else {
      itemsToCopy = files.filter((f) => selectedKeys.includes(f.id));
    }
    if (itemsToCopy.length > 0) {
      setClipboard(itemsToCopy);
      setClipboardAction("copy");
      notification.success({ message: `Đã copy ${itemsToCopy.length} mục` });
    }
  };

  const handleCut = (record = null) => {
    let itemsToCut = [];
    if (record && !selectedKeys.includes(record.id)) {
      itemsToCut = [record];
    } else {
      itemsToCut = files.filter((f) => selectedKeys.includes(f.id));
    }

    const uneditable = itemsToCut.filter((f) => !canEditFile(f));
    if (uneditable.length > 0) {
      api.warning({
        message: `Bạn không có quyền cắt (di chuyển) một số file hệ thống.`,
      });
      return;
    }
    if (itemsToCut.length > 0) {
      setClipboard(itemsToCut);
      setClipboardAction("cut");
      notification.success({ message: `Đã cắt ${itemsToCut.length} mục` });
    }
  };

  const handlePaste = async () => {
    if (!clipboard || clipboard.length === 0) return;
    if (
      currentFolderId === null &&
      clipboard.some((item) => item.type === "file")
    ) {
      api.warning({ message: "Vui lòng mở thư mục đích trước khi dán file" });
      return;
    }

    const pastedIds = [];
    const failedItems = [];

    const copyFileToFolder = async (item, folderId) => {
      const blob = await apiClient.get(
        API_ENDPOINTS.FILE.DOWNLOAD.replace("{id}", item.id),
        { responseType: "blob" },
      );
      const shouldRename =
        clipboardAction === "copy" && item.parentId === folderId;
      const extensionIndex = item.name.lastIndexOf(".");
      const copiedName = shouldRename
        ? extensionIndex > 0
          ? `${item.name.slice(0, extensionIndex)} - Copy${item.name.slice(extensionIndex)}`
          : `${item.name} - Copy`
        : item.name;
      const copiedFile = new File([blob], copiedName, {
        type: blob?.type || "application/octet-stream",
      });
      const query = new URLSearchParams({
        projectId: String(selectedProjectId),
        folderId: String(folderId),
      });
      const response = await uploadFile(
        copiedFile,
        `${API_ENDPOINTS.FILE.UPLOAD}?${query.toString()}`,
      );
      const created = response?.data?.data ?? response?.data ?? response;
      return created?.id || created?.projectFileId || created?.fileId;
    };

    for (const item of clipboard) {
      if (clipboardAction === "cut" && item.parentId === currentFolderId) {
        failedItems.push(item);
        continue;
      }

      try {
        if (item.type === "file") {
          const newId = await copyFileToFolder(item, currentFolderId);
          if (!newId) throw new Error("API không trả về mã file vừa upload");
          pastedIds.push(newId);
        } else if (clipboardAction === "cut") {
          const moveUrl = API_ENDPOINTS.PROJECT_FOLDER.UPDATE_BY_ID.replace(
            "{projectId}",
            selectedProjectId,
          ).replace("{folderId}", item.id);
          await putRequest(moveUrl, {
            folderName: item.name,
            description: item.description || "",
            parentId: currentFolderId,
          });
          pastedIds.push(item.id);
        } else {
          const payload = {
            folderName: `${item.name}${item.parentId === currentFolderId ? " - Copy" : ""}`,
            description: item.description || "",
            parentId: currentFolderId,
          };
          const url = API_ENDPOINTS.PROJECT_FOLDER.CREATE.replace(
            "{projectId}",
            selectedProjectId,
          );
          const response = await postRequest(url, payload);
          const created = response?.data?.data ?? response?.data ?? response;
          const newId =
            created?.id || created?.projectFolderId || created?.folderId;
          if (!newId) throw new Error("API không trả về mã thư mục vừa tạo");
          pastedIds.push(newId);
        }

        // Với thao tác cắt, nguồn chỉ bị xóa sau khi đích đã tạo thành công.
        if (clipboardAction === "cut" && item.type === "file") {
          await deleteRequest(
            API_ENDPOINTS.FILE.DELETE_BY_ID.replace("{id}", item.id),
          );
        }
      } catch (error) {
        console.error("Dán file/thư mục thất bại:", error);
        failedItems.push(item);
      }
    }

    if (clipboardAction === "cut") {
      setClipboard(failedItems);
      if (failedItems.length === 0) setClipboardAction(null);
    }

    await fetchFolders();
    if (currentFolderId) await fetchFilesByFolder(currentFolderId);
    setSelectedKeys(pastedIds);

    if (pastedIds.length > 0) {
      notification.success({
        message:
          clipboardAction === "cut"
            ? `Đã di chuyển ${pastedIds.length} mục thành công`
            : `Đã dán ${pastedIds.length} mục thành công`,
      });
    }
    if (failedItems.length > 0) {
      notification.error({
        message: `${failedItems.length} mục dán thất bại`,
      });
    }
  };

  const handleFileUpload = async (file) => {
    if (currentFolderId === null) {
      api.warning({
        message: "Vui lòng mở một thư mục trước khi tải file lên",
      });
      return false;
    }

    const uploadKey = file.uid || file.name;
    dismissedUploadKeysRef.current.delete(uploadKey);
    setIsUploadHidden(false);
    const initialUploadItem = {
      key: uploadKey,
      name: file.name,
      percent: 0,
    };
    saveProgressItem(UPLOAD_PROGRESS_STORAGE_KEY, uploadKey, initialUploadItem);
    setUploadProgress((current) => ({
      ...current,
      [uploadKey]: initialUploadItem,
    }));

    {
      if (dismissedUploadKeysRef.current.has(uploadKey)) {
        clearProgressItem(UPLOAD_PROGRESS_STORAGE_KEY, uploadKey);
        clearUploadItem(uploadKey);
        return false;
      }
      try {
        const controller = new AbortController();
        const cancelSource = axios.CancelToken.source();
        uploadControllersRef.current[uploadKey] = {
          abort: () => {
            controller.abort();
            cancelSource.cancel("Canceled by user");
          },
        };
        const query = new URLSearchParams({
          projectId: String(selectedProjectId),
          folderId: String(currentFolderId),
        });
        await uploadFileMultipart(
          file,
          `${API_ENDPOINTS.FILE.UPLOAD_STREAMING}?${query.toString()}`,
          {
            timeout: 0,
            signal: controller.signal,
            cancelToken: cancelSource.token,
            onUploadProgress: (percent) => {
              if (dismissedUploadKeysRef.current.has(uploadKey)) return;
              const item = { key: uploadKey, name: file.name, percent };
              setUploadProgress((current) => ({
                ...current,
                [uploadKey]: item,
              }));
            },
          },
        );

        await fetchFilesByFolder(currentFolderId);
        if (dismissedUploadKeysRef.current.has(uploadKey)) return false;
        notification.success({
          message: `Tải lên ${file.name} thành công`,
          key: `upload_${file.uid}`,
        });
        clearProgressItem(UPLOAD_PROGRESS_STORAGE_KEY, uploadKey);
        clearUploadItem(uploadKey);
      } catch (error) {
        if (
          axios.isCancel?.(error) ||
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          notification.info({
            message: `Đã hủy tải lên ${file.name}`,
            key: `upload_${file.uid}`,
          });
          delete uploadControllersRef.current[uploadKey];
          clearProgressItem(UPLOAD_PROGRESS_STORAGE_KEY, uploadKey);
          clearUploadItem(uploadKey);
          return false;
        }
        notification.error({
          message: `Tải lên ${file.name} thất bại!`,
          key: `upload_${file.uid}`,
        });
        clearProgressItem(UPLOAD_PROGRESS_STORAGE_KEY, uploadKey);
        clearUploadItem(uploadKey);
        return false;
      }
      delete uploadControllersRef.current[uploadKey];
      clearProgressItem(UPLOAD_PROGRESS_STORAGE_KEY, uploadKey);
      clearUploadItem(uploadKey);
      return false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.ctrlKey && e.key === "c" && canMoveFile) {
        e.preventDefault();
        handleCopy();
      }
      if (e.ctrlKey && e.key === "x" && canMoveFile) {
        e.preventDefault();
        handleCut();
      }
      if (e.ctrlKey && e.key === "v" && canMoveFile) {
        e.preventDefault();
        handlePaste();
      }

      if ((e.key === "Delete" || e.key === "Backspace") && canDeleteFile) {
        if (selectedKeys.length > 0 && !deleteModalOpen) {
          const itemsToDelete = files.filter((f) =>
            selectedKeys.includes(f.id),
          );
          if (itemsToDelete.some((item) => !canEditFile(item))) {
            notification.error({
              message: "Không thể xóa các thư mục/file cấu hình gốc!",
            });
            return;
          }
          if (selectedKeys.length === 1) {
            setSelectedFile(itemsToDelete[0]);
          }
          setDeleteModalOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedKeys,
    clipboard,
    files,
    currentFolderId,
    handlePaste,
    api,
    deleteModalOpen,
  ]);

  const fileManagerContentProps = {
    viewMode,
    displayFiles,
    currentFolderId,
    openRenameModal,
    openDeleteModal,
    openPreviewModal,
    handleDownload,
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
    handleCut,
    handlePaste,
    clipboard,
    handleFileUpload,
    selectedKeys,
    setSelectedKeys,
    canEditFile,
    canRenameFile,
    canDeleteFile,
    canMoveFile,
    canDowLoadFile,
    canPreviewFile,
  };

  const breadcrumbProps = {
    items: breadcrumbItems.map((item, index) => ({
      key: index,
      title: item.title,
      className:
        index === breadcrumbItems.length - 1 ? "active" : "cursor-pointer",
      onClick: () => handleBreadcrumbClick(item.id),
    })),
  };

  const uploadItems = Object.values(uploadProgress);
  const downloadItems = Object.values(downloadProgress);
  const transferProgress = (
    <>
      <FileTransferProgress
        items={isUploadHidden ? [] : uploadItems}
        title={`Đang tải lên ${uploadItems.length} file`}
        top={16}
        zIndex={1100}
        maxBodyHeight={260}
        onClose={stopUpload}
        onCancelItem={cancelUploadItem}
      />
      <FileTransferProgress
        items={isDownloadHidden ? [] : downloadItems}
        title={`Đang tải xuống ${downloadItems.length} file`}
        top={uploadItems.length > 0 && !isUploadHidden ? 190 : 16}
        zIndex={1099}
        maxBodyHeight={260}
        onClose={stopDownload}
        onCancelItem={cancelDownloadItem}
      />
    </>
  );

  if (isComponent) {
    return (
      <div className="document-tab-wrapper">
        {transferProgress}
        <div className="project-filter-toolbar">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <Breadcrumb {...breadcrumbProps} />
            </Col>
            <Col>
              <Space>
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { value: "list", icon: <UnorderedListOutlined /> },
                    { value: "grid", icon: <AppstoreOutlined /> },
                  ]}
                />
                {canCreateFolder && currentFolderId === null && (
                  <Button
                    type="primary"
                    icon={<FolderAddOutlined />}
                    onClick={() => setFolderModalOpen(true)}
                  >
                    Tạo thư mục
                  </Button>
                )}
                {canUploadFile && currentFolderId !== null && (
                  <Upload
                    multiple={true}
                    showUploadList={false}
                    beforeUpload={handleFileUpload}
                  >
                    <Button type="primary" icon={<UploadOutlined />}>
                      Tải lên
                    </Button>
                  </Upload>
                )}
              </Space>
            </Col>
          </Row>
        </div>
        <PageContainer>
          <Spin spinning={filesLoading} tip="Đang tải danh sách tài liệu...">
            <FileManagerContent {...fileManagerContentProps} />
          </Spin>
        </PageContainer>
        <FilePreview
          url={previewFile}
          onClose={() => setPreviewFile(null)}
          canDownload={canDowLoadFile}
        />
      </div>
    );
  }

  return (
    <PageContainer
      title="Quản lý File"
      subtitle={<Breadcrumb {...breadcrumbProps} />}
      searchPlaceholder="Tìm kiếm file/thư mục..."
      searchValue={searchText}
      onSearch={setSearchText}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      actionButtons={
        <Space>
          <Select
            style={{ width: 250, fontWeight: "normal", fontSize: 14 }}
            value={selectedProjectId}
            onChange={(val) => {
              setSelectedProjectId(val);
              setCurrentFolderId(null);
              setSearchText("");
            }}
            options={dataProject.map((p) => ({ label: p.name, value: p.id }))}
            placeholder="Chọn dự án..."
            showSearch
            optionFilterProp="label"
          />
          {canCreateFolder && currentFolderId === null && (
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => setFolderModalOpen(true)}
            >
              Tạo thư mục
            </Button>
          )}
          {canUploadFile && currentFolderId !== null && (
            <Upload
              multiple={true}
              showUploadList={false}
              beforeUpload={handleFileUpload}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                Tải lên
              </Button>
            </Upload>
          )}
        </Space>
      }
    >
      {transferProgress}
      <Spin spinning={filesLoading} tip="Đang tải danh sách tài liệu...">
        <FileManagerContent {...fileManagerContentProps} />
      </Spin>
      <FilePreview
        url={previewFile}
        onClose={() => setPreviewFile(null)}
        canDownload={canDowLoadFile}
      />
    </PageContainer>
  );
};

export default FileManager;
