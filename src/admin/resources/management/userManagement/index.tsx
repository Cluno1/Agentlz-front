/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Title, useTranslate, useDataProvider } from "react-admin";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Message,
  Popconfirm,
  Avatar,
  Switch,
} from "@arco-design/web-react";
import { IconPlus, IconEdit, IconDelete } from "@arco-design/web-react/icon";
import type { MockUser } from "../../../data/types/user";
import { useNavigate } from "react-router-dom";

export const UserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MockUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<keyof MockUser>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const t = useTranslate();
  const dataProvider = useDataProvider();

  const columns = useMemo(
    () => [
      {
        title: t("userManagement.columns.avatar"),
        dataIndex: "avatar",
        width: 64,
        render: (v: string, record: MockUser) => (
          <Avatar size={32}>
            <img src={v} alt={record.fullName || record.username} />
          </Avatar>
        ),
      },
      {
        title: t("userManagement.columns.id"),
        dataIndex: "id",
        sorter: true,
        width: 180,
      },
      {
        title: t("userManagement.columns.username"),
        dataIndex: "username",
        sorter: true,
      },
      { title: t("userManagement.columns.email"), dataIndex: "email" },
      { title: t("userManagement.columns.fullName"), dataIndex: "fullName" },
      {
        title: t("userManagement.columns.role"),
        dataIndex: "role",
        sorter: true,
        render: (v: string) => t(`user.role.${v}`) || v,
      },
      {
        title: t("userManagement.columns.disabled"),
        dataIndex: "disabled",
        sorter: true,
        render: (v: boolean, record: MockUser) => (
          <Switch
            checked={!!v}
            onChange={async (checked) => {
              try {
                await dataProvider.update("users", {
                  id: record.id,
                  data: { disabled: checked },
                } as any);
                Message.success(
                  t("userManagement.messages.updateStatusSuccess"),
                );
                fetchList();
              } catch (e: any) {
                Message.error(
                  e?.message || t("userManagement.messages.updateStatusError"),
                );
              }
            }}
          />
        ),
      },
      {
        title: t("userManagement.columns.createdAt"),
        dataIndex: "createdAt",
        render: (v: string) => (v ? new Date(v).toLocaleString() : ""),
        sorter: true,
      },
      {
        title: t("userManagement.columns.operations"),
        dataIndex: "operations",
        render: (_: any, record: MockUser) => (
          <Space>
            <Button
              icon={<IconEdit />}
              onClick={() => {
                navigate(`/user-management/${record.id}`);
              }}
            >
              {t("userManagement.columns.edit")}
            </Button>
            <Popconfirm
              title={t("userManagement.columns.deleteConfirm")}
              onOk={() => handleDelete(record.id)}
            >
              <Button status="danger" icon={<IconDelete />}>
                {t("userManagement.columns.delete")}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, t],
  );

  const fetchList = async () => {
    try {
      setLoading(true);
      const { data: list, total: count } = await dataProvider.getList("users", {
        pagination: { page, perPage: pageSize },
        sort: { field: sortField as string, order: sortOrder },
        filter: query ? { q: query } : {},
      });
      setData(list as MockUser[]);
      setTotal(count || 0);
    } catch (e: any) {
      Message.error(e?.message || t("userManagement.messages.listError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortField, sortOrder, query]);

  const handleCreateClick = () => {
    navigate("/user-management/create");
  };

  const handleDelete = async (id: string) => {
    try {
      await dataProvider.delete("users", { id });
      Message.success(t("userManagement.messages.deleteSuccess"));
      fetchList();
    } catch (e: any) {
      Message.error(e?.message || t("userManagement.messages.deleteError"));
    }
  };

  return (
    <Card
      title={<Title title={t("userManagement.title")} />}
      extra={null}
      bordered
    >
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          style={{ width: 280 }}
          placeholder={t("userManagement.searchPlaceholder")}
          allowClear
          onSearch={(v) => {
            setPage(1);
            setQuery(v);
          }}
        />
        <Button type="primary" icon={<IconPlus />} onClick={handleCreateClick}>
          {t("userManagement.createButton")}
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        data={data}
        pagination={{ current: page, pageSize, total, showTotal: true }}
        onChange={(pagination, sorterParam) => {
          const { current = 1, pageSize: ps = 10 } = pagination || {};
          setPage(current);
          setPageSize(ps);
          const s = Array.isArray(sorterParam)
            ? sorterParam[sorterParam.length - 1]
            : sorterParam;
          if (s && (s as any).field) {
            const field = (s as any).field as keyof MockUser;
            const dir = (s as any).direction || "ascend";
            setSortField(field);
            setSortOrder(dir === "ascend" ? "ASC" : "DESC");
          }
        }}
      />
    </Card>
  );
};
