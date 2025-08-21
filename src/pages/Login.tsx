import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { http } from '../lib/http';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'client'>('client');
  const navigate = useNavigate();
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; role: 'admin' | 'client' }) => 
      http.post('/session', data),
    onSuccess: (response) => {
      login(response.data.user);
      navigate(response.data.user.role === 'client' ? '/portal/dashboard' : '/app/inbox');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      loginMutation.mutate({ email: email.trim(), role: selectedRole });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8EB9D4] to-[#F3C0CF] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#F3C0CF] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0E2A47] font-bold text-2xl">PS</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0E2A47] mb-2">
            Pet Shippers Guam
          </h1>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Login as
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedRole === 'client'
                    ? 'bg-[#F3C0CF] border-[#F3C0CF] text-[#0E2A47]'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedRole === 'admin'
                    ? 'bg-[#F3C0CF] border-[#F3C0CF] text-[#0E2A47]'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Staff/Admin
              </button>
            </div>
          </div>

          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Demo: Choose your role and use any email to sign in
          </p>
        </div>
      </div>
    </div>
  );
};