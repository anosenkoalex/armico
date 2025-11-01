import {
  Card,
  Descriptions,
  Flex,
  Result,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  Assignment,
  AssignmentStatus,
  CurrentWorkplaceResponse,
  fetchCurrentWorkplace,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const statusColor: Record<AssignmentStatus, string> = {
  ACTIVE: 'green',
  ARCHIVED: 'default',
};

const MyPlace = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const columns = useMemo(
    () => [
      {
        title: t('assignments.workplace'),
        dataIndex: ['workplace', 'name'],
        key: 'workplace',
        render: (_value: unknown, record: Assignment) => (
          <span>
            {record.workplace?.code ? `${record.workplace.code} — ` : ''}
            {record.workplace?.name}
          </span>
        ),
      },
      {
        title: t('myPlace.startsAt'),
        dataIndex: 'startsAt',
        key: 'startsAt',
        render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
      },
      {
        title: t('myPlace.endsAt'),
        dataIndex: 'endsAt',
        key: 'endsAt',
        render: (value: string | null) =>
          value
            ? dayjs(value).format('DD.MM.YYYY HH:mm')
            : t('myPlace.noEndDate'),
      },
      {
        title: t('myPlace.status'),
        dataIndex: 'status',
        key: 'status',
        render: (value: AssignmentStatus) => (
          <Tag color={statusColor[value]}>
            {value === 'ACTIVE'
              ? t('assignments.status.active')
              : t('assignments.status.archived')}
          </Tag>
        ),
      },
    ],
    [t],
  );

  const { data, isLoading } = useQuery<CurrentWorkplaceResponse>({
    queryKey: ['me', 'current-workplace'],
    queryFn: fetchCurrentWorkplace,
    refetchInterval: 60_000,
  });

  if (!profile) {
    return (
      <Flex justify="center" align="center" className="min-h-[40vh]">
        <Spin tip={t('common.loading')} />
      </Flex>
    );
  }

  const currentAssignment = data?.assignment ?? null;
  const currentWorkplace = data?.workplace ?? null;
  const history = data?.history ?? [];

  return (
    <Flex vertical gap={16}>
      <Card title={t('myPlace.title')}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('myPlace.name')}>
            {profile.fullName ?? profile.email}
          </Descriptions.Item>
          <Descriptions.Item label={t('myPlace.position')}>
            {profile.position ?? t('myPlace.positionUnknown')}
          </Descriptions.Item>
          <Descriptions.Item label={t('myPlace.org')}>
            {profile.org?.name ?? t('myPlace.orgUnknown')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('myPlace.currentAssignment')}>
        {isLoading ? (
          <Flex justify="center">
            <Spin />
          </Flex>
        ) : !currentAssignment ? (
          <Result status="info" title={t('myPlace.noAssignment')} />
        ) : (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t('assignments.workplace')}>
              {currentWorkplace ? (
                <Typography.Text>
                  {currentWorkplace.code ? `${currentWorkplace.code} — ` : ''}
                  {currentWorkplace.name}
                </Typography.Text>
              ) : (
                t('assignments.workplace')
              )}
            </Descriptions.Item>
            {currentWorkplace?.location ? (
              <Descriptions.Item label={t('workplaces.location')}>
                {currentWorkplace.location}
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label={t('myPlace.startsAt')}>
              {dayjs(currentAssignment.startsAt).format('DD.MM.YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={t('myPlace.endsAt')}>
              {currentAssignment.endsAt
                ? dayjs(currentAssignment.endsAt).format('DD.MM.YYYY HH:mm')
                : t('myPlace.noEndDate')}
            </Descriptions.Item>
            <Descriptions.Item label={t('myPlace.status')}>
              <Tag color={statusColor[currentAssignment.status]}>
                {currentAssignment.status === 'ACTIVE'
                  ? t('assignments.status.active')
                  : t('assignments.status.archived')}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title={t('myPlace.assignmentsHistory')}>
        <Table
          rowKey="id"
          dataSource={history}
          columns={columns}
          pagination={false}
          locale={{ emptyText: t('assignments.empty') }}
        />
      </Card>
    </Flex>
  );
};

export default MyPlace;
