import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateBranchZone: (branch: string, zone: string) => Promise<void>;
  demoRole: UserRole | null;
  setDemoRole: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'aryasingh2366@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }

          const isBootstrappedAdmin = currentUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

          if (userSnap && userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            if (isBootstrappedAdmin && data.role !== 'admin') {
              // Ensure bootstrapped admin role is synced
              await setDoc(userDocRef, { ...data, role: 'admin' }, { merge: true });
              setProfile({ ...data, role: 'admin' });
            } else {
              setProfile(data);
            }
          } else {
            // New user registration
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Railway Aspirant',
              photoURL: currentUser.photoURL || undefined,
              role: isBootstrappedAdmin ? 'admin' : 'student',
              targetBranch: 'Mechanical Engineering',
              targetZone: 'RRB Prayagraj (Allahabad)',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            }

            // Also if bootstrapped admin, record in admins collection
            if (isBootstrappedAdmin) {
              try {
                await setDoc(doc(db, 'admins', currentUser.uid), {
                  email: currentUser.email,
                  role: 'Super Admin',
                  createdAt: new Date().toISOString(),
                });
              } catch {
                // non-fatal if exists
              }
            }

            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching or creating user profile:', error);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setDemoRole(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  const updateBranchZone = async (branch: string, zone: string) => {
    if (!user || !profile) return;
    try {
      const updated = {
        ...profile,
        targetBranch: branch,
        targetZone: zone,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
      setProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Check admin rights
  const actualIsAdmin =
    user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
    profile?.role === 'admin';

  const effectiveIsAdmin = demoRole !== null ? demoRole === 'admin' : actualIsAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: effectiveIsAdmin,
        isLoading,
        signInWithGoogle,
        logout,
        updateBranchZone,
        demoRole,
        setDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
