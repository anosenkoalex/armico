import {
  Card,
  Descriptions,
  Flex,
  List,
  Result,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Assignment,
  AssignmentStatus,
  Notification,
  UserProfile,
  fetchNotifications,
  fetchProfile,
} from '../api/client.js';

const statusColors: Record<AssignmentStatus, string> = {
  PLANNED: 'blue',
  ACTIVE: 'green',
  COMPLETED: 'default',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    hour12: false,
  });

const MyPlace = () => {
  const { t } = useTranslation();
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: fetchProfile,
    refetchInterval: 60_000,
  });

  const {
    data: notifications,
    isLoading: notificationsLoading,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', 'me'],
    queryFn: fetchNotifications,
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" className="min-h-[40vh]">
        <Spin tip={t('common.loading')} />
      </Flex>
    );
  }

  if (isError || !profile) {
    return <Typography.Text type="danger">{t('common.error')}</Typography.Text>;
  }

  const currentAssignment = profile.currentAssignment;

  return (
    <Flex vertical gap={16}>
      <Card title={t('myPlace.title')}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('myPlace.name')}>
            {profile.fullName}
          </Descriptions.Item>
          <Descriptions.Item label={t('myPlace.position')}>
            {profile.position}
          </Descriptions.Item>
          <Descriptions.Item label={t('myPlace.org')}>
            {profile.org.name}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('myPlace.currentAssignment')}>
        {!currentAssignment ? (
          <Result status="info" title={t('myPlace.noAssignment')} />
        ) : (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t('assignments.workplace')}>
              {currentAssignment.workplace?.name}
            </Descriptions.Item>
            <Descriptions.Item label={t('workplaces.address')}>
              {currentAssignment.workplace?.address}
            </Descriptions.Item>
            <Descriptions.Item label={t('myPlace.startsAt')}>
              {formatDate(currentAssignment.startsAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('myPlace.endsAt')}>
              {formatDate(currentAssignment.endsAt)}
            </Descriptions.Item>
            <Descriptions.Item label={t('myPlace.status')}>
              <Tag color={statusColors[currentAssignment.status]}> 
                {t(`assignments.status.${currentAssignment.status.toLowerCase()}`)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title={t('myPlace.assignmentsHistory')}>
        <List
          dataSource={profile.assignments}
          renderItem={(item: Assignment) => (
            <List.Item key={item.id}>
              <Flex className="w-full" justify="space-between" align="center">
                <div>
                  <Typography.Text strong>
                    {item.workplace?.name ?? t('assignments.workplace')}
                  </Typography.Text>
                  <Typography.Paragraph className="mb-0">
                    {formatDate(item.startsAt)} → {formatDate(item.endsAt)}
                  </Typography.Paragraph>
                  <Typography.Paragraph type="secondary" className="mb-0">
                    {item.workplace?.address ?? ''}
                  </Typography.Paragraph>
                </div>
                <Tag color={statusColors[item.status]}>
                  {t(`assignments.status.${item.status.toLowerCase()}`)}
                </Tag>
              </Flex>
            </List.Item>
          )}
          locale={{ emptyText: t('assignments.empty') }}
        />
      </Card>

      <Card title={t('myPlace.notifications')}>
        {notificationsLoading ? (
          <Flex justify="center">
            <Spin />
          </Flex>
        ) : (
          <List
            dataSource={notifications ?? []}
            renderItem={(item: Notification) => (
              <List.Item key={item.id}>
                <Flex className="w-full" justify="space-between">
                  <Typography.Text>{item.message}</Typography.Text>
                  <Typography.Text type="secondary">
                    {formatDate(item.createdAt)}
                  </Typography.Text>
                </Flex>
              </List.Item>
            )}
            locale={{ emptyText: t('myPlace.noNotifications') }}
          />
        )}
      </Card>
    </Flex>
  );
};

export default MyPlace;
