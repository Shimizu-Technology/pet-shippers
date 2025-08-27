import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Navigate after successful login
  useEffect(() => {
    if (user) {
      const destination = user.role === 'client' ? '/portal/dashboard' : '/app/inbox';
      navigate(destination, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      setError('');
      
      try {
        await login(email.trim(), password.trim());
        // The login function will set the user in context
        // We'll let the useEffect handle navigation after user is set
      } catch (error: any) {
        console.error('Login failed:', error);
        setError(error.message || 'Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
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
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <Button
            type="submit"
            className="w-full bg-[#F3C0CF] hover:bg-[#F3C0CF]/90 text-[#0E2A47] font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-3">🚀 Test Users (Pre-Created):</h3>
          <div className="text-xs text-blue-700 space-y-3">
            
            {/* Client Users */}
            <div>
              <p className="font-semibold text-blue-800 mb-1">Clients:</p>
              <p><strong>Client User:</strong> client@example.com</p>
              <p><strong>Sarah Johnson:</strong> sarah@example.com</p>
              <p><strong>Michael Chen:</strong> michael.chen@gmail.com</p>
              <p><strong>Emily Davis:</strong> emily.davis@yahoo.com</p>
            </div>

            {/* Staff/Admin Users */}
            <div>
              <p className="font-semibold text-blue-800 mb-1">Staff/Admin:</p>
              <p><strong>Admin User:</strong> admin@example.com</p>
              <p><strong>Staff User:</strong> staff@example.com</p>
              <p><strong>Ken Staff:</strong> ken@petshippers.com</p>
              <p><strong>Maria Rodriguez:</strong> maria@petshippers.com</p>
              <p><strong>Ada Admin:</strong> ada@petshippers.com</p>
            </div>

            <p className="mt-2 text-blue-600 italic">All users accept any password.</p>
          </div>
        </div>
      </div>
    </div>
  );
};