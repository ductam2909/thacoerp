export const hasPermission = (userPermissions, permissionCode) => {
  if (!userPermissions || !permissionCode) return false;
  return userPermissions.includes(permissionCode);
};
