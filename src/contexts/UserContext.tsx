import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  department?: string;
  name?: string;
}

interface UserContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Create a default user profile if not found
        setUser({
          id: userId,
          email: session?.user?.email || '',
          role: 'user',
        });
      } else {
        setUser({
          id: data.id,
          email: data.email,
          role: data.role || 'user',
          department: data.department_code,
          name: data.name,
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser({
        id: userId,
        email: session?.user?.email || '',
        role: 'user',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, session, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};