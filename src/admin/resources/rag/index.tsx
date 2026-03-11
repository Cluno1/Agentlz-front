import React, { useMemo } from "react";
import { useTranslate } from "react-admin";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Space } from "@arco-design/web-react";
import RagPage from "./rag/RagPage";
import EvaluationDocsPage from "./eva/EvaluationDocsPage";

const RagIndexPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const location = useLocation();

  const tab = useMemo(() => {
    const p = location.pathname || "";
    const search = new URLSearchParams(location.search || "");
    const q = search.get("tab");
    if (q === "evaluation" || q === "knowledge") return q;
    if (p.includes("/rag/evaluation")) return "evaluation";
    return "knowledge";
  }, [location.pathname, location.search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", rowGap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <Space wrap>
          <Button
            type={tab === "knowledge" ? "primary" : "default"}
            onClick={() => navigate("/rag?tab=knowledge")}
          >
            {t("rag.ui.knowledgeDocs", { _: "知识文档" })}
          </Button>
          <Button
            type={tab === "evaluation" ? "primary" : "default"}
            onClick={() => navigate("/rag?tab=evaluation")}
          >
            {t("evaluation.ui.evalDocs", { _: "测评文档" })}
          </Button>
        </Space>
      </div>

      {tab === "knowledge" ? <RagPage /> : <EvaluationDocsPage />}
    </div>
  );
};

export default RagIndexPage;
