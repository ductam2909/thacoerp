export const getStorage = (key) => {
  try {
    const serializedData = localStorage.getItem(key);
    return serializedData ? JSON.parse(serializedData) : null;
  } catch (error) {
    return null;
  }
};

export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Lỗi khi lưu storage', error);
  }
};

export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Lỗi khi xóa storage', error);
  }
};

export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Lỗi khi xóa toàn bộ storage", error);
  }
};
