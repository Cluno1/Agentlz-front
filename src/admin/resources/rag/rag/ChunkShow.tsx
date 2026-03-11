/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { Title, useTranslate } from "react-admin";
import { useParams } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Space,
  Drawer,
  Typography,
  Tag,
  Message,
} from "@arco-design/web-react";
import { IconEye } from "@arco-design/web-react/icon";
import { useDarkMode } from "../../../data/hook/useDark";
import { listDocumentStrategyChunks, getDocument } from "../../../data/api/rag";
import type { ListDocStrategiesNameSpace } from "../../../data/api/rag/type";

type ChunkItem = {
  index: number;
  chunk_id?: string;
  content?: string;
  created_at?: string;
};

const makeChunksFromApi = (
  group: ListDocStrategiesNameSpace.StrategyGroup | null,
  strategyKey: string,
): ChunkItem[] => {
  const maybeArr = group ? (group[strategyKey] as unknown) : undefined;
  const arr = Array.isArray(maybeArr)
    ? (maybeArr as ListDocStrategiesNameSpace.ChunkItem[])
    : [];
  return arr.map((c, idx) => ({
    index: typeof c.index === "number" ? c.index : idx + 1,
    chunk_id: c.chunk_id,
    content: c.content,
    created_at: c.created_at,
  }));
};

const ChunkShow: React.FC = () => {
  const t = useTranslate();
  const { id, strategy = "fixed" } = useParams<{
    id: string;
    strategy: string;
  }>();
  const { textColor, cardColorStyle } = useDarkMode();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [active, setActive] = useState<ChunkItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [docTitle, setDocTitle] = useState<string>("");

  useEffect(() => {
    const fetch = async () => {
      if (!id || !strategy) return;
      setLoading(true);
      try {
        const resp = await listDocumentStrategyChunks(id, strategy, {
          limit: 200,
          offset: 0,
          include_vector: false,
        });
        const group = Array.isArray(resp) && resp.length > 0 ? resp[0] : null;
        const items = makeChunksFromApi(group, String(strategy));
        setChunks(items);
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : "操作失败";
        Message.error(msg || t("common.error", { _: "操作失败" }));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, strategy, t]);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        if (!id) return;
        const detail = await getDocument(id);
        setDocTitle(detail?.title || "");
      } catch {
        setDocTitle("");
      }
    };
    fetchTitle();
  }, [id]);

  const totalCount = useMemo(() => chunks.length, [chunks]);

  const columns = [
    {
      title: t("rag.ui.columns.index", { _: "序号" }),
      dataIndex: "index",
      width: 80,
    },
    {
      title: t("rag.ui.columns.uploadedAt", { _: "时间" }),
      dataIndex: "created_at",
      render: (v: string) => (v ? new Date(v).toLocaleString() : "-"),
      width: 180,
    },
    {
      title: t("rag.ui.columns.preview", { _: "预览" }),
      dataIndex: "content",
      render: (v: string) => (v || "").slice(0, 50) + "...",
    },
    {
      title: t("rag.ui.columns.operations", { _: "操作" }),
      dataIndex: "operations",
      render: (_: any, record: ChunkItem) => (
        <Space>
          <Button
            icon={<IconEye />}
            onClick={() => {
              setActive(record);
              setDrawerVisible(true);
            }}
          >
            {t("rag.ui.columns.view", { _: "查看详情" })}
          </Button>
        </Space>
      ),
      width: 160,
    },
  ];

  return (
    <Card
      title={
        <Title
          title={t("rag.ui.chunkShowTitle", {
            _: "切片块详情",
          })}
        />
      }
      bordered
      style={cardColorStyle}
    >
      <Space style={{ marginBottom: 12 }}>
        <Tag color="blue">
          {t("rag.ui.documentTitle", { _: "文档名称" })}: {docTitle || "-"}
        </Tag>
        <Tag color="green">
          {t("rag.ui.strategy", { _: "策略" })}: {strategy}
        </Tag>
        <Tag>
          {t("rag.ui.totalCount", { _: "总数量" })}: {totalCount}
        </Tag>
      </Space>
      <Table
        loading={loading}
        columns={columns as any}
        data={chunks}
        rowKey="index"
        pagination={{
          pageSize: 10,
        }}
      />

      <Drawer
        width="50%"
        title={t("rag.ui.content", { _: "内容" })}
        visible={drawerVisible}
        onOk={() => setDrawerVisible(false)}
        onCancel={() => setDrawerVisible(false)}
        style={cardColorStyle}
      >
        <div
          style={{
            wordBreak: "break-word",
            color: textColor,
          }}
        >
          {active ? (
            <>
              <Typography.Title heading={5} style={{ color: textColor }}>
                {t("rag.ui.columns.index", { _: "序号" })}: {active.index}
              </Typography.Title>
              <div style={{ marginBottom: 8 }}>
                {t("rag.ui.columns.uploadedAt", { _: "时间" })}:{" "}
                {active.created_at
                  ? new Date(active.created_at).toLocaleString()
                  : "-"}
              </div>
              <Typography.Paragraph>{active.content}</Typography.Paragraph>
            </>
          ) : (
            t("rag.ui.noData", { _: "暂无数据" })
          )}
        </div>
      </Drawer>
    </Card>
  );
};

export default ChunkShow;
