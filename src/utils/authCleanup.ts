
export const cleanupAuthState = () => {
  try {
    console.log('Cleaning up auth state...');
    
    // Fast cleanup - only remove the most critical keys
    const keysToRemove = [
      'supabase.auth.token',
      'sb-zyuknjwhgadpqhjgiwqc-auth-token'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    });
    
    // Quick pattern-based cleanup
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-zyuknjwhgadpqhjgiwqc')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Auth state cleanup complete');
  } catch (error) {
    console.error('Error cleaning up auth state:', error);
  }
};

export const forceSignOut = async (supabase: any) => {
  try {
    console.log('Force signing out...');
    // Quick cleanup first
    cleanupAuthState();
    
    // Fire and forget signout - don't wait
    supabase.auth.signOut({ scope: 'global' }).catch(() => {
      // Ignore errors - we're forcing out anyway
    });
    
    console.log('Force sign out initiated');
  } catch (error) {
    console.error('Error during force sign out:', error);
    // Still clean up even if sign out fails
    cleanupAuthState();
  }
};
