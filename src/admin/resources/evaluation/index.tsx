import React, { useState } from "react";
import { Title, useTranslate } from "react-admin";
import { Card, Button, Space } from "@arco-design/web-react";
import Observation from "./component/observation";
import Evaluation from "./component/evaluation";

const EvaluationIndex: React.FC = () => {
  const t = useTranslate();
  const [active, setActive] = useState<"observation" | "evaluation">(
    "observation",
  );
  return (
    <div style={{ paddingTop: "30px" }}>
      <Card
        title={<Title title={t("evaluation.title", { _: "智能体评测" })} />}
        bordered
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Space>
            <Button.Group>
              <Button
                type={active === "observation" ? "primary" : "outline"}
                onClick={() => setActive("observation")}
              >
                {t("evaluation.tabs.observe", { _: "观测" })}
              </Button>
              <Button
                type={active === "evaluation" ? "primary" : "outline"}
                onClick={() => setActive("evaluation")}
              >
                {t("evaluation.tabs.evaluate", { _: "评测" })}
              </Button>
            </Button.Group>
          </Space>
          <Space />
        </div>
        {active === "observation" && <Observation />}
        {active === "evaluation" && <Evaluation />}
      </Card>
    </div>
  );
};

export default EvaluationIndex;
