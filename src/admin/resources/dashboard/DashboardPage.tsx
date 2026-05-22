import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Button,
  Card,
  Drawer,
  Space,
  Typography,
  Tag,
} from "@arco-design/web-react";
import { usePermissions, useTranslate } from "react-admin";
import { listVisibleAnnouncements } from "../../data/api/announcement";
import type { ListAnnouncementsNameSpace } from "../../data/api/announcement/type";
import { wsClient } from "../../data/wsClient";
import type { WSMessage } from "../../data/wsClient";

type OnboardingStep = {
  no: string;
  title: string;
  subtitle: string;
  text: string;
  accent: string;
  tagColor: string;
  tags: string[];
  detailTitle: string;
  detailLead: string;
  actions: string[];
  output: string;
};

const DashboardPage: React.FC = () => {
  const t = useTranslate();
  const { permissions } = usePermissions();
  const tenantKey = import.meta.env.VITE_TENANT_ID as string;
  const tenantId = localStorage.getItem(tenantKey) || "default";
  const isSuperAdmin = useMemo(
    () =>
      permissions === "admin" &&
      (tenantId === "system" || tenantId === "default"),
    [permissions, tenantId],
  );
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [announcements, setAnnouncements] = useState<
    ListAnnouncementsNameSpace.ListAnnouncementsResult[]
  >([]);

  const onboardingSteps: OnboardingStep[] = [
    {
      no: "01",
      title: "组织治理",
      subtitle: "把边界先定清楚",
      text: "梳理租户、角色、成员和权限范围，先建立企业级使用边界。",
      accent: "#165DFF",
      tagColor: "arcoblue",
      tags: ["租户", "角色", "权限"],
      detailTitle: "组织治理落地流程",
      detailLead:
        "适合系统管理员先执行。目标是让平台具备清晰的企业边界和可追踪的权限体系。",
      actions: [
        "进入系统管理，确认 default/system 管理员账号和当前租户范围。",
        "创建或核对租户，按团队、项目或客户维度拆分使用边界。",
        "为成员分配角色，明确谁可以管理 Agent、知识库、MCP 工具和公告。",
        "完成一次普通成员登录验证，确认菜单和数据范围符合预期。",
      ],
      output: "输出物：租户清单、角色清单、管理员账号和成员访问边界。",
    },
    {
      no: "02",
      title: "知识资产",
      subtitle: "把资料变成可调用能力",
      text: "上传制度、手册、项目材料和交付模板，沉淀可检索的业务资料层。",
      accent: "#00B42A",
      tagColor: "green",
      tags: ["知识库", "切片", "检索"],
      detailTitle: "知识资产建设流程",
      detailLead:
        "适合业务负责人和交付团队执行。目标是让 Agent 能够引用稳定、可信的企业资料。",
      actions: [
        "进入知识文档，按个人、租户或系统范围上传资料。",
        "为资料补充标题、标签和说明，方便后续检索和治理。",
        "发布切片任务，等待文档完成解析、向量化和 BM25 索引。",
        "用真实业务问题测试召回结果，剔除低质量或过期资料。",
      ],
      output: "输出物：已索引知识库、资料标签体系和基础召回验证结果。",
    },
    {
      no: "03",
      title: "Agent 编排",
      subtitle: "把流程配置成助手",
      text: "配置 Agent、系统提示词、知识范围和 MCP 工具，覆盖高频业务流程。",
      accent: "#F7BA1E",
      tagColor: "gold",
      tags: ["Agent", "MCP", "流程"],
      detailTitle: "Agent 编排流程",
      detailLead:
        "适合产品负责人和技术运营执行。目标是把重复业务流程配置为可复用的智能助手。",
      actions: [
        "进入 Agent 管理，创建面向单一场景的专用 Agent。",
        "补充系统提示词，明确角色、输出格式、禁用事项和业务口径。",
        "关联知识资料，限定 Agent 可引用的文档范围。",
        "配置默认 MCP 工具，先覆盖搜索、文件、图片、邮件等高频动作。",
      ],
      output: "输出物：可试运行 Agent、知识权限范围和工具调用边界。",
    },
    {
      no: "04",
      title: "验证发布",
      subtitle: "用真实任务验收上线",
      text: "用真实问题完成对话、历史续聊和工具调用测试，再逐步开放给团队。",
      accent: "#722ED1",
      tagColor: "purple",
      tags: ["测试", "发布", "验收"],
      detailTitle: "验证发布流程",
      detailLead:
        "适合上线负责人执行。目标是在开放使用前完成稳定性、准确性和流程闭环验证。",
      actions: [
        "准备 5-10 条真实业务问题，覆盖问答、生成、工具调用和续聊。",
        "检查回答是否引用正确资料，输出格式是否满足交付要求。",
        "检查历史记录能否回放正文，并能基于同一 record 继续对话。",
        "确认问题清单关闭后，再通过公告或内部通知开放给试点团队。",
      ],
      output: "输出物：验收问题集、试运行结论、开放范围和后续优化清单。",
    },
  ];

  const readinessItems = [
    "管理员账号、租户和角色已确认",
    "核心业务资料已完成上传和切片",
    "关键 Agent 已配置知识范围和默认工具",
    "登录、历史记录、续聊和 MCP 调用已完成联调",
  ];

  const capabilityMix = [
    { name: "知识资产", value: 34, color: "#165DFF" },
    { name: "流程编排", value: 27, color: "#00B42A" },
    { name: "工具生态", value: 23, color: "#F7BA1E" },
    { name: "交付运营", value: 16, color: "#722ED1" },
  ];

  const pieOption = useMemo(
    () => ({
      color: capabilityMix.map((item) => item.color),
      tooltip: {
        trigger: "item",
        formatter: "{b}<br/>建议投入：{d}%",
      },
      legend: {
        orient: "vertical",
        right: 6,
        top: "middle",
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: "#4E5969",
          fontSize: 12,
        },
      },
      series: [
        {
          name: "建设重点",
          type: "pie",
          radius: ["54%", "76%"],
          center: ["34%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: "#FFFFFF",
            borderWidth: 3,
          },
          label: {
            color: "#1D2129",
            formatter: "{b}",
          },
          labelLine: {
            length: 12,
            length2: 8,
          },
          data: capabilityMix.map(({ name, value }) => ({ name, value })),
        },
      ],
      graphic: [
        {
          type: "text",
          left: "25%",
          top: "43%",
          style: {
            text: "企业能力\n建设模型",
            fill: "#1D2129",
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 22,
            textAlign: "center",
          },
        },
      ],
    }),
    [],
  );

  const systemAnnouncements = useMemo(
    () => announcements.filter((a) => a.tenant_id === "system" && !a.disabled),
    [announcements],
  );
  const tenantAnnouncements = useMemo(
    () => announcements.filter((a) => a.tenant_id === tenantId && !a.disabled),
    [announcements, tenantId],
  );

  const fetchAnnouncements = React.useCallback(async () => {
    try {
      setLoading(true);
      const resp = await listVisibleAnnouncements(30);
      setAnnouncements(resp.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWsMessage = React.useCallback(
    (msg: WSMessage) => {
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "announcement.updated") {
        const data = (msg.data ||
          {}) as ListAnnouncementsNameSpace.ListAnnouncementsResult;
        if (!data || !data.id) return;
        setAnnouncements((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((x) => String(x.id) === String(data.id));
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], ...data };
            return copy;
          }
          return [data, ...copy];
        });
        return;
      }
      if (msg.type === "announcement.deleted") {
        const data = (msg.data || {}) as { id?: number | string };
        if (!data?.id) return;
        setAnnouncements((prev) =>
          prev.filter((a) => String(a.id) !== String(data.id)),
        );
      }
    },
    [setAnnouncements],
  );

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    const systemTopic = "announcement:system";
    const tenantTopic = `announcement:tenant:${tenantId}`;
    wsClient.subscribe(systemTopic, handleWsMessage);
    if (tenantId && tenantId !== "system") {
      wsClient.subscribe(tenantTopic, handleWsMessage);
    }
    return () => {
      wsClient.unsubscribe(systemTopic, handleWsMessage);
      if (tenantId && tenantId !== "system") {
        wsClient.unsubscribe(tenantTopic, handleWsMessage);
      }
    };
  }, [tenantId, handleWsMessage]);

  const pageStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "100%",
    color: "#1D2129",
  };

  const posterStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    padding: "34px 36px",
    color: "#FFFFFF",
    background:
      "linear-gradient(135deg, #111827 0%, #1B365D 42%, #0B7A75 100%)",
    boxShadow: "0 18px 45px rgba(17, 24, 39, 0.18)",
  };

  const mutedTextStyle: React.CSSProperties = {
    color: "#4E5969",
    lineHeight: 1.7,
  };

  const sectionStyle: React.CSSProperties = {
    border: "1px solid #E5E6EB",
    borderRadius: 8,
    background: "#FFFFFF",
    padding: 22,
  };

  const stepCardStyle = (step: OnboardingStep): React.CSSProperties => ({
    border: "1px solid #E5E6EB",
    borderTop: `4px solid ${step.accent}`,
    borderRadius: 8,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,248,250,0.9) 100%)",
    padding: 18,
    minHeight: 214,
    boxShadow: "0 8px 24px rgba(29, 33, 41, 0.06)",
  });

  return (
    <div style={pageStyle}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={posterStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 28,
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <Tag color="arcoblue" style={{ marginBottom: 16 }}>
                ENTERPRISE AGENT WORKSPACE
              </Tag>
              <Typography.Title
                heading={2}
                style={{
                  color: "#FFFFFF",
                  margin: 0,
                  maxWidth: 760,
                  lineHeight: 1.18,
                }}
              >
                Agentlz 企业智能体运营工作台
              </Typography.Title>
              <Typography.Paragraph
                style={{
                  color: "rgba(255,255,255,0.82)",
                  marginTop: 18,
                  maxWidth: 720,
                  fontSize: 15,
                  lineHeight: 1.8,
                }}
              >
                从组织权限、知识资产、Agent 编排到工具调用，统一沉淀企业 AI 能力。
                用标准化流程降低试运行成本，让团队把更多时间投入到业务交付和持续优化。
              </Typography.Paragraph>
              <Space wrap size="medium" style={{ marginTop: 18 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setActiveStep(onboardingSteps[0])}
                >
                  打开入门流程
                </Button>
                <Button
                  size="large"
                  style={{
                    color: "#FFFFFF",
                    borderColor: "rgba(255,255,255,0.42)",
                    background: "rgba(255,255,255,0.08)",
                  }}
                  onClick={fetchAnnouncements}
                  loading={loading}
                >
                  刷新公告
                </Button>
              </Space>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {[
                ["4", "阶段落地模型"],
                ["30", "公告同步上限"],
                ["MCP", "工具生态接入"],
                [tenantId, "当前租户"],
              ].map(([value, label]) => (
                <div
                  key={`${value}-${label}`}
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.10)",
                    padding: 16,
                    minHeight: 96,
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <Typography.Title
                    heading={4}
                    style={{
                      color: "#FFFFFF",
                      margin: 0,
                      wordBreak: "break-word",
                    }}
                  >
                    {value}
                  </Typography.Title>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.76)" }}>
                    {label}
                  </Typography.Text>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 6,
              background:
                "linear-gradient(90deg, #165DFF 0%, #00B42A 33%, #F7BA1E 66%, #722ED1 100%)",
            }}
          />
        </div>

        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              marginBottom: 18,
            }}
          >
            <div>
              <Typography.Title heading={5} style={{ marginTop: 0 }}>
                企业入门流程
              </Typography.Title>
              <Typography.Paragraph style={mutedTextStyle}>
                用四个阶段完成平台试运行准备。每个阶段都可以打开右侧流程面板查看操作说明。
              </Typography.Paragraph>
            </div>
            <Button type="primary" onClick={() => setActiveStep(onboardingSteps[0])}>
              查看完整流程
            </Button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 14,
            }}
          >
            {onboardingSteps.map((step) => (
              <div key={step.no} style={stepCardStyle(step)}>
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Space
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Tag color={step.tagColor}>{step.no}</Tag>
                    <Typography.Text style={{ color: step.accent, fontWeight: 600 }}>
                      {step.subtitle}
                    </Typography.Text>
                  </Space>
                  <Typography.Title heading={6} style={{ margin: "8px 0 0" }}>
                    {step.title}
                  </Typography.Title>
                  <Typography.Text style={mutedTextStyle}>{step.text}</Typography.Text>
                  <Space wrap>
                    {step.tags.map((tag) => (
                      <Tag key={`${step.no}-${tag}`} color="gray">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                  <Button
                    type="outline"
                    style={{ marginTop: 8, borderColor: step.accent, color: step.accent }}
                    onClick={() => setActiveStep(step)}
                  >
                    查看流程
                  </Button>
                </Space>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          <div style={sectionStyle}>
            <Typography.Title heading={5} style={{ marginTop: 0 }}>
              建设重点分布
            </Typography.Title>
            <Typography.Paragraph style={mutedTextStyle}>
              以企业试运行为目标，建议把投入拆成知识、流程、工具和运营四类能力。
            </Typography.Paragraph>
            <ReactECharts option={pieOption} style={{ height: 292 }} />
          </div>
          <div style={sectionStyle}>
            <Typography.Title heading={5} style={{ marginTop: 0 }}>
              上线检查
            </Typography.Title>
            <Typography.Paragraph style={mutedTextStyle}>
              面向企业用户开放前，优先确认以下交付条件。
            </Typography.Paragraph>
            <Space direction="vertical" size="medium" style={{ width: "100%" }}>
              {readinessItems.map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "34px 1fr",
                    gap: 12,
                    alignItems: "start",
                    padding: 12,
                    borderRadius: 8,
                    background:
                      index % 2 === 0 ? "rgba(22,93,255,0.06)" : "#F7F8FA",
                  }}
                >
                  <Tag color={index % 2 === 0 ? "arcoblue" : "green"}>
                    {index + 1}
                  </Tag>
                  <Typography.Text style={mutedTextStyle}>{item}</Typography.Text>
                </div>
              ))}
            </Space>
          </div>
        </div>

        <Card title="公告">
          <Space direction="vertical" size="medium" style={{ width: "100%" }}>
            <div>
              <Typography.Title heading={6}>
                {t("dashboard.systemAnnouncement", { _: "系统公告" })}
              </Typography.Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                {systemAnnouncements.length === 0 && (
                  <Typography.Text>
                    {t("dashboard.noAnnouncement", { _: "暂无公告" })}
                  </Typography.Text>
                )}
                {systemAnnouncements.map((a) => (
                  <div key={`sys-${a.id}`} style={sectionStyle}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space>
                        <Tag color="arcoblue">SYSTEM</Tag>
                        <Typography.Text style={{ fontWeight: 600 }}>
                          {a.title}
                        </Typography.Text>
                      </Space>
                      <Typography.Paragraph>{a.content || "-"}</Typography.Paragraph>
                    </Space>
                  </div>
                ))}
              </Space>
            </div>
            {!isSuperAdmin && (
              <div>
                <Typography.Title heading={6}>
                  {t("dashboard.tenantAnnouncement", { _: "租户公告" })}
                </Typography.Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {tenantAnnouncements.length === 0 && (
                    <Typography.Text>
                      {t("dashboard.noAnnouncement", { _: "暂无公告" })}
                    </Typography.Text>
                  )}
                  {tenantAnnouncements.map((a) => (
                    <div key={`ten-${a.id}`} style={sectionStyle}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Space>
                          <Tag color="gold">TENANT</Tag>
                          <Typography.Text style={{ fontWeight: 600 }}>
                            {a.title}
                          </Typography.Text>
                        </Space>
                        <Typography.Paragraph>{a.content || "-"}</Typography.Paragraph>
                      </Space>
                    </div>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Card>
      </Space>

      <Drawer
        title={activeStep?.detailTitle || "入门流程"}
        visible={Boolean(activeStep)}
        placement="right"
        width={560}
        footer={null}
        onCancel={() => setActiveStep(null)}
        onOk={() => setActiveStep(null)}
      >
        {activeStep && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div
              style={{
                borderRadius: 8,
                padding: 18,
                color: "#FFFFFF",
                background: `linear-gradient(135deg, ${activeStep.accent} 0%, #111827 100%)`,
              }}
            >
              <Tag color={activeStep.tagColor}>{activeStep.no}</Tag>
              <Typography.Title heading={5} style={{ color: "#FFFFFF", marginBottom: 8 }}>
                {activeStep.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: "rgba(255,255,255,0.84)" }}>
                {activeStep.detailLead}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Title heading={6}>操作步骤</Typography.Title>
              <Space direction="vertical" size="medium" style={{ width: "100%" }}>
                {activeStep.actions.map((action, index) => (
                  <div
                    key={action}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "34px 1fr",
                      gap: 12,
                      paddingBottom: 14,
                      borderBottom:
                        index === activeStep.actions.length - 1
                          ? "none"
                          : "1px solid #E5E6EB",
                    }}
                  >
                    <Tag color={activeStep.tagColor}>{index + 1}</Tag>
                    <Typography.Text style={mutedTextStyle}>{action}</Typography.Text>
                  </div>
                ))}
              </Space>
            </div>

            <div
              style={{
                border: `1px solid ${activeStep.accent}`,
                borderRadius: 8,
                padding: 16,
                background: "#F7F8FA",
              }}
            >
              <Typography.Text style={{ fontWeight: 600 }}>阶段输出</Typography.Text>
              <Typography.Paragraph style={{ ...mutedTextStyle, marginBottom: 0 }}>
                {activeStep.output}
              </Typography.Paragraph>
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default DashboardPage;
