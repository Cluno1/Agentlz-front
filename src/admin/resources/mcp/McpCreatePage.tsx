/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Title, useTranslate, useCreatePath } from "react-admin";
import {
  Card,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  Message,
  InputNumber,
} from "@arco-design/web-react";
import { IconRefresh, IconPlus } from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import { createMcp } from "../../data/api/mcp";
import { useDarkMode } from "../../data/hook/useDark";

const McpCreatePage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const createPath = useCreatePath();
  const { cardColorStyle } = useDarkMode();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [scope, setScope] = useState<"self" | "tenant" | "system">("self");

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      let args: any = undefined;
      if (values.argsMode === "array") {
        if (values.argsArray && typeof values.argsArray === "string") {
          try {
            const parsed = JSON.parse(values.argsArray);
            args = Array.isArray(parsed) ? parsed : undefined;
          } catch {
            const trimmed = values.argsArray
              .split("\n")
              .map((s: string) => s.trim())
              .filter(Boolean);
            args = trimmed.length ? trimmed : undefined;
          }
        }
      } else if (values.argsMode === "object") {
        if (values.argsObject && typeof values.argsObject === "string") {
          try {
            const parsed = JSON.parse(values.argsObject);
            args = parsed;
          } catch {
            Message.error(
              t("mcp.ui.args.invalidJson", { _: "参数 JSON 格式不正确" }),
            );
            setSubmitting(false);
            return;
          }
        }
      }

      const payload: any = {
        name: values.name,
        description: values.description || undefined,
        disabled: values.disabled ?? undefined,
        transport: values.transport,
        command: values.command,
        args,
        category: values.category,
        trust_score:
          typeof values.trust_score === "number"
            ? values.trust_score
            : Number(values.trust_score),
      };
      const row = await createMcp(payload, scope);
      Message.success(t("common.success", { _: "创建成功" }));
      const to = createPath({ resource: "mcp", type: "show", id: row?.id });
      navigate(to);
    } catch (e: any) {
      Message.error(e?.message || t("common.error", { _: "创建失败" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title={<Title title={t("mcp.ui.createTitle", { _: "创建 MCP" })} />}
      bordered
      style={{ ...cardColorStyle }}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 720 }}
        onSubmit={handleSubmit}
      >
        <Form.Item
          label={t("mcp.ui.fields.name", { _: "名称" })}
          field="name"
          required
          rules={[
            { required: true, message: t("common.required", { _: "必填" }) },
          ]}
        >
          <Input
            placeholder={t("mcp.ui.fields.namePlaceholder", {
              _: "请输入名称",
            })}
          />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.description", { _: "描述" })}
          field="description"
        >
          <Input.TextArea
            rows={4}
            placeholder={t("mcp.ui.fields.descriptionPlaceholder", {
              _: "请输入描述（可选）",
            })}
          />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.disabled", { _: "停用" })}
          field="disabled"
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.scope", { _: "创建范围" })}
          field="scope"
          initialValue={scope}
        >
          <Select
            value={scope}
            onChange={setScope}
            style={{ width: 200 }}
            options={[
              { label: t("rag.ui.tabs.self", { _: "个人" }), value: "self" },
              {
                label: t("rag.ui.tabs.tenant", { _: "租户" }),
                value: "tenant",
              },
              {
                label: t("rag.ui.tabs.system", { _: "系统" }),
                value: "system",
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.transport", { _: "传输方式" })}
          field="transport"
          required
          initialValue={"stdio"}
          rules={[
            { required: true, message: t("common.required", { _: "必填" }) },
          ]}
        >
          <Select
            style={{ width: 200 }}
            options={[
              { label: "stdio", value: "stdio" },
              { label: "http", value: "http" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.command", { _: "启动命令" })}
          field="command"
          required
          initialValue={"python"}
          rules={[
            { required: true, message: t("common.required", { _: "必填" }) },
          ]}
        >
          <Input
            placeholder={t("mcp.ui.fields.commandPlaceholder", {
              _: "如 python / docker / http",
            })}
          />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.argsMode", { _: "参数模式" })}
          field="argsMode"
          initialValue={"array"}
        >
          <Select
            style={{ width: 200 }}
            options={[
              { label: t("mcp.ui.args.array", { _: "数组" }), value: "array" },
              {
                label: t("mcp.ui.args.object", { _: "对象" }),
                value: "object",
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.argsMode !== curr.argsMode}
        >
          {(values) =>
            values?.argsMode === "object" ? (
              <Form.Item
                label={t("mcp.ui.fields.argsObject", {
                  _: "参数（对象 JSON）",
                })}
                field="argsObject"
                rules={[
                  {
                    validator: (v, cb) => {
                      if (!v) return cb();
                      try {
                        JSON.parse(v);
                        cb();
                      } catch {
                        cb(
                          t("mcp.ui.args.invalidJson", {
                            _: "JSON 格式不正确",
                          }),
                        );
                      }
                    },
                  },
                ]}
              >
                <Input.TextArea
                  rows={6}
                  placeholder={t("mcp.ui.fields.argsObjectPlaceholder", {
                    _: '示例：{"mcpServers":{"github":{"type":"http","url":"https://api.githubcopilot.com/mcp/"}}}',
                  })}
                />
              </Form.Item>
            ) : (
              <Form.Item
                label={t("mcp.ui.fields.argsArray", { _: "参数（数组 JSON）" })}
                field="argsArray"
                initialValue={'["-m","pdf_tool"]'}
                rules={[
                  {
                    validator: (v, cb) => {
                      if (!v) return cb();
                      try {
                        const parsed = JSON.parse(v);
                        if (!Array.isArray(parsed)) {
                          cb(
                            t("mcp.ui.args.mustArray", {
                              _: "需为数组 JSON 格式",
                            }),
                          );
                          return;
                        }
                        cb();
                      } catch {
                        cb(
                          t("mcp.ui.args.invalidJson", {
                            _: "JSON 格式不正确",
                          }),
                        );
                      }
                    },
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder={t("mcp.ui.fields.argsArrayPlaceholder", {
                    _: '示例：["-m","pdf_tool"]',
                  })}
                />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.category", { _: "分类" })}
          field="category"
          required
          rules={[
            { required: true, message: t("common.required", { _: "必填" }) },
          ]}
        >
          <Input
            placeholder={t("mcp.ui.fields.categoryPlaceholder", {
              _: "请输入分类，如 document / 开发 / 官方 / 金融",
            })}
          />
        </Form.Item>

        <Form.Item
          label={t("mcp.ui.fields.trust_score", { _: "可信度分数" })}
          field="trust_score"
          required
          initialValue={60.5}
          rules={[
            { required: true, message: t("common.required", { _: "必填" }) },
          ]}
        >
          <InputNumber style={{ width: 200 }} step={0.1} min={0} max={100} />
        </Form.Item>

        <Space style={{ marginTop: 12 }}>
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={() => form.submit()}
            loading={submitting}
          >
            {t("mcp.ui.create", { _: "创建" })}
          </Button>
          <Button
            icon={<IconRefresh />}
            onClick={() => {
              form.resetFields();
              setScope("self");
            }}
            disabled={submitting}
          >
            {t("mcp.ui.reset", { _: "重置" })}
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default McpCreatePage;
