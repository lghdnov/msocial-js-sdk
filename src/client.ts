import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuth } from './auth/auth';
import { getComments } from './comments/comments';
import { getEcho } from './echo/echo';
import { getPosts } from './posts/posts';
import { getUsers } from './users/users';
import type { AuthResponse } from './msocial.schemas';

interface PendingRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export interface MsocialClient {
  auth: ReturnType<typeof getAuth>;
  comments: ReturnType<typeof getComments>;
  echo: ReturnType<typeof getEcho>;
  posts: ReturnType<typeof getPosts>;
  users: ReturnType<typeof getUsers>;
  setAuth(response: AuthResponse): void;
  clearAuth(): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
}

/**
 * Создаёт msocial-клиент с единым axios-инстансом.
 *
 * - Автоматически подставляет `Authorization: Bearer <token>` во все запросы.
 * - При 401 автоматически обновляет access-токен через refresh и повторяет запрос.
 * - Очередит параллельные запросы на время обновления токена.
 */
export function createMsocialClient(baseURL: string): MsocialClient {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let isRefreshing = false;
  const refreshQueue: PendingRequest[] = [];

  const axiosInstance: AxiosInstance = axios.create({
    baseURL,
  });

  /* ─── Request interceptor ─── */
  axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const isRefreshRequest =
      config.url === '/api/v1/auth/refresh' && config.method === 'post';

    if (accessToken && !isRefreshRequest) {
      config.headers.set?.('Authorization', `Bearer ${accessToken}`);
      // Fallback для старых версий axios
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  });

  /* ─── Response interceptor ─── */
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as InternalAxiosRequestConfig | undefined;

      if (error.response?.status !== 401 || !originalConfig) {
        return Promise.reject(error);
      }

      const isRefreshRequest =
        originalConfig.url === '/api/v1/auth/refresh' && originalConfig.method === 'post';

      if (isRefreshRequest) {
        clearAuth();
        return Promise.reject(error);
      }

      if (!refreshToken) {
        clearAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token: string) => {
              originalConfig.headers.set?.('Authorization', `Bearer ${token}`);
              originalConfig.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalConfig));
            },
            reject: (err: unknown) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const { data } = await axiosInstance.post<AuthResponse>('/api/v1/auth/refresh', {
          refreshToken,
        });

        setAuth(data);
        isRefreshing = false;

        // Повторяем оригинальный запрос
        originalConfig.headers.set?.('Authorization', `Bearer ${data.accessToken!}`);
        originalConfig.headers.Authorization = `Bearer ${data.accessToken!}`;

        // Разрешаем очередь
        refreshQueue.forEach((pending) => pending.resolve(data.accessToken!));
        refreshQueue.length = 0;

        return axiosInstance(originalConfig);
      } catch (refreshError) {
        isRefreshing = false;
        clearAuth();
        refreshQueue.forEach((pending) => pending.reject(refreshError));
        refreshQueue.length = 0;
        return Promise.reject(refreshError);
      }
    }
  );

  function setAuth(response: AuthResponse): void {
    accessToken = response.accessToken ?? null;
    refreshToken = response.refreshToken ?? null;
  }

  function clearAuth(): void {
    accessToken = null;
    refreshToken = null;
  }

  function getAccessToken(): string | null {
    return accessToken;
  }

  function getRefreshToken(): string | null {
    return refreshToken;
  }

  return {
    auth: getAuth(axiosInstance),
    comments: getComments(axiosInstance),
    echo: getEcho(axiosInstance),
    posts: getPosts(axiosInstance),
    users: getUsers(axiosInstance),
    setAuth,
    clearAuth,
    getAccessToken,
    getRefreshToken,
  };
}
