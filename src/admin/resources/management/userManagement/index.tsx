/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Title } from "react-admin";
import { Card, Table, Button, Space, Input, Message, Popconfirm, Avatar, Switch } from "@arco-design/web-react";
import { IconPlus, IconEdit, IconDelete } from "@arco-design/web-react/icon";
import usersApi from "../../../api/users.ts";
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

  const columns = useMemo(
    () => [
      {
        title: "头像",
        dataIndex: "avatar",
        width: 64,
        render: (v: string) => <Avatar size={32} imageProps={{ src: v }} />,
      },
      { title: "ID", dataIndex: "id", sorter: true, width: 180 },
      { title: "用户名", dataIndex: "username", sorter: true },
      { title: "邮箱", dataIndex: "email" },
      { title: "姓名", dataIndex: "fullName" },
      { title: "角色", dataIndex: "role", sorter: true },
      {
        title: "禁用登录",
        dataIndex: "disabled",
        render: (v: boolean, record: MockUser) => (
          <Switch
            checked={!!v}
            onChange={async (checked) => {
              try {
                await usersApi.updateUser(record.id, { disabled: checked });
                Message.success("状态已更新");
                fetchList();
              } catch (e: any) {
                Message.error(e?.message || "更新失败");
              }
            }}
          />
        ),
      },
      {
        title: "创建时间",
        dataIndex: "createdAt",
        render: (v: string) => (v ? new Date(v).toLocaleString() : ""),
      },
      {
        title: "操作",
        dataIndex: "operations",
        render: (_: any, record: MockUser) => (
          <Space>
            <Button
              icon={<IconEdit />}
              onClick={() => {
                navigate(`/user-management/${record.id}`);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除该用户吗？"
              onOk={() => handleDelete(record.id)}
            >
              <Button status="danger" icon={<IconDelete />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate],
  );

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await usersApi.listUsers({
        page,
        perPage: pageSize,
        sortField,
        sortOrder,
        filter: query ? { q: query } : undefined,
      });
      setData(res.data);
      setTotal(res.total);
    } catch (e: any) {
      Message.error(e?.message || "获取用户列表失败");
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
      await usersApi.deleteUser(id);
      Message.success("删除成功");
      fetchList();
    } catch (e: any) {
      Message.error(e?.message || "删除失败");
    }
  };

  return (
    <Card title={<Title title="用户管理" />} extra={null} bordered>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          style={{ width: 280 }}
          placeholder="搜索用户名/邮箱/姓名"
          allowClear
          onSearch={(v) => {
            setPage(1);
            setQuery(v);
          }}
        />
        <Button type="primary" icon={<IconPlus />} onClick={handleCreateClick}>
          新建用户
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns as any}
        data={data}
        pagination={{ current: page, pageSize, total, showTotal: true }}
        onChange={(pagination, sorter) => {
          const { current = 1, pageSize: ps = 10 } = pagination || {};
          setPage(current);
          setPageSize(ps);
          if (sorter && sorter.field) {
            setSortField(sorter.field as keyof MockUser);
            setSortOrder(
              (sorter.direction || "ascend") === "ascend" ? "ASC" : "DESC",
            );
          }
        }}
      />
    </Card>
  );
};
