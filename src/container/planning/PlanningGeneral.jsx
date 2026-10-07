/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Space, Table, Tag, message } from "antd";
import PageContainer from "../../components/core/common/PageContainer";
import { API_ENDPOINTS } from "src/constants/apiEndpoints";
import { getRequest } from "../../services/baseService";

const emptyText = <span style={{ color: "#8c8c8c" }}>--</span>;

const getFirstValue = (record, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => {
      if (current === undefined || current === null) return undefined;
      return current[part];
    }, record);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const renderText = (value, fallback = emptyText) => value || fallback;

const renderMachines = (_, record) => {
  const value = getFirstValue(record, [
    "workPlan.machineCode",
    "workPlan.machineName",
    "plan.machineCode",
    "plan.machineName",
    "machineCode",
    "machineName",
  ]);

  if (!value) return emptyText;

  const machines = Array.isArray(value)
    ? value
    : String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return (
    <Space wrap size={4} style={{ justifyContent: "center" }}>
      {machines.map((machine, index) => (
        <Tag key={`${machine}-${index}`} color="cyan" style={{ margin: 2 }}>
          {machine}
        </Tag>
      ))}
    </Space>
  );
};

const PlanningGeneral = () => {
  const [workPlans, setWorkPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  const fetchWorkPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        Page: pagination.current,
        PageSize: pagination.pageSize,
      };
      const searchText = keyword.trim();
      if (searchText) {
        params.Search = searchText;
      }

      const response = await getRequest(API_ENDPOINTS.PLANNING.GET_ALL, params);
      const result = response?.data ?? response;
      const data = result?.data ?? result;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(result?.items)
            ? result.items
            : [];

      const totalCount = Number(
        data?.totalCount ??
          data?.total ??
          data?.count ??
          result?.totalCount ??
          result?.total ??
          result?.count ??
          items.length,
      );

      setWorkPlans(items);
      setTotal(totalCount);
    } catch (error) {
      console.error("Failed to fetch work plans:", error);
      setWorkPlans([]);
      setTotal(0);
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tải danh sách kế hoạch tổng.",
      );
    } finally {
      setLoading(false);
    }
  }, [keyword, pagination.current, pagination.pageSize]);

  useEffect(() => {
    const timer = setTimeout(fetchWorkPlans, 400);
    return () => clearTimeout(timer);
  }, [fetchWorkPlans]);

  const columns = useMemo(
    () => [
      {
        title: "Stt",
        key: "stt",
        width: 65,
        align: "center",
        render: (_, __, index) =>
          ((pagination.current || 1) - 1) * (pagination.pageSize || 10) +
          index +
          1,
      },
      {
        title: "Lệnh sản xuất",
        key: "productionCommandCode",
        width: 180,
        ellipsis: true,
        render: (_, record) => {
          const codes =
            record.productionCommands?.map(
              (item) => item.productionCommandCode,
            ) ??
            getFirstValue(record, [
              "productionCommandCode",
              "commandCode",
              "lsxCode",
            ]);

          return renderText(Array.isArray(codes) ? codes.join(", ") : codes);
        },
      },
      {
        title: "Mã file",
        key: "cuttingFileCode",
        width: 180,
        ellipsis: true,
        render: (_, record) =>
          renderText(
            getFirstValue(record, [
              "cuttingFileCode",
              "fileCode",
              "cutFileCode",
              "code",
            ]),
          ),
      },
      {
        title: "Kế hoạch giao việc",
        key: "workPlan",
        children: [
          {
            title: "Máy",
            key: "workPlanMachine",
            width: 140,
            align: "center",
            render: renderMachines,
          },
          {
            title: "Tg Bắt đầu",
            key: "workPlanStartTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "workPlan.startTime",
                  "plan.startTime",
                  "assignedStartTime",
                  "startTime",
                ]),
              ),
          },
          {
            title: "Tg Kết thúc",
            key: "workPlanEndTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "workPlan.endTime",
                  "plan.endTime",
                  "assignedEndTime",
                  "endTime",
                ]),
              ),
          },
        ],
      },
      {
        title: "Kế hoạch theo phân bổ",
        key: "allocationPlan",
        children: [
          {
            title: "Tg cấp phôi",
            key: "materialSupplyTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "allocationPlan.materialSupplyTime",
                  "allocation.materialSupplyTime",
                  "materialSupplyTime",
                  "blankSupplyTime",
                ]),
              ),
          },
          {
            title: "Tg bắt đầu",
            key: "allocationStartTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "allocationPlan.startTime",
                  "allocation.startTime",
                  "allocatedStartTime",
                ]),
              ),
          },
          {
            title: "Tg Kết thúc",
            key: "allocationEndTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "allocationPlan.endTime",
                  "allocation.endTime",
                  "allocatedEndTime",
                ]),
              ),
          },
        ],
      },
      {
        title: "Kế hoạch thực tế",
        key: "actualPlan",
        children: [
          {
            title: "Tg bắt đầu",
            key: "actualStartTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "actualPlan.startTime",
                  "actual.startTime",
                  "actualStartTime",
                ]),
              ),
          },
          {
            title: "TG kết thúc",
            key: "actualEndTime",
            width: 150,
            align: "center",
            render: (_, record) =>
              renderText(
                getFirstValue(record, [
                  "actualPlan.endTime",
                  "actual.endTime",
                  "actualEndTime",
                ]),
              ),
          },
        ],
      },
    ],
    [pagination.current, pagination.pageSize],
  );

  const handleSearch = (value) => {
    setKeyword(value);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  return (
    <PageContainer
      className="nesting-page machine-page"
      title="Kế hoạch Tổng"
      searchPlaceholder="Tìm theo lệnh sản xuất, mã file..."
      searchValue={keyword}
      onSearch={handleSearch}
      hideScroll={true}
    >
      <Table
        bordered
        className="table-cut-file"
        columns={columns}
        dataSource={workPlans}
        rowKey={(record) =>
          record.id ?? record.planningId ?? record.cuttingFileId ?? record.code
        }
        loading={loading}
        size="small"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ["50", "100", "200", "500"],
          showTotal: (totalCount) => `Tổng số ${totalCount} kế hoạch`,
          size: "small",
          style: { marginTop: 8 },
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              current: prev.pageSize !== pageSize ? 1 : page,
              pageSize,
            }));
          },
        }}
        scroll={{ x: 1365, y: "calc(100vh - 280px)" }}
      />
    </PageContainer>
  );
};

export default PlanningGeneral;
