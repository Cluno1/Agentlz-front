import React, { useMemo } from "react";
import { Title, useTranslate } from "react-admin";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Button, Space, Tag } from "@arco-design/web-react";
import { useDarkMode } from "../../../data/hook/useDark";
import { getStrategyOption } from "./strategyOptions";

const RagStrategyPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const { strategyId } = useParams<{ strategyId: string }>();
  const { cardColorStyle } = useDarkMode();

  const opt = useMemo(() => {
    if (!strategyId) return undefined;
    return getStrategyOption(strategyId);
  }, [strategyId]);

  const title = opt?.label || t("rag.ui.strategyUnknown", { _: "未知策略" });

  return (
    <Card
      title={
        <Title title={t("rag.ui.strategyDetail", { _: "切片策略详情" })} />
      }
      bordered
      style={{ ...cardColorStyle }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{title}</span>
          {typeof opt?.rating === "number" && (
            <Tag color="green">rating: {opt.rating}</Tag>
          )}
          {strategyId && <Tag>id: {strategyId}</Tag>}
        </div>
        <Space>
          <Button onClick={() => navigate(-1)}>
            {t("common.back", { _: "返回" })}
          </Button>
          <Button type="primary" onClick={() => navigate("/rag/strategy/all")}>
            {t("rag.ui.strategyOverview", { _: "策略总览" })}
          </Button>
        </Space>
      </div>

      <div style={{ marginTop: 16 }}>
        {opt?.details?.length ? (
          <div style={{ display: "grid", rowGap: 8 }}>
            {opt.details.map((d, idx) => (
              <div key={idx} style={{ lineHeight: 1.6 }}>
                {d}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--color-text-2)" }}>
            {t("rag.ui.strategyNoDetail", { _: "暂无该策略的静态描述" })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RagStrategyPage;
