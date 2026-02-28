import React, { useMemo } from "react";
import { Title, useTranslate } from "react-admin";
import { useNavigate } from "react-router-dom";
import { Card, Button, Space, Tag } from "@arco-design/web-react";
import { useDarkMode } from "../../data/hook/useDark";
import { strategyOptions } from "./strategyOptions";

const RagStrategyAllPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { cardColorStyle } = useDarkMode();

  const rows = useMemo(
    () =>
      strategyOptions.map((s) => ({
        id: s.value,
        label: s.label,
        rating: s.rating,
        details: s.details,
      })),
    [],
  );

  return (
    <Card
      title={
        <Title title={t("rag.ui.strategyOverview", { _: "切片策略总览" })} />
      }
      bordered
      style={{ ...cardColorStyle }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ color: "var(--color-text-2)" }}>
          {t("rag.ui.strategyOverviewTip", {
            _: "点击任意策略查看详情",
          })}
        </div>
        <Space>
          <Button onClick={() => navigate(-1)}>
            {t("common.back", { _: "返回" })}
          </Button>
        </Space>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        {rows.map((s) => (
          <Card
            key={s.id}
            hoverable
            onClick={() =>
              navigate(`/rag/strategy/${encodeURIComponent(String(s.id))}`)
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{s.label}</span>
                <Tag>id: {s.id}</Tag>
              </div>
              {typeof s.rating === "number" && (
                <Tag color="arcoblue">{s.rating}/10</Tag>
              )}
            </div>
            {Array.isArray(s.details) && s.details.length > 0 ? (
              <div style={{ display: "grid", rowGap: 6 }}>
                {s.details.slice(0, 3).map((d, idx) => (
                  <div
                    key={`${s.id}-${idx}`}
                    style={{ lineHeight: 1.6, color: "var(--color-text-2)" }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--color-text-2)" }}>
                {t("rag.ui.strategyNoDetail", { _: "暂无该策略的静态描述" })}
              </div>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default RagStrategyAllPage;
