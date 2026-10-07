import React from "react";
import { Flex, Progress } from "antd";

const getProgressStrokeColor = (percent) => {
  if (percent <= 0) return "#d9d9d9";

  if (percent < 50)
    return {
      "0%": "#f87171",
      "100%": "#ef4444",
    };

  if (percent < 80)
    return {
      "0%": "#fbbf24",
      "100%": "#f59e0b",
    };

  if (percent < 99)
    return {
      "0%": "#67e8f9",
      "100%": "#38bdf8",
    };

  return {
    "0%": "#34d399",
    "100%": "#05b17b",
  };
};

const SegmentedProgress = ({
  percent = 0,
  total = 0,
  completed = 0,
  title,
}) => {
  const numericPercent = Number(percent);

  const normalizedPercent = Number.isFinite(numericPercent)
    ? Math.min(100, Math.max(0, numericPercent))
    : 0;

  const roundedPercent = Math.round(normalizedPercent);
  const strokeColor = getProgressStrokeColor(normalizedPercent);

  return (
    <Flex
      vertical
      gap="small"
      className="project-progress-cell project-task-progress"
      title={title ?? `${completed}/${total} task hoàn thành`}
      style={{ width: "100%" }}
    >
      <Progress
        percent={roundedPercent}
        percentPosition={{
          align: "center",
          type: "inner",
        }}
        size={["100%", 20]}
        strokeColor={strokeColor}
        trailColor="#ececec"
        strokeLinecap="round"
        format={() => (
          <span
            style={{
              color: roundedPercent >= 1 ? "#ffffff" : "#595959",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {roundedPercent}%
          </span>
        )}
      />
    </Flex>
  );
};

export default SegmentedProgress;

// bản process có thanh tiến độ và % nằm chung dòng

// const SegmentedProgress = ({
//   percent = 0,
//   total = 0,
//   completed = 0,
//   title,
// }) => {
//   const numericPercent = Number(percent);

//   const normalizedPercent = Number.isFinite(numericPercent)
//     ? Math.min(100, Math.max(0, numericPercent))
//     : 0;

//   const roundedPercent = Math.round(normalizedPercent);
//   const colors = getProgressColor(normalizedPercent);

//   return (
//     <div
//       className="project-progress-cell project-task-progress"
//       title={title ?? `${completed}/${total} task hoàn thành`}
//       style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}
//     >
//       <div className="project-progress-bar" style={{ flex: 1, minWidth: 0 }}>
//         <Progress
//           percent={roundedPercent}
//           showInfo={false}
//           strokeColor={colors.stroke}
//           trailColor={colors.trail}
//           strokeLinecap="round"
//           size={["100%", 8]}
//         />
//       </div>

//       <span
//         className="project-progress-percent"
//         style={{
//           color: colors.text,
//           display: "inline-flex",
//           alignItems: "center",
//           lineHeight: 1,
//           whiteSpace: "nowrap",
//         }}
//       >
//         {roundedPercent}%
//       </span>
//     </div>
//   );
// };