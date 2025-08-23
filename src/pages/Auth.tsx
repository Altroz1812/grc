import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { Shield, User, Lock, Mail } from "lucide-react";
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
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile && profile.status === 'active') {
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
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            if (profile.status === 'active') {
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

  const handleAuth = async (e) => {
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
            className: "bg-green-500/90 text-white",
          });
        }
      } else {
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
            className: "bg-green-500/90 text-white",
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

  const handlePasswordReset = async (e) => {
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
          className: "bg-green-500/90 text-white",
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

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20"
        >
          {showPasswordReset ? (
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Set New Password</h2>
              <p className="text-gray-300 text-center mb-6">
                {isFirstLogin ? 'Please set a new secure password.' : 'Update your password'}
              </p>
              
              <div className="bg-blue-500/10 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-300">
                  <strong>Security Notice:</strong> For your security, please create a strong password with at least 6 characters.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-6">
                <motion.div variants={inputVariants} whileFocus="focus">
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter new password"
                    />
                  </div>
                </motion.div>

                <motion.div variants={inputVariants} whileFocus="focus">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm new password"
                    />
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg"
                  >
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </motion.button>
              </form>
            </div>
          ) : (
            <div className="p-8">
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                {isLogin ? 'Adcompel' : 'Create Account'}
              </h2>
              <p className="text-gray-300 text-center mb-6">
                {isLogin ? 'Access RBI Compliance System' : 'Join RBI Compliance System'}
              </p>

              <form onSubmit={handleAuth} className="space-y-6">
                {!isLogin && (
                  <motion.div variants={inputVariants} whileFocus="focus">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={!isLogin}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </motion.div>
                )}

                <motion.div variants={inputVariants} whileFocus="focus">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>
                  {/* <p className="text-xs text-gray-400 mt-2">Use any email address (Gmail, Yahoo, or company email)</p> */}
                </motion.div>

                <motion.div variants={inputVariants} whileFocus="focus">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={isLogin ? "Enter your password" : "Create a password"}
                    />
                  </div>
                  {/* {isLogin && (
                    
                  )} */}
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg"
                  >
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
                </motion.button>
              </form>

              <motion.div
                whileHover={{ x: 5 }}
                className="mt-6 text-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                >
                  {/* {isLogin ? "Need an account? Sign up" : "Already have an account? Login"} */}
                </button>
              </motion.div>

              {!isLogin && (
                <div className="mt-6 bg-blue-500/10 p-4 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> No email verification required - you can login immediately after account creation. An admin will assign your roles and permissions.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Auth;