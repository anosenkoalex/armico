import {
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Result,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  Assignment,
  AssignmentStatus,
  User,
  Workplace,
  createAssignment,
  createWorkplace,
  fetchAssignments,
  fetchUsers,
  fetchWorkplaces,
  updateAssignment,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const statusOptions: { value: AssignmentStatus; labelKey: string }[] = [
  { value: 'PLANNED', labelKey: 'assignments.status.planned' },
  { value: 'ACTIVE', labelKey: 'assignments.status.active' },
  { value: 'COMPLETED', labelKey: 'assignments.status.completed' },
];

const statusColor: Record<AssignmentStatus, string> = {
  PLANNED: 'blue',
  ACTIVE: 'green',
  COMPLETED: 'default',
};

const Admin = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [workplaceForm] = Form.useForm();
  const [assignmentForm] = Form.useForm();

  const orgId = user?.orgId;
  const isAdmin =
    user?.role && ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER'].includes(user.role);

  const workplacesQuery = useQuery<Workplace[]>({
    queryKey: ['workplaces'],
    queryFn: fetchWorkplaces,
    enabled: isAdmin,
  });

  const assignmentsQuery = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const usersQuery = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const createWorkplaceMutation = useMutation({
    mutationFn: createWorkplace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workplaces'] });
      message.success(t('admin.workplaceCreated'));
      workplaceForm.resetFields();
    },
    onError: () => message.error(t('common.error')),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
      message.success(t('admin.assignmentCreated'));
      assignmentForm.resetFields();
    },
    onError: () => message.error(t('common.error')),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateAssignment>[1];
    }) => updateAssignment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
      message.success(t('admin.assignmentUpdated'));
    },
    onError: () => message.error(t('common.error')),
  });

  if (!isAdmin || !orgId) {
    return (
      <Result status="403" title={t('admin.accessDenied')} />
    );
  }

  if (workplacesQuery.isLoading || assignmentsQuery.isLoading || usersQuery.isLoading) {
    return (
      <Flex justify="center" align="center" className="min-h-[40vh]">
        <Spin tip={t('common.loading')} />
      </Flex>
    );
  }

  if (workplacesQuery.isError || assignmentsQuery.isError || usersQuery.isError) {
    return <Typography.Text type="danger">{t('common.error')}</Typography.Text>;
  }

  const workplaces = workplacesQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const workplaceFormFinish = async (values: {
    name: string;
    address: string;
    capacity: number;
  }) => {
    await createWorkplaceMutation.mutateAsync({ ...values, orgId });
  };

  const assignmentFormFinish = async (values: {
    userId: string;
    workplaceId: string;
    period: [Dayjs, Dayjs];
    status: AssignmentStatus;
  }) => {
    const [start, end] = values.period;

    await createAssignmentMutation.mutateAsync({
      orgId,
      userId: values.userId,
      workplaceId: values.workplaceId,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      status: values.status,
    });
  };

  const columns: ColumnsType<Assignment> = [
    {
      title: t('assignments.user'),
      dataIndex: ['user', 'fullName'],
      key: 'user',
      render: (_value, record) =>
        record.user?.fullName ?? record.user?.email ?? t('assignments.user'),
    },
    {
      title: t('assignments.workplace'),
      dataIndex: ['workplace', 'name'],
      key: 'workplace',
      render: (_value, record) => (
        <Select
          value={record.workplaceId}
          disabled={updateAssignmentMutation.isPending}
          onChange={(value) =>
            updateAssignmentMutation.mutate({
              id: record.id,
              payload: { workplaceId: value },
            })
          }
          options={workplaces.map((workplace) => ({
            value: workplace.id,
            label: workplace.name,
          }))}
        />
      ),
    },
    {
      title: t('assignments.status.title'),
      key: 'status',
      render: (_value, record) => (
        <Select
          value={record.status}
          disabled={updateAssignmentMutation.isPending}
          onChange={(value: AssignmentStatus) =>
            updateAssignmentMutation.mutate({
              id: record.id,
              payload: { status: value },
            })
          }
          options={statusOptions.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
        />
      ),
    },
    {
      title: t('assignments.timeframe'),
      key: 'timeframe',
      render: (_value, record) => (
        <Typography.Text>
          {dayjs(record.startsAt).format('YYYY-MM-DD HH:mm')} →
          {' '}
          {dayjs(record.endsAt).format('YYYY-MM-DD HH:mm')}
        </Typography.Text>
      ),
    },
    {
      title: t('admin.statusTag'),
      key: 'statusTag',
      render: (_value, record) => (
        <Tag color={statusColor[record.status]}>
          {t(`assignments.status.${record.status.toLowerCase()}`)}
        </Tag>
      ),
    },
  ];

  return (
    <Tabs
      items={[
        {
          key: 'workplaces',
          label: t('admin.workplacesTab'),
          children: (
            <Flex vertical gap={16}>
              <Card title={t('admin.createWorkplace')}>
                <Form
                  form={workplaceForm}
                  layout="vertical"
                  onFinish={workplaceFormFinish}
                  disabled={createWorkplaceMutation.isPending}
                >
                  <Form.Item
                    label={t('workplaces.title')}
                    name="name"
                    rules={[{ required: true, message: t('admin.required') }]}
                  >
                    <Input placeholder={t('admin.placeholders.workplaceName')} />
                  </Form.Item>
                  <Form.Item
                    label={t('workplaces.address')}
                    name="address"
                    rules={[{ required: true, message: t('admin.required') }]}
                  >
                    <Input placeholder={t('admin.placeholders.workplaceAddress')} />
                  </Form.Item>
                  <Form.Item
                    label={t('workplaces.capacity')}
                    name="capacity"
                    initialValue={10}
                    rules={[{ required: true, message: t('admin.required') }]}
                  >
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      {t('admin.saveWorkplace')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card title={t('workplaces.title')}>
                <List
                  dataSource={workplaces}
                  renderItem={(item) => (
                    <List.Item>
                      <Flex justify="space-between" className="w-full">
                        <div>
                          <Typography.Text strong>{item.name}</Typography.Text>
                          <Typography.Paragraph className="mb-0">
                            {item.address}
                          </Typography.Paragraph>
                        </div>
                        <Typography.Text>
                          {t('workplaces.capacity')}: {item.capacity}
                        </Typography.Text>
                      </Flex>
                    </List.Item>
                  )}
                  locale={{ emptyText: t('admin.noWorkplaces') }}
                />
              </Card>
            </Flex>
          ),
        },
        {
          key: 'assignments',
          label: t('admin.assignmentsTab'),
          children: (
            <Flex vertical gap={16}>
              <Card title={t('admin.createAssignment')}>
                <Form
                  form={assignmentForm}
                  layout="vertical"
                  onFinish={assignmentFormFinish}
                  disabled={createAssignmentMutation.isPending}
                >
                  <Form.Item
                    label={t('assignments.user')}
                    name="userId"
                    rules={[{ required: true, message: t('admin.required') }]}
                  >
                    <Select
                      options={users.map((item) => ({
                        value: item.id,
                        label: `${item.fullName} (${item.email})`,
                      }))}
                      placeholder={t('admin.placeholders.user')}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('assignments.workplace')}
                    name="workplaceId"
                    rules={[{ required: true, message: t('admin.required') }]}
                  >
                    <Select
                      options={workplaces.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))}
                      placeholder={t('admin.placeholders.workplace')}
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('admin.assignmentPeriod')}
                    name="period"
                    rules={[{ required: true, message: t('admin.required') }]}
                  >
                    <DatePicker.RangePicker
                      className="w-full"
                      showTime
                      format="YYYY-MM-DD HH:mm"
                    />
                  </Form.Item>
                  <Form.Item
                    label={t('assignments.status.title')}
                    name="status"
                    initialValue="PLANNED"
                  >
                    <Select
                      options={statusOptions.map((option) => ({
                        value: option.value,
                        label: t(option.labelKey),
                      }))}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      {t('admin.saveAssignment')}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              <Card title={t('admin.assignmentsList')}>
                <Table
                  rowKey="id"
                  dataSource={assignments}
                  columns={columns}
                  pagination={false}
                  locale={{ emptyText: t('assignments.empty') }}
                  loading={updateAssignmentMutation.isPending}
                />
              </Card>
            </Flex>
          ),
        },
      ]}
    />
  );
};

export default Admin;
