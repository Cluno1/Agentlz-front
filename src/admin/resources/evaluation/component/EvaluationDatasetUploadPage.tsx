/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { Title, useTranslate } from "react-admin";
import {
  Card,
  Space,
  Input,
  Button,
  Upload,
  Message,
  Select,
  Modal,
  Typography,
} from "@arco-design/web-react";
import type { UploadItem } from "@arco-design/web-react/es/Upload/interface";
import { useNavigate } from "react-router-dom";
import {
  createEvaluationDataset,
  parseDatasetToAlpaca,
} from "../../../data/api/evaluation";

const EvaluationDatasetUploadPage: React.FC = () => {
  const t = useTranslate();
  const navigate = useNavigate();
  const [datasetName, setDatasetName] = useState("evaluation_dataset");
  const [datasetType, setDatasetType] = useState<"self" | "tenant" | "system">(
    "tenant",
  );
  const [jsonText, setJsonText] = useState("");
  const [fileList, setFileList] = useState<UploadItem[]>([]);
  const [rawJson, setRawJson] = useState<unknown>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const isAlpaca = useMemo(() => {
    if (!Array.isArray(rawJson)) return false;
    return rawJson.every((x) => {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return "instruction" in o && "input" in o && "output" in o;
    });
  }, [rawJson]);

  const normalizePreview = React.useCallback((val: unknown) => {
    const text = JSON.stringify(val, null, 2);
    setJsonText(text || "[]");
    setRawJson(val);
  }, []);

  const isAlpacaSchema = React.useCallback((val: unknown) => {
    if (!Array.isArray(val)) return false;
    return val.every((x) => {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return "instruction" in o && "input" in o && "output" in o;
    });
  }, []);

  const parseJsonl = React.useCallback((text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => !!l);
    const arr = lines.map((line) => JSON.parse(line));
    return arr;
  }, []);

  const parseText = React.useCallback(
    async (text: string) => {
      const src = String(text || "").trim();
      try {
        const parsed = JSON.parse(src);
        normalizePreview(parsed);
        Message.success("JSON解析成功");
        if (!isAlpacaSchema(parsed)) {
          try {
            setParsing(true);
            const resp = await parseDatasetToAlpaca({
              raw_json: parsed,
              hint: "请将输入转换为 alpaca 格式数组",
            });
            const items = resp?.items || [];
            normalizePreview(items);
            Message.success("已转换为alpaca格式");
          } catch (e: unknown) {
            Message.error((e as any)?.message || "转换失败");
          } finally {
            setParsing(false);
          }
        }
        return;
      } catch {
        try {
          const arr = parseJsonl(src);
          normalizePreview(arr);
          Message.success("JSONL解析成功");
          if (!isAlpacaSchema(arr)) {
            try {
              setParsing(true);
              const resp = await parseDatasetToAlpaca({
                raw_json: arr,
                hint: "请将输入转换为 alpaca 格式数组",
              });
              const items = resp?.items || [];
              normalizePreview(items);
              Message.success("已转换为alpaca格式");
            } catch (e: unknown) {
              Message.error((e as any)?.message || "转换失败");
            } finally {
              setParsing(false);
            }
          }
          return;
        } catch {
          try {
            setParsing(true);
            const resp = await parseDatasetToAlpaca({
              raw_json: src,
              hint: "请将输入转换为 alpaca 格式数组",
            });
            const items = resp?.items || [];
            normalizePreview(items);
            Message.success("已转换为alpaca格式");
          } catch (e: unknown) {
            Message.error((e as any)?.message || "解析失败");
          } finally {
            setParsing(false);
          }
        }
      }
    },
    [normalizePreview, isAlpacaSchema, parseJsonl],
  );

  const parseFile = React.useCallback(
    async (file: File) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (ext === "json" || ext === "jsonl") {
        const text = await file.text();
        await parseText(text);
        return;
      }
      Message.error("仅支持JSON/JSONL文件");
    },
    [parseText],
  );

  const handleConvert = React.useCallback(async () => {
    try {
      setParsing(true);
      const resp = await parseDatasetToAlpaca({
        raw_json: rawJson,
        hint: "请将输入转换为 alpaca 格式数组",
      });
      const items = resp?.items || [];
      normalizePreview(items);
      Message.success("已转换为alpaca格式");
      setShowConvertModal(false);
    } catch (e: unknown) {
      Message.error((e as any)?.message || "转换失败");
    } finally {
      setParsing(false);
    }
  }, [rawJson, normalizePreview]);

  const handleSave = React.useCallback(async () => {
    try {
      setSaving(true);
      let payload: unknown = rawJson;
      if (jsonText.trim()) {
        payload = JSON.parse(jsonText);
      }
      await createEvaluationDataset({
        name: datasetName || "evaluation_dataset",
        type: datasetType,
        data_json: payload,
      });
      Message.success(t("common.success", { _: "保存成功" }));
      navigate("/evaluation");
    } catch (e: unknown) {
      Message.error((e as any)?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }, [datasetName, datasetType, rawJson, jsonText, t, navigate]);

  return (
    <Card
      title={
        <Title title={t("evaluation.ui.uploadFile", { _: "上传测试集" })} />
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Space>
          <Input
            style={{ width: 320 }}
            value={datasetName}
            onChange={setDatasetName}
            placeholder="请输入测评集名称"
          />
          <Select
            value={datasetType}
            style={{ width: 160 }}
            onChange={(v) => setDatasetType(v as "self" | "tenant" | "system")}
          >
            <Select.Option value="self">个人</Select.Option>
            <Select.Option value="tenant">租户</Select.Option>
            <Select.Option value="system">系统</Select.Option>
          </Select>
        </Space>
        <Upload
          drag
          autoUpload={false}
          fileList={fileList}
          onChange={(list) => setFileList(list)}
          accept=".json,.jsonl"
          onDrop={(e) => {
            const file = e.dataTransfer?.files?.[0];
            if (file) parseFile(file);
          }}
        />
        <Space>
          <Button
            onClick={async () => {
              const file = fileList[0]?.originFile as File;
              if (!file) {
                Message.warning("请先选择文件");
                return;
              }
              await parseFile(file);
            }}
          >
            解析文件
          </Button>
          <Button onClick={() => parseText(jsonText)}>解析文本域JSON</Button>
          {!isAlpaca && (
            <Button loading={parsing} onClick={handleConvert}>
              转换为alpaca格式
            </Button>
          )}
        </Space>
        <Input.TextArea
          value={jsonText}
          onChange={setJsonText}
          placeholder="在此粘贴JSON或JSONL，或先上传文件后自动填充"
          style={{ minHeight: 220 }}
        />
        <Button type="primary" loading={saving} onClick={handleSave}>
          保存测评集
        </Button>
      </Space>
      <Modal
        visible={showConvertModal}
        onCancel={() => setShowConvertModal(false)}
        onOk={handleConvert}
        confirmLoading={parsing}
        title="检测到非alpaca格式"
      >
        <Typography.Paragraph>
          当前文件解析结果不是alpaca格式，是否调用后端接口转换为alpaca格式JSON？
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
};

export default EvaluationDatasetUploadPage;
