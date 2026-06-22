'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // 1. Session Query
  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.auth.me().catch(() => ({ user: null })),
    retry: false,
  });

  const user = data?.user || null;

  // 2. Login Mutation
  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (res) => {
      queryClient.setQueryData(['auth-me'], { user: res.user });
      window.location.href = '/dashboard';
    },
  });

  // 3. Register Mutation
  const registerMutation = useMutation({
    mutationFn: api.auth.register,
  });

  // 4. Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: api.auth.verifyOtp,
    onSuccess: (res) => {
      queryClient.setQueryData(['auth-me'], { user: res.user });
      window.location.href = '/dashboard';
    },
  });

  // 5. Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth-me'], { user: null });
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    registerLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    verifyOtp: verifyOtpMutation.mutateAsync,
    verifyOtpLoading: verifyOtpMutation.isPending,
    verifyOtpError: verifyOtpMutation.error,
    logout: logoutMutation.mutateAsync,
    logoutLoading: logoutMutation.isPending,
    refetch,
  };
}
