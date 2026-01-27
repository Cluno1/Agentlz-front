import React, { useCallback, useEffect, useState } from "react";
import { Title, useTranslate } from "react-admin";
import { useNavigate, useParams } from "react-router-dom";

import {
  Card,
  Table,
  Space,
  Button,
  Modal,
  Message,
  Checkbox,
} from "@arco-design/web-react";
import { IconEye } from "@arco-design/web-react/icon";
import { useDarkMode } from "../../data/hook/useDark";
import {
  listDocumentStrategies,
  publishDocumentChunk,
} from "../../data/api/rag";
import type { ListDocStrategiesNameSpace } from "../../data/api/rag/type";

const STRATEGY_MAP: Record<string, { name: string; description: string }> = {
  "0": { name: "基础中文切割", description: "basic_chinese_text_split" },
  "1": {
    name: "递归字符切割（结构感知）",
    description: "split_markdown_into_chunks",
  },
  "2": {
    name: "固定长度 + 边界感知",
    description: "chunk_fixed_length_boundary",
  },
  "3": {
    name: "语义相似度驱动切分",
    description: "chunk_semantic_similarity",
  },
  "4": { name: "LLM 语义分段", description: "chunk_llm_semantic" },
  "5": {
    name: "层次切片（章节/段落/句子）",
    description: "chunk_hierarchical",
  },
  "6": { name: "滑动窗口", description: "chunk_sliding_window" },
  "7": {
    name: "结构感知（代码块/列表/表格）",
    description: "chunk_structure_aware",
  },
  "8": { name: "动态自适应", description: "chunk_dynamic_adaptive" },
  "9": { name: "关系联结", description: "chunk_with_relations" },
};

type StrategyItem = {
  key: string;
  name: string;
  description: string;
  chunkCount: number;
  createdAt: string;
};

const ChunkPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { cardColorStyle } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StrategyItem[]>([]);
  const [publishVisible, setPublishVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selected, setSelected] = useState<Array<string | number>>([]);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const resp = await listDocumentStrategies(id, {
        limit: 200,
        offset: 0,
        include_vector: false,
      });
      const group: ListDocStrategiesNameSpace.StrategyGroup | null =
        Array.isArray(resp) && resp.length > 0 ? resp[0] : null;
      const rows: StrategyItem[] = (
        group ? Object.keys(group).filter((k) => !!STRATEGY_MAP[k]) : []
      )
        .map((k) => {
          const maybeArr = group ? (group[k] as unknown) : undefined;
          const arr = Array.isArray(maybeArr)
            ? (maybeArr as ListDocStrategiesNameSpace.ChunkItem[])
            : [];
          const latest = arr.reduce<string>((acc, cur) => {
            const ts = cur.created_at || "";
            if (!acc) return ts || "";
            if (!ts) return acc;
            const a = new Date(acc).getTime();
            const b = new Date(ts).getTime();
            return b > a ? ts : acc;
          }, "");
          return {
            key: k,
            name: STRATEGY_MAP[k].name,
            description: STRATEGY_MAP[k].description,
            chunkCount: arr.length,
            createdAt: latest || "",
          };
        })
        .filter((r) => r.chunkCount > 0);
      setData(rows);
      setExistingKeys(rows.map((r) => r.key));
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "操作失败";
      Message.error(msg || t("common.error", { _: "操作失败" }));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    {
      title: t("rag.ui.columns.name", { _: "名称" }),
      dataIndex: "name",
    },
    {
      title: t("rag.ui.columns.description", { _: "描述" }),
      dataIndex: "description",
    },
    {
      title: t("rag.ui.columns.count", { _: "切片数量" }),
      dataIndex: "chunkCount",
      width: 120,
    },
    {
      title: t("rag.ui.columns.uploadedAt", { _: "上传时间" }),
      dataIndex: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
      width: 180,
    },
    {
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      render: (_: unknown, record: StrategyItem) => (
        <Space>
          <Button
            icon={<IconEye />}
            onClick={() => navigate(`/rag/${id}/chunks/${record.key}`)}
          >
            {t("rag.ui.columns.view", { _: "查看详情" })}
          </Button>
        </Space>
      ),
      width: 160,
    },
  ];

  const openPublish = () => {
    setPublishVisible(true);
  };

  const submitPublish = async () => {
    if (!id) return;
    const nums = selected.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    if (!nums.length) {
      Message.warning(
        t("rag.ui.selectStrategyTip", { _: "请选择至少一种策略" }),
      );
      return;
    }
    setPublishing(true);
    try {
      await publishDocumentChunk(id, { strategy: nums });
      Message.success(t("rag.msg.publishSuccess", { _: "任务已发布" }));
      setPublishVisible(false);
      setSelected([]);
      fetchData();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "操作失败";
      Message.error(msg || t("common.error", { _: "操作失败" }));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card
      title={
        <Title
          title={t("rag.ui.chunkStrategies", {
            _: "切片策略列表",
          })}
        />
      }
      bordered
      style={cardColorStyle}
    >
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={openPublish}>
          {t("rag.ui.publishChunk", { _: "发布切片任务" })}
        </Button>
      </Space>
      <Table
        loading={loading}
        columns={columns as unknown}
        data={data}
        rowKey="key"
        pagination={false}
      />
      {!loading && data.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          {t("rag.msg.loadFail", { _: "加载失败" })}
        </div>
      )}
      <Modal
        title={t("rag.ui.publishChunk", { _: "发布切片任务" })}
        visible={publishVisible}
        onOk={submitPublish}
        confirmLoading={publishing}
        onCancel={() => setPublishVisible(false)}
      >
        <Space direction="vertical">
          <Checkbox.Group
            value={selected}
            onChange={(vals) => setSelected(vals)}
          >
            {Object.keys(STRATEGY_MAP).map((k) => (
              <Checkbox key={k} value={k} disabled={existingKeys.includes(k)}>
                <Space>
                  <span>{STRATEGY_MAP[k].name}</span>
                  <span style={{ color: "var(--color-text-2)" }}>
                    {STRATEGY_MAP[k].description}
                  </span>
                </Space>
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Space>
      </Modal>
    </Card>
  );
};

export default ChunkPage;
