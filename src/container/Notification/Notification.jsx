import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  List,
  notification,
  Popconfirm,
  Popover,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  ProjectOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { APP_COLORS } from "../../constants/colors";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import {
  deleteRequest,
  // getRequest,
  // postRequest,
  putRequest,
} from "../../services/baseService";
import { toast } from "../../utils/notification";
// Tam dong hub notification.
// import signalRService, {
//   NOTIFICATION_HUB_URL,
// } from "../../services/signalRService";
import dayjs from "dayjs";
import { useNotificationContext } from "../../contexts/NotificationContext";
import { useAppSelector } from "../../store/hooks";
import ModalConfirm from "../../components/core/common/ModalConfirm";

const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = ["20", "50", "100", "200"];

const normalizeNotification = (item = {}) => ({
  ...item,
  notifId: item.notifId ?? item.NotifId,
  type: item.type ?? item.Type ?? "",
  title: item.title ?? item.Title ?? "",
  content: item.content ?? item.Content ?? "",
  isRead: item.isRead ?? item.IsRead ?? false,
  entityId: item.entityId ?? item.EntityId,
  projectId: item.projectId ?? item.ProjectId,
  createdDate: item.createdDate ?? item.CreatedDate,
});

const extractNotificationItems = (payload) => {
  const result = Array.isArray(payload?.data)
    ? payload
    : (payload?.data ?? payload);
  const items = Array.isArray(result)
    ? result
    : result?.items || result?.data || result?.notifications || [];
  return {
    items: items.map(normalizeNotification),
    total: result?.total ?? result?.totalCount ?? items.length,
    page: result?.page ?? result?.currentPage ?? 1,
    pageSize: result?.pageSize ?? DEFAULT_PAGE_SIZE,
  };
};

const formatCreatedAt = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getNotificationAppearance = (title = "") => {
  const normalizedTitle = title.trim().toLocaleLowerCase("vi-VN");

  switch (true) {
    case normalizedTitle.includes("comment"):
    case normalizedTitle.includes("bình luận"):
      return { icon: <MessageOutlined />, color: APP_COLORS.BLUE[300] };

    case normalizedTitle.includes("task"):
    case normalizedTitle.includes("công việc"):
      return { icon: <CheckCircleOutlined />, color: APP_COLORS.SUCCESS };

    case normalizedTitle.includes("dự án"):
    case normalizedTitle.includes("project"):
      return { icon: <ProjectOutlined />, color: APP_COLORS.SECONDARY };

    case normalizedTitle.includes("nhắc nhở"):
    case normalizedTitle.includes("sắp đến hạn"):
    case normalizedTitle.includes("quá hạn"):
      return { icon: <ClockCircleOutlined />, color: APP_COLORS.WARNING };

    case normalizedTitle.includes("cập nhật"):
    case normalizedTitle.includes("thay đổi"):
      return { icon: <SyncOutlined />, color: APP_COLORS.PRIMARY_DARK };

    default:
      return { icon: <InfoCircleOutlined />, color: APP_COLORS.PRIMARY };
  }
};

const isTaskNotification = (item = {}) => {
  const title = String(item.title || "")
    .trim()
    .toLocaleLowerCase("vi-VN");
  const entityType = String(
    item.entityType ||
      item.EntityType ||
      item.entityName ||
      item.EntityName ||
      "",
  )
    .trim()
    .toLocaleLowerCase("vi-VN");

  return (
    entityType.includes("task") ||
    entityType.includes("công việc") ||
    title.includes("task") ||
    title.includes("công việc") ||
    Boolean(item.entityId || item.EntityId || item.taskId || item.idTask)
  );
};

