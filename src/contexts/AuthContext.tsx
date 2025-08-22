import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convex mutations
  const convexLogin = useConvexMutation(api.auth.login);
  const convexLogout = useConvexMutation(api.auth.logout);

  // Get current user from Convex if we have a stored user ID
  const storedUserId = localStorage.getItem('pet_shipper_user_id');
  const currentUser = useConvexQuery(
    api.auth.getCurrentUser,
    storedUserId ? { userId: storedUserId } : "skip"
  );

  useEffect(() => {
    if (currentUser) {
      setUser({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      });
      setIsLoading(false);
    } else if (currentUser === null) {
      // User not found, clear stored ID
      localStorage.removeItem('pet_shipper_user_id');
      setUser(null);
      setIsLoading(false);
    } else if (!storedUserId) {
      // No stored user ID
      setIsLoading(false);
    }
  }, [currentUser, storedUserId]);

  const login = async (email: string, password: string) => {
    try {
      const userData = await convexLogin({ email, password });
      localStorage.setItem('pet_shipper_user_id', userData.id);
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await convexLogout({});
      localStorage.removeItem('pet_shipper_user_id');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if Convex call fails
      localStorage.removeItem('pet_shipper_user_id');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
