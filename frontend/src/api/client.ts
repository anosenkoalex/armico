import axios from 'axios';

type JwtPayload = {
  sub: string;
  email: string;
  orgId: string;
  role: string;
};

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
};

export type Org = {
  id: string;
  name: string;
  timezone: string;
};

export type Workplace = {
  id: string;
  orgId: string;
  name: string;
  address: string;
  capacity: number;
  latitude?: number | null;
  longitude?: number | null;
};

export type AssignmentStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export type Assignment = {
  id: string;
  orgId: string;
  userId: string;
  workplaceId: string;
  startsAt: string;
  endsAt: string;
  status: AssignmentStatus;
  workplace?: Workplace;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
};

export type Notification = {
  id: string;
  userId: string;
  assignmentId?: string | null;
  message: string;
  readAt?: string | null;
  createdAt: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  position: string;
  role: string;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  position: string;
  role: string;
  org: {
    id: string;
    name: string;
  };
  currentAssignment: Assignment | null;
  assignments: Assignment[];
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

export const login = async (payload: LoginRequest) => {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data.accessToken;
};

type RegisterRequest = {
  orgId: string;
  email: string;
  password: string;
  fullName: string;
  position: string;
};

export const register = async (payload: RegisterRequest) => {
  const { data } = await api.post<LoginResponse>('/auth/register', payload);
  return data.accessToken;
};

export const fetchProfile = async () => {
  const { data } = await api.get<UserProfile>('/me');
  return data;
};

export const fetchWorkplaces = async () => {
  const { data } = await api.get<Workplace[]>('/workplaces');
  return data;
};

export const fetchAssignments = async () => {
  const { data } = await api.get<Assignment[]>('/assignments');
  return data;
};

export const fetchUsers = async () => {
  const { data } = await api.get<User[]>('/users');
  return data;
};

export const fetchNotifications = async () => {
  const { data } = await api.get<Notification[]>('/notifications/me');
  return data;
};

type CreateWorkplaceRequest = {
  orgId: string;
  name: string;
  address: string;
  capacity: number;
};

export const createWorkplace = async (payload: CreateWorkplaceRequest) => {
  const { data } = await api.post<Workplace>('/workplaces', payload);
  return data;
};

type CreateAssignmentRequest = {
  orgId: string;
  userId: string;
  workplaceId: string;
  startsAt: string;
  endsAt: string;
  status?: AssignmentStatus;
};

export const createAssignment = async (payload: CreateAssignmentRequest) => {
  const { data } = await api.post<Assignment>('/assignments', payload);
  return data;
};

type UpdateAssignmentRequest = Partial<Omit<CreateAssignmentRequest, 'orgId'>> & {
  status?: AssignmentStatus;
};

export const updateAssignment = async (
  id: string,
  payload: UpdateAssignmentRequest,
) => {
  const { data } = await api.patch<Assignment>(`/assignments/${id}`, payload);
  return data;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(window.atob(payload));
    return decoded as JwtPayload;
  } catch (error) {
    console.warn('Failed to decode token', error);
    return null;
  }
};

export default api;
