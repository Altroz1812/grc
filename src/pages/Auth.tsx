import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, User, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Clean up any existing auth state
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if user profile exists and is active
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile && profile.status === 'active') {
            // Check if password change is required
            const userMetadata = session.user.user_metadata;
            if (userMetadata?.temp_password || userMetadata?.requires_password_change || userMetadata?.password_set_by_admin) {
              setIsFirstLogin(true);
              setShowPasswordReset(true);
              toast({
                title: "Password Change Required",
                description: "Please set a new password for your account",
              });
            } else {
              window.location.href = '/';
            }
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };

    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // Check user profile and status
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            if (profile.status === 'active') {
              // Check if this is first login or admin-set password
              const userMetadata = session.user.user_metadata;
              if (userMetadata?.temp_password || userMetadata?.requires_password_change || userMetadata?.password_set_by_admin) {
                setIsFirstLogin(true);
                setShowPasswordReset(true);
                toast({
                  title: "Password Change Required",
                  description: userMetadata?.password_set_by_admin 
                    ? "Your admin has reset your password. Please set a new password." 
                    : "Please set a new password for your account",
                });
              } else {
                window.location.href = '/';
              }
            } else {
              setError('Your account is not active. Please contact an administrator.');
              await supabase.auth.signOut();
            }
          } else {
            setError('Profile not found. Please contact an administrator.');
            await supabase.auth.signOut();
          }
        } catch (err) {
          console.error('Profile check error:', err);
          setError('Error checking account status. Please try again.');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password');
          } else {
            setError(error.message);
          }
        } else if (data.user) {
          toast({
            title: "Success",
            description: "Logged in successfully",
          });
        }
      } else {
        // Disable email confirmation for immediate login
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            }
          }
        });
        
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Account Created",
            description: "Your account has been created successfully. You can now log in immediately.",
          });
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          temp_password: false,
          requires_password_change: false,
          password_set_by_admin: false
        }
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully",
        });
        setShowPasswordReset(false);
        setIsFirstLogin(false);
        window.location.href = '/';
      }
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <p className="text-slate-600">
              {isFirstLogin ? 'Your admin has provided a temporary password. Please set a new secure password.' : 'Update your password'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <p className="text-sm text-blue-700">
                <strong>Security Notice:</strong> For your security, you must change the temporary password provided by your administrator.
              </p>
            </div>
            
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            {isLogin ? 'Login' : 'Create Account'}
          </CardTitle>
          <p className="text-slate-600">
            {isLogin ? 'Access RBI Compliance System' : 'Join RBI Compliance System'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="mt-1"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter any email address (Gmail, Yahoo, etc.)"
              />
              <p className="text-xs text-slate-500 mt-1">
                You can use any email address including Gmail, Yahoo, or company email
              </p>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder={isLogin ? "Enter your password or temporary password from admin" : "Enter your password"}
              />
              {isLogin && (
                <p className="text-xs text-slate-500 mt-1">
                  If you received a temporary password from admin, you'll be asked to change it after login
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> No email verification required - you can login immediately after account creation. An admin will assign you appropriate roles and permissions to access compliance features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
