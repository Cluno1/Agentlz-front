import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Drawer,
  Input,
  Card,
  Spin,
  Message,
  Tag,
} from "@arco-design/web-react";
import { listAgentChatHistory } from "../../../data/api/agent";
import type { AgentChatRecord } from "../../../data/api/agent/type";

type Props = {
  visible: boolean;
  agentId: string;
  userId: string;
  onClose: () => void;
  onPick: (recordId: number) => void;
};

const HistoryDrawer: React.FC<Props> = ({
  visible,
  agentId,
  userId,
  onClose,
  onPick,
}) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AgentChatRecord[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchList = useCallback(async () => {
    if (!agentId) return;
    try {
      setLoading(true);
      const resp = await listAgentChatHistory({
        agent_id: Number.isNaN(Number(agentId)) ? undefined : Number(agentId),
        meta: { user_id: userId },
        page,
        per_page: perPage,
        keyword: keyword || undefined,
      });
      setRows((prev) => (page === 1 ? resp.data : [...prev, ...resp.data]));
      setTotal(resp.total || 0);
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e && "message" in e
          ? (e as { message?: string }).message
          : undefined;
      Message.error(msg || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [agentId, userId, page, perPage, keyword]);

  useEffect(() => {
    if (!visible) return;
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchList();
  }, [page, visible, fetchList]);

  useEffect(() => {
    if (!visible) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          const canMore = rows.length < total;
          if (canMore && !loading) {
            setPage((p) => p + 1);
          }
        }
      },
      { root: null, threshold: 1 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, [visible, rows.length, total, loading]);

  const handleSearch = () => {
    setPage(1);
    setRows([]);
    fetchList();
  };

  return (
    <Drawer
      placement="right"
      width={360}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>历史记录</span>
          <Tag size="small" color="arcoblue">
            总计: {total}
          </Tag>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Input.Search
            allowClear
            placeholder="按关键词搜索"
            style={{ width: 240 }}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            onSearch={handleSearch}
          />
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((h) => {
          const time = h.created_at
            ? new Date(h.created_at).toLocaleString()
            : "";
          const name = h.name || "";
          return (
            <Card
              key={String(h.id ?? h.record_id ?? Math.random())}
              hoverable
              onClick={() => {
                const rid = Number(h.record_id ?? h.id);
                if (!Number.isNaN(rid)) onPick(rid);
              }}
              style={{ cursor: "pointer" }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                {time}
              </div>
              <div
                style={{
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={name}
              >
                {name || "(空)"}
              </div>
            </Card>
          );
        })}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Spin size={16} />
            <span>加载中</span>
          </div>
        )}
        {!loading && rows.length === 0 && (
          <div style={{ fontSize: 13, color: "#6b7280" }}>暂无历史</div>
        )}
        {!loading && rows.length >= total && total > 0 && (
          <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
            已到底
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </Drawer>
  );
};

export default HistoryDrawer;
