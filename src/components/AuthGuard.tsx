
import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  status: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile after successful auth
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching user profile:', error);
              } else if (mounted) {
                console.log('User profile loaded:', profile);
                setUserProfile(profile);
              }
            } catch (err) {
              console.error('Error in profile fetch:', err);
            } finally {
              if (mounted) {
                setLoading(false);
              }
            }
          }, 100);
        } else {
          if (mounted) {
            setUserProfile(null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile for existing session
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching user profile:', error);
            } else if (mounted) {
              console.log('User profile loaded:', profile);
              setUserProfile(profile);
            }
          } catch (err) {
            console.error('Error in profile fetch:', err);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        }, 100);
      } else {
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !session) {
    window.location.href = '/auth';
    return null;
  }

  // Check if user account is active
  if (userProfile && userProfile.status !== 'active') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Account Inactive</div>
          <p className="text-gray-600 mb-4">
            Your account is not active. Please contact an administrator for access.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth';
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Pass user profile context to children
  return (
    <div data-user-role={userProfile?.role || 'user'}>
      {React.cloneElement(children as React.ReactElement, { 
        userProfile,
        currentUser: user 
      })}
    </div>
  );
};

export default AuthGuard;
