import React from "react";
import { Layout, Dropdown, Space, Avatar, Button } from "antd";
import { useNavigate } from "react-router-dom";
import {
	UserOutlined,
	LogoutOutlined,
	MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { logout } from "../../../../store/slice/authSlice";
import { authService } from "../../../../services/authService";
import { APP_COLORS } from "../../../../constants/colors";
import Notification from "../../../../container/Notification/Notification";
import { MAIN_ROUTES } from "../../../../routers/constants";
import { useNotificationContext } from "../../../../contexts/NotificationContext";

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, isMobile }) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { user } = useAppSelector((state) => state.auth);
	const { clearNotifications } = useNotificationContext();

	const handleLogout = async () => {
		try {
			await authService.logout();
			// xóa hết localstorage
			Object.keys(localStorage).forEach((key) => {
				localStorage.setItem(key, null);
			});
		} catch (error) {
			console.log("Call API logout failed:", error);
		} finally {
			clearNotifications();
			dispatch(logout());
		}
	};
	const userName =
		user?.name ||
		user?.fullName ||
		user?.userName ||
		user?.username ||
		user?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
		"Người dùng";
	const userEmail =
		user?.email ||
		user?.[
			"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
		] ||
		"";

	const items = [
		{
			key: "info",
			label: (
				<div style={{ padding: "4px 0", minWidth: 150 }}>
					<div style={{ fontWeight: 600, color: APP_COLORS.TEXT_MAIN }}>
						{userName}
					</div>
					{userEmail && (
						<div
							style={{
								fontSize: 12,
								color: APP_COLORS.TEXT_SECONDARY,
								marginTop: 4,
							}}
						>
							{userEmail}
						</div>
					)}
				</div>
			),
			disabled: true,
			style: { cursor: "default" },
		},
		{ type: "divider" },
		{
			key: "profile",
			icon: <UserOutlined />,
			label: "Hồ sơ cá nhân",
			onClick: () => navigate(MAIN_ROUTES.PROFILE),
		},
		{ type: "divider" },
		{
			key: "logout",
			danger: true,
			icon: <LogoutOutlined />,
			label: "Đăng xuất",
			onClick: handleLogout,
		},
	];

	return (
		<Header
			className="app-header"
			style={{
				background: APP_COLORS.BG_HEADER,
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				position: "sticky",
				top: 0,
				zIndex: 10,
				borderBottom: `1px solid ${APP_COLORS.BORDER}`,
				padding: "0 24px",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					flex: 1,
					minWidth: 0,
					gap: 16,
					overflow: "hidden",
				}}
			>
				{isMobile && (
					<Button
						type="text"
						icon={<MenuUnfoldOutlined />}
						onClick={() => setCollapsed(false)}
						style={{
							fontSize: "18px",
							width: 32,
							height: 32,
							padding: 0,
							flexShrink: 0,
							color: APP_COLORS.TEXT_SECONDARY,
						}}
					/>
				)}

				<div
					className="header-title"
					style={{
						fontSize: 16,
						fontWeight: 600,
						color: APP_COLORS.TEXT_MAIN,
						textTransform: "uppercase",
						letterSpacing: "0.5px",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					HỆ THỐNG QUẢN LÝ GIAO VIỆC MÁY
				</div>
			</div>

			<Space size="large" style={{ flexShrink: 0, marginLeft: 16 }}>
				<Notification />
				<Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
					<div
						style={{
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: "4px 12px",
							borderRadius: 24,
							transition: "background 0.3s",
						}}
						className="header-user-dropdown"
					>
						<Avatar
							size="small"
							style={{ backgroundColor: APP_COLORS.PRIMARY }}
							icon={<UserOutlined />}
						/>
						<span
							style={{
								fontWeight: 500,
								color: APP_COLORS.TEXT_MAIN,
								fontSize: 14,
							}}
							className="header-user-name"
						>
							{userName}
						</span>
					</div>
				</Dropdown>
			</Space>
		</Header>
	);
};

export default AppHeader;
