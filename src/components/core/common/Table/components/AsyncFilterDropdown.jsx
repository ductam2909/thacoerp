import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import MultiSelectFilterDropdown from "../../Select/MultiSelectFilterDropdown";

const AsyncFilterDropdown = (props) => {
  const { fetchOptions, width = 350, ...restProps } = props;
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadOptions = async () => {
      setLoading(true);
      try {
        const data = await fetchOptions();
        if (isMounted) {
          setOptions(data || []);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Lỗi khi fetch options cho filter:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (!loaded) {
      loadOptions();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Spin spinning={loading}>
      <MultiSelectFilterDropdown
        {...restProps}
        options={options}
        width={width}
      />
    </Spin>
  );
};

export default AsyncFilterDropdown;
