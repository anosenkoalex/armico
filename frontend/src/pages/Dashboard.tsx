import { Card, Flex, Result, Spin, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { fetchCurrentWorkplace } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const Dashboard = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'current-workplace', 'dashboard'],
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

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={2}>
        {t('dashboard.greeting', {
          name: profile.fullName ?? profile.email,
        })}
      </Typography.Title>

      <Card title={t('dashboard.currentPlace')}>
        {isLoading ? (
          <Flex justify="center">
            <Spin />
          </Flex>
        ) : !data?.assignment ? (
          <Result status="info" title={t('dashboard.noCurrentAssignment')} />
        ) : (
          <Flex vertical gap={8}>
            <Typography.Text strong>
              {data.workplace?.code ? `${data.workplace.code} — ` : ''}
              {data.workplace?.name}
            </Typography.Text>
            {data.workplace?.location ? (
              <Typography.Text type="secondary">
                {data.workplace.location}
              </Typography.Text>
            ) : null}
            <Typography.Text>
              {t('dashboard.assignmentPeriod', {
                start: dayjs(data.assignment.startsAt).format(
                  'DD.MM.YYYY HH:mm',
                ),
                end: data.assignment.endsAt
                  ? dayjs(data.assignment.endsAt).format('DD.MM.YYYY HH:mm')
                  : t('dashboard.openEnded'),
              })}
            </Typography.Text>
          </Flex>
        )}
      </Card>
    </Flex>
  );
};

export default Dashboard;
