import axios from 'axios';

export type JwtPayload = {
  sub: string;
  email: string;
  orgId: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
};

export type Org = {
  id: string;
  name: string;
  slug: string;
};

export type Workplace = {
  id: string;
  orgId: string;
  code: string;
  name: string;
  location?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  org?: Org;
};

export type AssignmentStatus = 'ACTIVE' | 'ARCHIVED';

export type Assignment = {
  id: string;
  userId: string;
  workplaceId: string;
  startsAt: string;
  endsAt: string | null;
  status: AssignmentStatus;
  user?: {
    id: string;
    email: string;
    fullName?: string | null;
  };
  workplace?: Pick<Workplace, 'id' | 'code' | 'name' | 'location'>;
};

export type NotificationType = 'ASSIGNMENT_CREATED' | 'ASSIGNMENT_UPDATED';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
};

export type User = {
  id: string;
  email: string;
  fullName?: string | null;
  position?: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  orgId: string | null;
};

export type MeProfile = {
  id: string;
  email: string;
  fullName: string | null;
  position: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  org: Org | null;
};

export type CurrentWorkplaceResponse = {
  workplace: Pick<Workplace, 'id' | 'code' | 'name' | 'location'> | null;
  assignment: Assignment | null;
  history: Assignment[];
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const token = window.localStorage.getItem('armico_token');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('armico_token');
      window.dispatchEvent(new Event('armico:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data.accessToken;
};

export const fetchMeProfile = async () => {
  const { data } = await api.get<MeProfile>('/me');
  return data;
};

export const fetchCurrentWorkplace = async () => {
  const { data } = await api.get<CurrentWorkplaceResponse>(
    '/me/current-workplace',
  );
  return data;
};

export const fetchNotifications = async (limit = 10) => {
  const { data } = await api.get<Notification[]>(`/notifications/me`, {
    params: { limit },
  });
  return data;
};

export const fetchWorkplaces = async (params: {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  const { data } = await api.get<PaginatedResponse<Workplace>>('/workplaces', {
    params,
  });
  return data;
};

export const createWorkplace = async (payload: {
  orgId: string;
  code: string;
  name: string;
  location?: string;
  isActive?: boolean;
}) => {
  const { data } = await api.post<Workplace>('/workplaces', payload);
  return data;
};

export const updateWorkplace = async (
  id: string,
  payload: Partial<{
    orgId: string;
    code: string;
    name: string;
    location?: string;
    isActive?: boolean;
  }>,
) => {
  const { data } = await api.patch<Workplace>(`/workplaces/${id}`, payload);
  return data;
};

export const fetchAssignments = async (params: {
  userId?: string;
  workplaceId?: string;
  status?: AssignmentStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { data } = await api.get<PaginatedResponse<Assignment>>(
    '/assignments',
    {
      params,
    },
  );
  return data;
};

export const createAssignment = async (payload: {
  userId: string;
  workplaceId: string;
  startsAt: string;
  endsAt?: string | null;
  status?: AssignmentStatus;
}) => {
  const { data } = await api.post<Assignment>('/assignments', payload);
  return data;
};

export const updateAssignment = async (
  id: string,
  payload: Partial<{
    userId: string;
    workplaceId: string;
    startsAt: string;
    endsAt: string | null;
    status: AssignmentStatus;
  }>,
) => {
  const { data } = await api.patch<Assignment>(`/assignments/${id}`, payload);
  return data;
};

export const fetchUsers = async () => {
  const { data } = await api.get<User[]>('/users');
  return data;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(atob(payload));
    return decoded as JwtPayload;
  } catch (error) {
    console.warn('Failed to decode token', error);
    return null;
  }
};

export default api;
