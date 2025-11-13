import { Card, Typography } from "@arco-design/web-react";
import { useTranslate } from "react-admin";

const CreatePage = () => {
  const translate = useTranslate();
  return (
    <div className="p-4 space-y-4">
      <Typography.Title heading={4}>{translate("create.title")}</Typography.Title>
      <Card className="shadow-sm">
        <div className="text-gray-600">{translate("create.placeholder")}</div>
      </Card>
    </div>
  );
};

export default CreatePage;
