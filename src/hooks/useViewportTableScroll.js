import { useCallback, useLayoutEffect, useRef, useState } from "react";

const useViewportTableScroll = (
  refreshKey,
  { bottomSpacing = 32, minHeight = 240 } = {},
) => {
  const containerRef = useRef(null);
  const [scrollY, setScrollY] = useState("calc(100vh - 420px)");

  const updateScrollHeight = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const tableBody = container.querySelector(".ant-table-body");
    const tableHeader = container.querySelector(".ant-table-thead");
    const paginationElement = container.querySelector(".ant-pagination");
    const bodyTop =
      tableBody?.getBoundingClientRect().top ||
      tableHeader?.getBoundingClientRect().bottom;

    if (!bodyTop) return;

    const paginationStyles = paginationElement
      ? getComputedStyle(paginationElement)
      : null;
    const paginationHeight = paginationElement
      ? paginationElement.getBoundingClientRect().height +
        parseFloat(paginationStyles?.marginTop || 0) +
        parseFloat(paginationStyles?.marginBottom || 0)
      : 56;
    const availableHeight = Math.max(
      minHeight,
      Math.floor(
        window.innerHeight - bodyTop - paginationHeight - bottomSpacing,
      ),
    );

    setScrollY((currentHeight) =>
      currentHeight === availableHeight ? currentHeight : availableHeight,
    );
  }, [bottomSpacing, minHeight]);

  useLayoutEffect(() => {
    const animationFrame = requestAnimationFrame(updateScrollHeight);
    window.addEventListener("resize", updateScrollHeight);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollHeight)
        : null;
    if (containerRef.current) {
      resizeObserver?.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateScrollHeight);
      resizeObserver?.disconnect();
    };
  }, [refreshKey, updateScrollHeight]);

  return { containerRef, scrollY };
};

export default useViewportTableScroll;
