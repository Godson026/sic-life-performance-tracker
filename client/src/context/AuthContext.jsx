import { createContext, useReducer, useEffect, useContext } from 'react';

// Initial state
const initialState = {
  user: null,
  token: null,
  isLoading: true
};

// Create context
export const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        user: action.payload,
        token: action.payload.token,
        isLoading: false
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isLoading: false
      };
    case 'AUTH_IS_READY':
      return {
        user: action.payload,
        token: action.payload ? action.payload.token : null,
        isLoading: false
      };
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(data));
      } else {
        sessionStorage.setItem('user', JSON.stringify(data));
      }
      
      dispatch({ type: 'LOGIN', payload: data });
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  // Check localStorage and sessionStorage on app load
  useEffect(() => {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        dispatch({ type: 'AUTH_IS_READY', payload: parsedUser });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        dispatch({ type: 'AUTH_IS_READY', payload: null });
      }
    } else {
      dispatch({ type: 'AUTH_IS_READY', payload: null });
    }
  }, []);

  const value = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    login,
    logout,
    dispatch,
    isAuthenticated: !!state.user && !!state.token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
