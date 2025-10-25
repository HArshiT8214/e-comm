// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { authAPI, setToken, removeToken, getToken } from '../services/api';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Check if user is logged in on app start
//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = getToken();
//       if (token) {
//         try {
//           const response = await authAPI.getProfile();
//           if (response.success) {
//             setUser(response.data);
//           } else {
//             removeToken();
//           }
//         } catch (error) {
//           console.error('Auth check failed:', error);
//           removeToken();
//         }
//       }
//       setLoading(false);
//     };

//     checkAuth();
//   }, []);

//   const login = async (credentials) => {
//     try {
//       const response = await authAPI.login(credentials);
//       if (response.success) {
//         setToken(response.data.token);
//         setUser(response.data);
//         return { success: true };
//       }
//       return { success: false, message: response.message };
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const register = async (userData) => {
//     try {
//       const response = await authAPI.register(userData);
//       if (response.success) {
//         setToken(response.data.token);
//         setUser(response.data);
//         return { success: true };
//       }
//       return { success: false, message: response.message };
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const logout = () => {
//     removeToken();
//     setUser(null);
//   };

//   const updateProfile = async (userData) => {
//     try {
//       const response = await authAPI.updateProfile(userData);
//       if (response.success) {
//         // Refresh user data
//         const profileResponse = await authAPI.getProfile();
//         if (profileResponse.success) {
//           setUser(profileResponse.data);
//         }
//         return { success: true };
//       }
//       return { success: false, message: response.message };
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const changePassword = async (passwordData) => {
//     try {
//       const response = await authAPI.changePassword(passwordData);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const forgotPassword = async (email) => {
//     try {
//       const response = await authAPI.forgotPassword(email);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const addAddress = async (addressData) => {
//     try {
//       const response = await authAPI.addAddress(addressData);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const updateAddress = async (addressId, addressData) => {
//     try {
//       const response = await authAPI.updateAddress(addressId, addressData);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const deleteAddress = async (addressId) => {
//     try {
//       const response = await authAPI.deleteAddress(addressId);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const value = {
//     user,
//     loading,
//     login,
//     register,
//     logout,
//     updateProfile,
//     changePassword,
//     forgotPassword,
//     addAddress,
//     updateAddress,
//     deleteAddress,
//     isAuthenticated: !!user
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }


//=========================

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { authAPI, setToken, removeToken, getToken } from '../services/api';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Check if user is logged in on app start
//   useEffect(() => {
//     const checkAuth = async () => {
//       const token = getToken();
//       if (token) {
//         try {
//           const response = await authAPI.getProfile();
//           if (response.success) {
//             setUser(response.data);
//           } else {
//             removeToken();
//           }
//         } catch (error) {
//           console.error('Auth check failed:', error);
//           removeToken();
//         }
//       }
//       setLoading(false);
//     };

//     checkAuth();
//   }, []);

//   const login = async (credentials) => {
//     try {
//       const response = await authAPI.login(credentials);
//       if (response.success) {
//         setToken(response.data.token);
//         setUser(response.data);
//         return { success: true };
//       }
//       return { success: false, message: response.message };
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const register = async (userData) => {
//     try {
//       const response = await authAPI.register(userData);
//       if (response.success) {
//         setToken(response.data.token);
//         setUser(response.data);
//         return { success: true };
//       }
//       return { success: false, message: response.message };
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const logout = () => {
//     removeToken();
//     setUser(null);
//   };

//   const updateProfile = async (userData) => {
//     try {
//       const response = await authAPI.updateProfile(userData);
//       if (response.success) {
//         // Refresh user data
//         const profileResponse = await authAPI.getProfile();
//         if (profileResponse.success) {
//           setUser(profileResponse.data);
//         }
//         return { success: true };
//       }
//       return { success: false, message: response.message };
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const changePassword = async (passwordData) => {
//     try {
//       const response = await authAPI.changePassword(passwordData);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const forgotPassword = async (email) => {
//     try {
//       const response = await authAPI.forgotPassword(email);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const addAddress = async (addressData) => {
//     try {
//       const response = await authAPI.addAddress(addressData);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const updateAddress = async (addressId, addressData) => {
//     try {
//       const response = await authAPI.updateAddress(addressId, addressData);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const deleteAddress = async (addressId) => {
//     try {
//       const response = await authAPI.deleteAddress(addressId);
//       return response;
//     } catch (error) {
//       return { success: false, message: error.message };
//     }
//   };

//   const value = {
//     user,
//     loading,
//     login,
//     register,
//     logout,
//     updateProfile,
//     changePassword,
//     forgotPassword,
//     addAddress,
//     updateAddress,
//     deleteAddress,
//     isAuthenticated: !!user
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

// // ✅ Added export to fix the “not found” error
// export { AuthContext };




// ========================================
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, setToken, removeToken, getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check login status on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      console.log("🔍 Checking authentication...");
      console.log("Stored token:", token);

      if (token) {
        try {
          const response = await authAPI.getProfile();
          console.log("Profile API response:", response);

          if (response?.success && response?.data) {
            setUser(response.data);
            console.log("✅ User set:", response.data);
          } else {
            console.warn("❌ Invalid token or profile fetch failed:", response?.message);
            removeToken();
            setUser(null);
          }
        } catch (error) {
          console.error("🚨 Auth check failed:", error);
          removeToken();
          setUser(null);
        }
      } else {
        console.warn("⚠️ No token found — user not logged in");
        setUser(null);
      }

      setLoading(false); // ✅ always stop loading
    };

    checkAuth();
  }, []);

  // ✅ Login function
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        setToken(response.data.token);
        // Extract user data without token
        const { token, ...userData } = response.data;
        setUser(userData);
        console.log("✅ Logged in successfully:", userData);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message };
    }
  };

  // ✅ Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setToken(response.data.token);
        setUser(response.data);
        console.log("✅ Registered and logged in:", response.data);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, message: error.message };
    }
  };

  // ✅ Logout
  const logout = () => {
    removeToken();
    setUser(null);
    console.log("👋 User logged out");
  };

  // ✅ Update profile
  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      if (response.success) {
        const refreshed = await authAPI.getProfile();
        if (refreshed.success) {
          setUser(refreshed.data);
        }
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, message: error.message };
    }
  };

  // ✅ Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return response;
    } catch (error) {
      console.error("Password change error:", error);
      return { success: false, message: error.message };
    }
  };

  // ✅ Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response;
    } catch (error) {
      console.error("Forgot password error:", error);
      return { success: false, message: error.message };
    }
  };

  // ✅ Address management
  const addAddress = async (addressData) => {
    try {
      const response = await authAPI.addAddress(addressData);
      return response;
    } catch (error) {
      console.error("Add address error:", error);
      return { success: false, message: error.message };
    }
  };

  const updateAddress = async (addressId, addressData) => {
    try {
      const response = await authAPI.updateAddress(addressId, addressData);
      return response;
    } catch (error) {
      console.error("Update address error:", error);
      return { success: false, message: error.message };
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const response = await authAPI.deleteAddress(addressId);
      return response;
    } catch (error) {
      console.error("Delete address error:", error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    addAddress,
    updateAddress,
    deleteAddress,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: "500",
          }}
        >
          Checking authentication...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// ✅ Hook for easier access
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ✅ Also export context for backward compatibility
export { AuthContext };
