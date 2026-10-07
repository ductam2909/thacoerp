import React from "react";
import {
  Checkbox,
  Col,
  DatePicker,
  Form as AntdForm,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  TreeSelect,
} from "antd";

const DEFAULT_COL_PROPS = { xs: 24 };
const DEFAULT_COLUMNS_PER_ROW = 1;

const normalizePositiveNumber = (value, fallback) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
};

const getGridSpan = (columnsPerRow, colSpan = 1) => {
  const safeColumnsPerRow = normalizePositiveNumber(columnsPerRow, DEFAULT_COLUMNS_PER_ROW);
  const safeColSpan = normalizePositiveNumber(colSpan, 1);

  return Math.min(24, Math.max(1, Math.round((24 / safeColumnsPerRow) * safeColSpan)));
};

const getFieldColProps = (field, columnsPerRow, defaultColProps) => {
  if (field.colProps) {
    return { ...DEFAULT_COL_PROPS, ...field.colProps };
  }

  const colSpan = field.colSpan ?? field.col ?? field.span ?? 1;

  return {
    ...DEFAULT_COL_PROPS,
    ...defaultColProps,
    md: getGridSpan(columnsPerRow, colSpan),
  };
};

const renderFields = (fields, columnsPerRow, defaultColProps) =>
  fields
    .filter((field) => field.hidden !== true)
    .map((field) => {
      const colProps = getFieldColProps(field, columnsPerRow, defaultColProps);
      const valuePropName =
        field.valuePropName ||
        (field.type === "checkbox" || field.type === "switch" ? "checked" : undefined);

      return (
        <Col key={field.key || field.name} {...colProps}>
          <AntdForm.Item
            label={field.type === "checkbox" ? undefined : field.label}
            name={field.name}
            rules={buildRules(field)}
            valuePropName={valuePropName}
            dependencies={field.dependencies}
            extra={field.extra}
            tooltip={field.tooltip}
            style={field.itemStyle}
          >
            {renderFieldControl(field)}
          </AntdForm.Item>
        </Col>
      );
    });

const getRequiredMessage = (field) => {
  if (field.requiredMessage) return field.requiredMessage;
  const label = typeof field.label === "string" ? field.label.toLowerCase() : "trường này";
  return field.type === "select" || field.type === "treeSelect"
    ? `Vui lòng chọn ${label}`
    : `Vui lòng nhập ${label}`;
};

const buildRules = (field) => {
  const rules = field.rules || [];

  if (!field.required) {
    return rules;
  }

  return [{ required: true, message: getRequiredMessage(field) }, ...rules];
};

const renderFieldControl = (field) => {
  const {
    component,
    inputProps,
    options,
    placeholder,
    type = "input",
    rows = 4,
    ...rest
  } = field;

  if (component) return component;

  const controlProps = {
    placeholder,
    disabled: rest.disabled,
    allowClear: rest.allowClear ?? true,
    ...inputProps,
  };

  switch (type) {
    case "password":
      return <Input.Password {...controlProps} />;
    case "textarea":
      return <Input.TextArea rows={rows} {...controlProps} />;
    case "number":
      return <InputNumber style={{ width: "100%" }} {...controlProps} />;
    case "select":
      return (
        <Select
          showSearch={rest.showSearch ?? true}
          optionFilterProp="label"
          options={options}
          {...controlProps}
        />
      );
    case "treeSelect":
      return (
        <TreeSelect
          treeDataSimpleMode={rest.treeDataSimpleMode}
          treeData={rest.treeData}
          treeDefaultExpandAll={rest.treeDefaultExpandAll ?? true}
          showSearch={rest.showSearch}
          {...controlProps}
        />
      );
    case "date":
      return <DatePicker style={{ width: "100%" }} {...controlProps} />;
    case "checkbox":
      return <Checkbox {...inputProps}>{field.checkboxLabel || field.label}</Checkbox>;
    case "switch":
      return <Switch {...inputProps} />;
    default:
      return <Input type={type === "input" ? undefined : type} {...controlProps} />;
  }
};

const CommonForm = ({
  children,
  fields = [],
  form,
  gutter = 16,
  layout = "vertical",
  rowProps,
  formProps,
  columnsPerRow = DEFAULT_COLUMNS_PER_ROW,
  itemsPerRow,
  columns,
  defaultColProps,
  rows,
  ...rest
}) => {
  const resolvedColumnsPerRow = itemsPerRow ?? columns ?? columnsPerRow;

  return (
    <AntdForm form={form} layout={layout} {...formProps} {...rest}>
      {children || (rows?.length ? (
        <>
          {rows.map((row, index) => {
            const rowConfig = Array.isArray(row) ? { fields: row } : row;
            const rowFields = rowConfig.fields || rowConfig.items || [];
            const rowColumnsPerRow =
              rowConfig.itemsPerRow ??
              rowConfig.columns ??
              rowConfig.columnsPerRow ??
              resolvedColumnsPerRow;

            return (
              <Row
                key={rowConfig.key || index}
                gutter={rowConfig.gutter ?? gutter}
                {...rowProps}
                {...rowConfig.rowProps}
              >
                {renderFields(
                  rowFields,
                  rowColumnsPerRow,
                  rowConfig.defaultColProps ?? defaultColProps,
                )}
              </Row>
            );
          })}
        </>
      ) : (
        <Row gutter={gutter} {...rowProps}>
          {renderFields(fields, resolvedColumnsPerRow, defaultColProps)}
        </Row>
      ))}
    </AntdForm>
  );
};

CommonForm.Item = AntdForm.Item;
CommonForm.List = AntdForm.List;
CommonForm.Provider = AntdForm.Provider;
CommonForm.ErrorList = AntdForm.ErrorList;
CommonForm.useForm = AntdForm.useForm;
CommonForm.useWatch = AntdForm.useWatch;

export default CommonForm;
