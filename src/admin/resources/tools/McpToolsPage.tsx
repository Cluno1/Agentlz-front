import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Input,
  Message,
  Select,
  Space,
  Tag,
  Typography,
} from "@arco-design/web-react";
import { IconSearch, IconThunderbolt } from "@arco-design/web-react/icon";
import { useTranslate } from "react-admin";
import {
  getMcpStats,
  listMcpTools,
  type McpCategory,
  type McpTool,
  type McpStats,
} from "../../data/tools/mcp";

const CATEGORIES: McpCategory[] = ["all", "llm", "database", "tools", "other"];

const McpToolsPage: React.FC = () => {
  const t = useTranslate();
  const [stats, setStats] = useState<McpStats | null>(null);
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<McpCategory>("all");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  /*
   * 函数: fetchStats
   * 参数: 无
   * 返回: Promise<void>
   * 异常: 失败时弹出错误提示
   */
  const fetchStats = async (): Promise<void> => {
    try {
      const s = await getMcpStats();
      setStats(s);
    } catch (e) {
      Message.error(t("mcpTools.msg.loadFail", { _: "加载失败" }));
    }
  };

  /*
   * 函数: fetchTools
   * 参数: 无
   * 返回: Promise<void>
   * 异常: 失败时弹出错误提示
   */
  const fetchTools = async (): Promise<void> => {
    setLoading(true);
    try {
      const list = await listMcpTools({ query, category });
      setTools(list);
    } catch (e) {
      Message.error(t("mcpTools.msg.loadFail", { _: "加载失败" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  const subtitle = useMemo(() => t("mcpTools.ui.subtitle"), [t]);

  /*
   * 函数: handleCopy
   * 参数: cmd: string - 需要复制的命令
   * 返回: Promise<void>
   * 异常: 出错时提示复制失败
   */
  const handleCopy = async (cmd: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(cmd);
      Message.success(t("mcpTools.ui.copySuccess", { _: "已复制" }));
    } catch (e) {
      Message.error(t("mcpTools.ui.copyError", { _: "复制失败" }));
    }
  };

  return (
    <div className="h-full">
      {/* 顶部横幅：标题+统计 */}
      <div className="bg-gradient-to-r from-[rgb(22,93,255)] to-[rgb(0,200,255)] text-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title heading={3} style={{ color: "#fff" }}>
                {t("mcpTools.title")}
              </Typography.Title>
              <div className="text-sm opacity-90">{subtitle}</div>
            </div>
            <Space size={24}>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {t("mcpTools.ui.stats.total")}
                </div>
                <div className="text-2xl font-bold">
                  {stats?.totalServers ?? "-"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {t("mcpTools.ui.stats.today")}
                </div>
                <div className="text-2xl font-bold">
                  {stats?.addedToday ?? "-"}
                </div>
              </div>
            </Space>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1">
              <Input
                prefix={<IconSearch />}
                allowClear
                placeholder={t("mcpTools.ui.searchPlaceholder", { _: "搜索" })}
                value={query}
                onChange={setQuery}
              />
            </div>
            <Select value={category} onChange={setCategory} className="w-40">
              {CATEGORIES.map((c) => (
                <Select.Option key={c} value={c}>
                  {t(`mcpTools.ui.categories.${c}`)}
                </Select.Option>
              ))}
            </Select>
            <Button onClick={fetchTools} icon={<IconThunderbolt />}>
              {t("mcpTools.ui.refresh")}
            </Button>
          </div>
        </div>
      </div>

      {/* 工具列表 */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} hoverable className="shadow-sm">
              <div className="flex items-start gap-3">
                <Avatar
                  size={32}
                  imageProps={tool.icon ? { src: tool.icon } : undefined}
                >
                  {!tool.icon && tool.name[0]}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-500">★ {tool.stars}</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {tool.description}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Tag size="small" color="arcoblue">
                      {t(`mcpTools.ui.categories.${tool.category}`)}
                    </Tag>
                    {tool.tags.map((tg) => (
                      <Tag key={tg} size="small">
                        {tg}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="truncate text-xs font-mono text-gray-500">
                  {tool.installCommand}
                </div>
                <Button
                  size="mini"
                  onClick={() => handleCopy(tool.installCommand)}
                >
                  {t("mcpTools.ui.install")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {tools.length === 0 && (
          <Card className="mt-6">
            <div className="text-center text-gray-500">
              {loading ? t("common.loading") : t("mcpTools.msg.loadFail")}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default McpToolsPage;
