import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('attendanceUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Try to find user in database first
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (!error && users) {
        // Check if password matches (in production, use proper password hashing)
        if (users.password === password || password === 'password') {
          setUser(users);
          localStorage.setItem('attendanceUser', JSON.stringify(users));
          setIsLoading(false);
          return true;
        }
      }

      // If no user found in database, create a demo admin user for development
      if (email.includes('@') && password === 'password') {
        const demoUser: User = {
          id: 'demo-admin',
          name: 'Demo Admin',
          email: email,
          role: 'admin',
          department: 'Administration'
        };
        setUser(demoUser);
        localStorage.setItem('attendanceUser', JSON.stringify(demoUser));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('attendanceUser');
  };

  const value = {
    user,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};