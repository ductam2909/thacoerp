export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    LOGOUT: "/api/Auth/logout",
    CHANGE_PASSWORD: "/api/Auth/change-password",
  },

  MENU: {
    GET_ALL: "/api/Menu",
    MY_MENUS: "/api/Menu/my-menus",
    CREATE: "/api/Menu",
    UPDATE_BY_ID: "/api/Menu/{id}",
    DELETE_BY_ID: "/api/Menu/{id}",
  },

  NOTIFICATION: {
    GET_ALL: "/api/Notification",
    GET_UNREAD: "/api/Notification/unread",
    GET_UNREAD_COUNT: "/api/Notification/unread-count",
    ACK: "/api/Notification/ack",
    MARK_AS_READ: "/api/Notification/{id}/read",
    MARK_ALL_AS_READ: "/api/Notification/read-all",
    DELETE_BY_ID: "/api/Notification/{id}",
    DELETE_ALL: "/api/Notification/{id}/delete-all",
  },

  DEPARTMENT: {
    GET_ALL: "/api/Department",
  },

  PERMISSION: {
    GET_ALL: "/api/Permission",
    GET_BY_POSITION: "/api/Permission/position/{positionId}",
    CREATE: "/api/Permission",
    UPDATE_BY_ID: "/api/Permission/{permissionId}",
    DELETE_BY_ID: "/api/Permission/{permissionId}",
    ASSIGN_POSITION: "/api/Permission/assign-position",
  },

  POSITION: {
    GET_ALL: "/api/Position",
    CREATE: "/api/Position",
    GET_BY_ID: "/api/Position/{positionId}",
    UPDATE_BY_ID: "/api/Position/{positionId}",
    DELETE_BY_ID: "/api/Position/{positionId}",
  },

  MACHINE: {
    GET_ALL: "/api/Machine",
    GET_BY_ID: "/api/Machine/{id}",
    CREATE: "/api/Machine",
    UPDATE_BY_ID: "/api/Machine/{id}",
    DELETE_BY_ID: "/api/Machine/{id}",
  },

  MACHINE_OPERATOR: {
    GET_BY_USER: "/api/machine-operator/user/{userId}",
    GET_BY_MACHINE: "/api/machine-operator/machine/{machineId}",
    MY_MACHINES: "/api/machine-operator/my-machines",
    ASSIGN_MACHINES: "/api/machine-operator/assign-machines",
    DELETE_BY_MACHINE_USER: "/api/machine-operator/{machineId}/{userId}",
  },

  WORK_SHIFT: {
    GET_ALL: "/api/WorkShift",
    GET_BY_ID: "/api/WorkShift/{id}",
    CREATE: "/api/WorkShift",
    UPDATE_BY_ID: "/api/WorkShift/{id}",
    DELETE_BY_ID: "/api/WorkShift/{id}",
    GET_MACHINES: "/api/WorkShift/{workShiftId}/machines",
    ASSIGN_MACHINES: "/api/WorkShift/assign-machines",
    DELETE_MACHINE: "/api/WorkShift/{workShiftId}/machines/{machineId}",
  },
  PRODUCTION_COMMAND: {
  GET_ALL: "/api/production-commands",
  GET_BY_ID: "/api/production-commands/{id}",
  CREATE: "/api/production-commands",
  UPDATE_BY_ID: "/api/production-commands/{id}",
  DELETE_BY_ID: "/api/production-commands/{id}",
},

  PROJECT_FOLDER: {
    GET_ALL_BY_PROJECT: "/api/ProjectFolder/project/{projectId}",
    CREATE: "/api/ProjectFolder/project/{projectId}",
    UPDATE_BY_ID: "/api/ProjectFolder/project/{projectId}/{folderId}",
    DELETE_BY_ID: "/api/ProjectFolder/project/{projectId}/{folderId}",
  },

  FILE: {
    GET_ALL: "/api/File",
    UPDATE_BY_ID: "/api/File/{id}",
    UPLOAD: "/api/File/upload",
    UPLOAD_STREAMING: "/api/Streaming/upload",
    DELETE_BY_ID: "/api/File/{id}",
    DOWNLOAD: "/api/File/{id}/download",
    DOWNLOAD_PATH: "/api/File/download-by-path",
  },

  USER: {
    GET_ALL: "/api/User",
    CREATE: "/api/User",
    GET_BY_ID: "/api/User/{userId}",
    UPDATE_BY_ID: "/api/User/{userId}",
    DELETE_BY_ID: "/api/User/{userId}",
    RESET_PASSWORD: "/api/User/{userId}/reset-password",
  },

  STATUS: {
    GET_ALL: "/api/ProjectStatusConfig",
  },
  CATEGORY_FILE: {
    GET_ALL: "/api/category-cutting-files",
    CREATE: "/api/category-cutting-files",
    DELETE_BY_ID: "/api/category-cutting-files/{id}",
    UPDATE_BY_ID: "/api/category-cutting-files/{id}",
  },
  CATEGORY_CUTTING_FILE: {
    GET_ALL: "/api/category-cutting-files",
    CREATE: "/api/category-cutting-files",
    DELETE_BY_ID: "/api/category-cutting-files/{id}",
    UPDATE_BY_ID: "/api/category-cutting-files/{id}",
  },
  COMMAND_CUTTING_FILE: {
    GET_ALL: "/api/command-cutting-files",
    CREATE: "/api/command-cutting-files",
    GET_BY_ID: "/api/command-cutting-files/{id}",
    DELETE_BY_ID: "/api/command-cutting-files/{id}",
    UPDATE_BY_ID: "/api/command-cutting-files/{id}",
  },
  PLANNING: {
  GET_ALL: "/api/planning",
  CREATE: "/api/planning",
  GET_BY_ID: "/api/planning/{id}",
  UPDATE_BY_ID: "/api/planning/{id}",
  DELETE_BY_ID: "/api/planning/{id}",
  SUMMARY: "/summary",
},
};
