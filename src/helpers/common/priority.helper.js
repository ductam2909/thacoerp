import colors from "../../assets/scss/variables.scss";

export const getPriorityConfig = (val) => {
  switch (val) {
    case 3:
      return {
        color: colors.colorDanger500,
        fontColor: colors.colorDanger200,
        label: "Cao",
      };

    case 2:
      return {
        color: colors.colorDanger100,
        fontColor: colors.colorDanger600,
        label: "Cao",
      };

    case 1:
      return {
        color: colors.colorWarning100,
        fontColor: colors.colorWarning600,
        label: "Trung bình",
      };

    case 0:
      return {
        color: colors.colorPrimary50,
        fontColor: colors.colorPrimary600,
        label: "Thấp",
      };

    default:
      return {
        color: colors.colorGray100,
        fontColor: colors.colorGray500,
        label: val || "Unknown",
      };
  }
};

export const priorityOptions = [
  {
    value: 0,
    label: "Thấp",
  },
  {
    value: 1,
    label: "Trung bình",
  },
  {
    value: 2,
    label: "Cao",
  },
  // {
  //   value: 3,
  //   label: "Khẩn cấp",
  // },
];
