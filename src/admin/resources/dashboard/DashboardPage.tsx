import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Button, Card, Space, Typography, Tag } from "@arco-design/web-react";
import { usePermissions, useTranslate } from "react-admin";
import { listVisibleAnnouncements } from "../../data/api/announcement";
import type { ListAnnouncementsNameSpace } from "../../data/api/announcement/type";
import { wsClient } from "../../data/wsClient";
import type { WSMessage } from "../../data/wsClient";

const DashboardPage: React.FC = () => {
  const t = useTranslate();
  const { permissions } = usePermissions();
  const tenantKey = import.meta.env.VITE_TENANT_ID as string;
  const tenantId = localStorage.getItem(tenantKey) || "default";
  const isSuperAdmin = useMemo(
    () =>
      permissions === "admin" &&
      (tenantId === "system" || tenantId === "default"),
    [permissions, tenantId],
  );
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<
    ListAnnouncementsNameSpace.ListAnnouncementsResult[]
  >([]);
  const option = {
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: "bar",
      },
    ],
  };

  const systemAnnouncements = useMemo(
    () => announcements.filter((a) => a.tenant_id === "system" && !a.disabled),
    [announcements],
  );
  const tenantAnnouncements = useMemo(
    () => announcements.filter((a) => a.tenant_id === tenantId && !a.disabled),
    [announcements, tenantId],
  );

  const fetchAnnouncements = React.useCallback(async () => {
    try {
      setLoading(true);
      const resp = await listVisibleAnnouncements(30);
      setAnnouncements(resp.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleWsMessage = React.useCallback(
    (msg: WSMessage) => {
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "announcement.updated") {
        const data = (msg.data ||
          {}) as ListAnnouncementsNameSpace.ListAnnouncementsResult;
        if (!data || !data.id) return;
        setAnnouncements((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((x) => String(x.id) === String(data.id));
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], ...data };
            return copy;
          }
          return [data, ...copy];
        });
        return;
      }
      if (msg.type === "announcement.deleted") {
        const data = (msg.data || {}) as { id?: number | string };
        if (!data?.id) return;
        setAnnouncements((prev) =>
          prev.filter((a) => String(a.id) !== String(data.id)),
        );
      }
    },
    [setAnnouncements],
  );

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    const systemTopic = "announcement:system";
    const tenantTopic = `announcement:tenant:${tenantId}`;
    wsClient.subscribe(systemTopic, handleWsMessage);
    if (tenantId && tenantId !== "system") {
      wsClient.subscribe(tenantTopic, handleWsMessage);
    }
    return () => {
      wsClient.unsubscribe(systemTopic, handleWsMessage);
      if (tenantId && tenantId !== "system") {
        wsClient.unsubscribe(tenantTopic, handleWsMessage);
      }
    };
  }, [tenantId, handleWsMessage]);

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card
          title={t("dashboard.title", { _: "仪表盘" })}
          extra={
            <Button size="small" loading={loading} onClick={fetchAnnouncements}>
              {t("common.refresh", { _: "刷新" })}
            </Button>
          }
        >
          <Space direction="vertical" size="medium" style={{ width: "100%" }}>
            <div>
              <Typography.Title heading={6}>
                {t("dashboard.systemAnnouncement", { _: "系统公告" })}
              </Typography.Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                {systemAnnouncements.length === 0 && (
                  <Typography.Text>
                    {t("dashboard.noAnnouncement", { _: "暂无公告" })}
                  </Typography.Text>
                )}
                {systemAnnouncements.map((a) => (
                  <Card key={`sys-${a.id}`} bordered>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space>
                        <Tag color="arcoblue">SYSTEM</Tag>
                        <Typography.Text style={{ fontWeight: 600 }}>
                          {a.title}
                        </Typography.Text>
                      </Space>
                      <Typography.Paragraph>
                        {a.content || "-"}
                      </Typography.Paragraph>
                    </Space>
                  </Card>
                ))}
              </Space>
            </div>
            {!isSuperAdmin && (
              <div>
                <Typography.Title heading={6}>
                  {t("dashboard.tenantAnnouncement", { _: "租户公告" })}
                </Typography.Title>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {tenantAnnouncements.length === 0 && (
                    <Typography.Text>
                      {t("dashboard.noAnnouncement", { _: "暂无公告" })}
                    </Typography.Text>
                  )}
                  {tenantAnnouncements.map((a) => (
                    <Card key={`ten-${a.id}`} bordered>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Space>
                          <Tag color="gold">TENANT</Tag>
                          <Typography.Text style={{ fontWeight: 600 }}>
                            {a.title}
                          </Typography.Text>
                        </Space>
                        <Typography.Paragraph>
                          {a.content || "-"}
                        </Typography.Paragraph>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </div>
            )}
          </Space>
        </Card>
        <Card>
          <ReactECharts option={option} />
        </Card>
      </Space>
    </div>
  );
};

export default DashboardPage;