const Notification = () => {
  const {
    notifications = [],
    setNotifications,
    unreadCount = 0,
    setUnreadCount,
    total = 0,
    setTotal,
    loading = false,
    setLoading,
  } = useNotificationContext();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showUnreadTasks, setShowUnreadTasks] = useState(false);
  const authUser = useAppSelector((state) => state.auth.user) || {};
  const [isDelete, setIsDelete] = useState(false);

  const fetchAllNotifications = useCallback(
    async (
      requestedPage = 1,
      requestedPageSize = DEFAULT_PAGE_SIZE,
      showAll = true,
    ) => {
      setLoading(true);
      try {
        // Tam dong API get thong bao.
        // const [response, unreadCountResponse] = await Promise.all([
        //   getRequest(
        //     showAll
        //       ? API_ENDPOINTS.NOTIFICATION.GET_ALL
        //       : API_ENDPOINTS.NOTIFICATION.GET_UNREAD,
        //     showAll
        //       ? {
        //           page: requestedPage,
        //           pageSize: requestedPageSize,
        //         }
        //       : undefined,
        //   ),
        //   getRequest(API_ENDPOINTS.NOTIFICATION.GET_UNREAD_COUNT),
        // ]);
        const response = {
          items: [],
          total: 0,
          page: requestedPage,
          pageSize: requestedPageSize,
        };
        const unreadCountResponse = 0;

        const result = extractNotificationItems(response);
        setNotifications(result.items);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize ?? requestedPageSize);
        setUnreadCount(
          typeof unreadCountResponse === "number"
            ? unreadCountResponse
            : (unreadCountResponse?.count ??
                unreadCountResponse?.unreadCount ??
                unreadCountResponse?.data ??
                0),
        );
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
        setNotifications([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Tam dong API /hubs/notification/negotiate.
  // useEffect(() => {
  //   let unsubscribe;
  //   let disposed = false;
  //
  //   const subscribeToNotifications = async () => {
  //     try {
  //       unsubscribe = await signalRService.on(
  //         "ReceiveNotification",
  //         async (payload) => {
  //           if (disposed || !payload) return;
  //
  //           const notification = normalizeNotification(payload);
  //           const notifId = notification.notifId;
  //
  //           if (notifId) {
  //             try {
  //               await postRequest(API_ENDPOINTS.NOTIFICATION.ACK, {
  //                 notificationId: notifId,
  //               });
  //             } catch (error) {
  //               console.error("Không thể xác nhận thông báo realtime:", error);
  //             }
  //           }
  //
  //           const normalizedPayload = {
  //             ...notification,
  //             notifId: notifId || `realtime-${Date.now()}`,
  //             isRead: false,
  //           };
  //
  //           setNotifications((current) => {
  //             if (
  //               notifId &&
  //               current.some((notification) => notification.notifId === notifId)
  //             ) {
  //               return current;
  //             }
  //
  //             return [normalizedPayload, ...current].slice(0, pageSize);
  //           });
  //
  //           setTotal((value) => value + 1);
  //           setUnreadCount((value) => value + 1);
  //         },
  //         NOTIFICATION_HUB_URL,
  //       );
  //     } catch (error) {
  //       console.error("Không thể kết nối SignalR notification:", error);
  //     }
  //   };
  //
  //   subscribeToNotifications();
  //
  //   return () => {
  //     disposed = true;
  //     unsubscribe?.();
  //   };
  // }, [pageSize]);

  const markAsRead = async (item) => {
    if (item.isRead) return;

    try {
      const notificationId = item.notifId || item.notificationId || item.id;
      await putRequest(
        API_ENDPOINTS.NOTIFICATION.MARK_AS_READ.replace("{id}", notificationId),
      );

      setNotifications((current) =>
        current.map((notification) =>
          (notification.notifId ||
            notification.notificationId ||
            notification.id) === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Không thể đánh dấu thông báo đã đọc:", error);
      toast.error("Không thể đánh dấu thông báo đã đọc.");
    }
  };

  const getNotificationTaskId = (item) =>
    item?.entityId || item?.EntityId || item?.taskId || item?.idTask;

  const handleNotificationClick = async (item) => {
    await markAsRead(item);

    const taskId = getNotificationTaskId(item);
    if (taskId) {
      setNotificationOpen(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await putRequest(API_ENDPOINTS.NOTIFICATION.MARK_ALL_AS_READ);
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Không thể đánh dấu tất cả thông báo đã đọc:", error);
      toast.error("Không thể đánh dấu tất cả thông báo đã đọc.");
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const userId = authUser.userId;
      await deleteRequest(
        API_ENDPOINTS.NOTIFICATION.DELETE_ALL.replace("{id}", userId),
      );
      setNotifications([]);
      setTotal(0);
      setUnreadCount(0);
    } catch (error) {
      console.log(error);
      toast.error("Không thể xóa tất cả thông báo.");
    }
  };

  const deleteNotification = async (event, item) => {
    event.stopPropagation();

    try {
      const notificationId = item.notifId || item.notificationId || item.id;

      await deleteRequest(
        API_ENDPOINTS.NOTIFICATION.DELETE_BY_ID.replace("{id}", notificationId),
      );

      if (!item.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      const nextPage = notifications.length === 1 && page > 1 ? page - 1 : page;
      await fetchAllNotifications(nextPage, pageSize, !showUnreadTasks);
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      toast.error("Không thể xóa thông báo.");
    }
  };

  useEffect(() => {
    fetchAllNotifications(1, pageSize, !showUnreadTasks);
  }, [fetchAllNotifications, pageSize, showUnreadTasks]);

  const handleToggleMode = (nextShowUnreadTasks) => {
    setShowUnreadTasks(nextShowUnreadTasks);
    fetchAllNotifications(1, pageSize, !nextShowUnreadTasks);
  };

  const handlePaginationChange = async (nextPage, nextPageSize) => {
    const resolvedPage = nextPageSize !== pageSize ? 1 : nextPage;
    await fetchAllNotifications(resolvedPage, nextPageSize, !showUnreadTasks);
  };

  const unreadTaskNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.isRead && isTaskNotification(notification),
      ),
    [notifications],
  );

  const displayNotifications = notifications;

  const displayTotal = total;

  const [notificationApi, contextHolder] = notification.useNotification();

  const showBrowserNotification = async (log) => {
    const permission = await window.Notification.requestPermission();

    if (permission !== "granted") return;
    const notification = new window.Notification("Thông báo chấm công 🔔", {
      body: log?.content,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const TaskNotificationContent = ({ log }) => {
    return (
      <>
        <div className="task-notification__title">🔔 {log?.title}</div>

        <div className="task-notification__content">{log?.content}</div>
      </>
    );
  };

  const showNewTaskNotification = (log) => {
    notificationApi.info({
      message: <TaskNotificationContent log={log} />,
      placement: "topRight",
      duration: 0,
      key: "new-task-notification",

      style: {
        width: 400,
        background: "linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)",
        border: "1px solid #91caff",
        borderLeft: "5px solid #1677ff",
        borderRadius: 12,
        padding: "16px 20px",
      },
      placement: "topRight",
      duration: 0,
      key: "new-task-notification",

      style: {
        width: 400,
        background: "linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)",
        border: "1px solid #91caff",
        borderLeft: "5px solid #1677ff",
        borderRadius: 12,
        padding: "16px 20px",
      },
      onClose: async () => {
        try {
          const notificationId = log?.notifId;

          if (!notificationId || log?.isRead) return;
          await putRequest(
            API_ENDPOINTS.NOTIFICATION.MARK_AS_READ.replace(
              "{id}",
              notificationId,
            ),
          );
          // Cập nhật state local
          setNotifications((current) =>
            current.map((item) =>
              item?.notifId === notificationId
                ? { ...item, isRead: true }
                : item,
            ),
          );
          setUnreadCount((count) => Math.max(0, count - 1));
        } catch (error) {
          console.error("Không thể đánh dấu notification đã đọc:", error);
        }
      },
    });
  };

  useEffect(() => {
    const dailyLogReminders = notifications?.filter(
      (item) => item?.isRead === false && item?.type === "DailyLogReminder",
    );
    dailyLogReminders?.forEach((item) => {
      showNewTaskNotification(item);
      // showBrowserNotification(item);
    });
  }, [notifications]);

  return (
    <>
      <Popover
        rootClassName="notification-popover"
        title={
          <div className="notification-header">
            <span>
              {showUnreadTasks
                ? `Thông báo chưa đọc (${unreadTaskNotifications.length})`
                : `Tất cả thông báo (${total})`}
            </span>
            <div className="notification-header-actions">
              {showUnreadTasks ? (
                <Button
                  type={"link"}
                  size="small"
                  onClick={() => handleToggleMode(false)}
                >
                  Tất cả
                </Button>
              ) : (
                <Button
                  type={showUnreadTasks ? "primary" : "link"}
                  size="small"
                  onClick={() => handleToggleMode(true)}
                >
                  {/* chưa đọc ({unreadTaskNotifications.length}) */}
                  Chưa đọc
                </Button>
              )}

              {unreadCount > 0 && (
                <Button type="link" size="small" onClick={markAllAsRead}>
                  Đọc tất cả
                </Button>
              )}
              <Popconfirm
                open={isDelete}
                title="Xác nhận xóa tất cả thông báo"
                description="Bạn có muốn xóa tất cả thông báo?"
                okText="Đồng ý"
                cancelText="Hủy"
                placement="bottomRight"
                getPopupContainer={(triggerNode) =>
                  triggerNode.closest(".notification-popover") ||
                  triggerNode.parentElement ||
                  document.body
                }
                onPopupClick={(event) => event.stopPropagation()}
                onConfirm={async (event) => {
                  event?.stopPropagation?.();
                  await deleteAllNotifications();
                  setIsDelete(false);
                }}
                onCancel={(event) => {
                  event?.stopPropagation?.();
                  setIsDelete(false);
                }}
              >
                {" "}
                {displayNotifications?.length > 0 && (
                  <Button
                    type="link"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsDelete(true);
                    }}
                  >
                    Xóa tất cả
                  </Button>
                )}
              </Popconfirm>
            </div>
          </div>
        }
        content={
          <div className="notification-content">
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={displayNotifications}
              pagination={
                displayTotal > DEFAULT_PAGE_SIZE
                  ? {
                      current: page,
                      pageSize,
                      total: displayTotal,
                      size: "small",
                      showSizeChanger: true,
                      pageSizeOptions: PAGE_SIZE_OPTIONS,
                      showTotal: (value) => `${value} thông báo`,
                      onChange: handlePaginationChange,
                      onShowSizeChange: handlePaginationChange,
                      hideOnSinglePage: false,
                    }
                  : false
              }
              locale={{
                emptyText: (
                  <Empty
                    description={
                      showUnreadTasks
                        ? "Không có thông báo chưa đọc"
                        : "Không có thông báo"
                    }
                  />
                ),
              }}
              renderItem={(item) => {
                const appearance = getNotificationAppearance(item.title);
                const isRead = item.isRead;

                return (
                  <List.Item
                    key={item.notifId || item.notificationId || item.id}
                    className={`notification-item ${
                      isRead ? "read" : "unread"
                    } notif-item-hover`}
                    onClick={() => handleNotificationClick(item)}
                    actions={[
                      <Tooltip title="Xóa" key="delete">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(event) => deleteNotification(event, item)}
                        />
                      </Tooltip>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={appearance.icon}
                          style={{ backgroundColor: appearance.color }}
                        />
                      }
                      title={
                        <div>
                          <span
                            className={`notification-title ${
                              isRead ? "read" : "unread"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span style={{ paddingLeft: "10px" }}>
                            {dayjs(item?.createdDate).format(
                              "DD/MM/YYYY HH:mm",
                            )}
                          </span>
                        </div>
                      }
                      description={
                        <div>
                          <div
                            className={`notification-description-content ${
                              isRead ? "read" : "unread"
                            }`}
                          >
                            {item.content}
                          </div>
                          <div
                            className={`notification-description-date ${
                              isRead ? "read" : "unread"
                            }`}
                          >
                            {formatCreatedAt(item.createdAt)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        }
        trigger="click"
        placement="bottomRight"
        open={notificationOpen}
        onOpenChange={(open) => {
          setNotificationOpen(open);
          if (open) {
            fetchAllNotifications(page, pageSize, !showUnreadTasks);
          }
        }}
      >
        <Badge count={unreadCount} size="small" overflowCount={99}>
          <Avatar
            shape="circle"
            icon={<BellOutlined />}
            className="notification-bell-avatar"
          />
        </Badge>
      </Popover>
      {contextHolder}
    </>
  );
};

export default Notification;

