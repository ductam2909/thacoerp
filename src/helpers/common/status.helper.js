import { useCallback, useEffect, useMemo, useState } from "react";
import colors from "../../assets/scss/variables.scss";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { getRequest } from "../../services/baseService";

export const getStatusTaskConfig = (status) => {
  switch (Number(status)) {
    case 0:
      return {
        color: colors.colorPurple100,
        fontColor: colors.colorPurple500,
        label: "Mới tạo",
      };
    case 1:
      return {
        color: colors.colorPrimary50,
        fontColor: colors.colorPrimary600,
        label: "Đang triển khai",
      };
    case 2:
      return {
        color: colors.colorWarning100,
        fontColor: colors.colorWarning600,
        label: "Tạm dừng",
      };
    case 3:
      return {
        color: colors.colorSuccess100,
        fontColor: colors.colorSuccess600,
        label: "Hoàn thành",
      };
    case 4:
      return {
        color: colors.colorGray100,
        fontColor: colors.colorGray600,
        label: "Đã hủy",
      };
    default:
      return {
        color: colors.colorGray100,
        fontColor: colors.colorGray500,
        label: status || "Không xác định",
      };
  }
};

export const statusTaskOptions = [
  { value: 0, label: "Mới tạo" },
  { value: 1, label: "Đang xử lý" },
  { value: 2, label: "Tạm dừng" },
  { value: 3, label: "Hoàn thành" },
  { value: 4, label: "Đã hủy" },
];

let cachedStatusCatalog = [];
let statusCatalogPromise = null;

const normalizeStatusValue = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
};

const normalizeHex = (value) => {
  if (!value || typeof value !== "string") return "";

  const normalized = value.trim().toUpperCase();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
};

const parseBackground = (
  backgroundValue,
  fallbackColor = colors.colorGray100,
) => {
  const raw = String(backgroundValue || "").trim();

  if (!raw) {
    return {
      color: fallbackColor,
      background: fallbackColor,
      rawBackground: fallbackColor,
    };
  }

  const [startRaw, endRaw] = raw.split(":");
  const start = normalizeHex(startRaw) || fallbackColor;
  const end = normalizeHex(endRaw) || start;

  return {
    color: start,
    background:
      start === end
        ? start
        : `linear-gradient(90deg, ${start} 0%, ${end} 100%)`,
    rawBackground: raw.includes(":") ? `${start}:${end}` : start,
  };
};

const mapStatusItem = (item) => {
  const code =
    item?.statusCode ??
    item?.code ??
    item?.value ??
    item?.statusId ??
    item?.id ??
    "";

  const value =
    item?.value ??
    item?.code ??
    item?.statusCode ??
    item?.id ??
    "";

  const { color, background, rawBackground } = parseBackground(
    item?.background ??
      item?.colorBackground ??
      item?.backgroundColor,
  );

  return {
    ...item,
    id: item?.id ?? "",
    statusId: item?.statusId ?? item?.id ?? "",
    statusCode: item?.statusCode ?? item?.code ?? "",
    value,
    code,
    label: item?.name ?? item?.label ?? "Không xác định",
    name: item?.name ?? item?.label ?? "",
    description: item?.description ?? "",
    fontColor:
      normalizeHex(item?.colorText ?? item?.fontColor) ||
      colors.colorGray500,
    color,
    background,
    rawBackground,
    isActive: item?.isActive ?? true,
    isDefault: item?.isDefault ?? false,
  };
};

const STATUS_LIST_KEYS = [
  "data",
  "items",
  "result",
  "results",
  "content",
  "records",
  "rows",
  "list",
  "projectStatusConfigs",
  "statusConfigs",
];

const extractStatusList = (response, depth = 0) => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object" || depth > 5) return [];

  for (const key of STATUS_LIST_KEYS) {
    if (!(key in response)) continue;

    const list = extractStatusList(response[key], depth + 1);

    if (list.length > 0 || Array.isArray(response[key])) {
      return list;
    }
  }

  return [];
};

const mapStatusResponse = (response) =>
  extractStatusList(response)
    .filter((item) => item?.isActive !== false)
    .map(mapStatusItem);

export const fetchStatusCatalog = async (force = false) => {
  if (!force && cachedStatusCatalog.length > 0) {
    return cachedStatusCatalog;
  }

  if (!force && statusCatalogPromise) {
    return statusCatalogPromise;
  }

  statusCatalogPromise = getRequest(API_ENDPOINTS.STATUS.GET_ALL)
    .then((response) => {
      cachedStatusCatalog = mapStatusResponse(response);
      return cachedStatusCatalog;
    })
    .catch((error) => {
      console.error("Lỗi khi tải danh mục trạng thái:", error);
      cachedStatusCatalog = [];
      return [];
    })
    .finally(() => {
      statusCatalogPromise = null;
    });

  return statusCatalogPromise;
};

const findStatusConfig = (catalog, status) => {
  if (status === null || status === undefined || status === "") {
    return undefined;
  }

  const normalizedStatus = normalizeStatusValue(status);

  return catalog.find((item) =>
    [
      item.id,
      item.statusId,
      item.value,
      item.code,
      item.statusCode,
      item.label,
      item.name,
    ].some(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        normalizeStatusValue(value) === normalizedStatus,
    ),
  );
};

const createStatusConfig = (matched, status) => {
  if (!matched) {
    return {
      color: colors.colorGray100,
      background: colors.colorGray100,
      rawBackground: colors.colorGray100,
      fontColor: colors.colorGray500,
      label:
        status !== null && status !== undefined && status !== ""
          ? String(status)
          : "Không xác định",
    };
  }

  return {
    id: matched.id,
    statusId: matched.statusId,
    code: matched.code,
    statusCode: matched.statusCode,
    value: matched.value,
    color: matched.color,
    background: matched.background,
    rawBackground: matched.rawBackground,
    fontColor: matched.fontColor,
    label: matched.label,
  };
};

export const getStatusConfig = (status) =>
  createStatusConfig(
    findStatusConfig(cachedStatusCatalog, status),
    status,
  );

export const useStatusCatalog = () => {
  const [catalog, setCatalog] = useState(() => cachedStatusCatalog);

  useEffect(() => {
    let mounted = true;

    fetchStatusCatalog().then((data) => {
      if (mounted) {
        setCatalog(Array.isArray(data) ? data : []);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(
    () =>
      catalog.map((item) => ({
        value: item.statusId || item.id || item.code || item.value,
        label: item.label,
        description: item.description,
        code: item.code,
        id: item.id,
        statusId: item.statusId,
        statusCode: item.statusCode,
      })),
    [catalog],
  );

  const getConfig = useCallback(
    (status) =>
      createStatusConfig(
        findStatusConfig(catalog, status),
        status,
      ),
    [catalog],
  );

  const findStatusOption = useCallback(
    (status) => findStatusConfig(catalog, status),
    [catalog],
  );

  return {
    statusCatalog: catalog,
    statusOptions: options,
    getStatusConfig: getConfig,
    findStatusOption,
  };
};