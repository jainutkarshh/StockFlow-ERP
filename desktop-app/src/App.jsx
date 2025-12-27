import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  Box,
  Flex,
  Alert,
  AlertIcon,
  CloseButton,
  Spinner,
  Center,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Sidebar from './components/Sidebar';
import Dashboard from './screens/Dashboard';
import Products from './screens/Products';
import Parties from './screens/Parties';
import StockIn from './screens/StockIn';
import StockOut from './screens/StockOut';
import Payments from './screens/Payments';
import Ledger from './screens/Ledger';
import Balances from './screens/Balances';
import Login from './screens/Login';
import OAuthSuccess from './screens/OAuthSuccess';
import { api } from './api/axiosClient';

function AppContent({ user, onLogout, onLoginSuccess }) {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [alert, setAlert] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkLowStock();
    const stockInterval = setInterval(checkLowStock, 60000);
    return () => clearInterval(stockInterval);
  }, []);

  const checkBackend = async () => {
    try {
      await api.healthCheck();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
      if (!alert) {
        setAlert({
          type: 'error',
          message: 'Backend server is not running. Please start the backend server.',
        });
      }
    }
  };

  const checkLowStock = async () => {
    try {
      const response = await api.getLowStock();
      if (response.data.length > 0) {
        setLowStockAlerts(response.data);
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  };

  if (backendStatus === 'checking') {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Flex h="100vh" bg="white" flexDirection="column">
      {/* Header with user menu */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={6} py={4}>
        <Flex justify="space-between" align="center">
          <Box></Box>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {user.name}
            </MenuButton>
            <MenuList>
              <MenuItem fontSize="sm" isDisabled>
                {user.email}
              </MenuItem>
              <MenuItem onClick={onLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      <Flex flex={1} overflow="hidden">
        <Sidebar />
        <Box flex="1" ml="250px" p={6} overflow="auto" bg="white">
          {alert && (
            <Alert status={alert.type} mb={4}>
              <AlertIcon />
              {alert.message}
              <CloseButton
                position="absolute"
                right="8px"
                top="8px"
                onClick={() => setAlert(null)}
              />
            </Alert>
          )}
          
          {lowStockAlerts.length > 0 && (
            <Alert status="warning" mb={4}>
              <AlertIcon />
              Low stock alert: {lowStockAlerts.length} products need restocking
              <CloseButton
                position="absolute"
                right="8px"
                top="8px"
                onClick={() => setLowStockAlerts([])}
              />
            </Alert>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/parties" element={<Parties />} />
            <Route path="/stock-in" element={<StockIn />} />
            <Route path="/stock-out" element={<StockOut />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/ledger/:partyId?" element={<Ledger />} />
            <Route path="/balances" element={<Balances />} />
          </Routes>
        </Box>
      </Flex>
    </Flex>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  useEffect(() => {
    // Fallback: if token exists in localStorage but user is not set, load it
    if (!user) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        console.log('Fallback: Found token in localStorage, attempting to load user');
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            setUser({
              id: payload.id,
              email: payload.email,
              name: payload.name,
              provider: payload.provider,
            });
            console.log('User loaded from token in localStorage');
          }
        } catch (err) {
          console.error('Failed to load user from token:', err);
          localStorage.removeItem('auth_token');
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const checkExistingAuth = async () => {
    try {
      let token = null;

      // Check Electron API first
      if (window.electronAPI?.getToken) {
        token = await window.electronAPI.getToken();
      }

      // If no token from Electron, check localStorage (for web/OAuth)
      if (!token) {
        token = localStorage.getItem('auth_token');
      }

      // If token exists, verify it and get user data
      if (token) {
        const response = await api.getCurrentUser();
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Not authenticated');
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setChecking(false);
    }
  };

  const handleLoginSuccess = async (userData, token) => {
    console.log('handleLoginSuccess called with:', { userData, hasToken: !!token });
    
    // Store token in localStorage for axios interceptor
    if (token) {
      localStorage.setItem('auth_token', token);
      console.log('Token saved to localStorage');
    }

    // Decode token to get user info if not provided
    if (!userData && token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          userData = {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            provider: payload.provider,
          };
          console.log('User decoded from token:', userData);
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }

    // Update app state - THIS MUST HAPPEN
    console.log('Setting user state to:', userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    if (window.electronAPI?.clearToken) {
      await window.electronAPI.clearToken();
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  if (checking) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes - NO auth required */}
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/oauth-success" element={<OAuthSuccess onLoginSuccess={handleLoginSuccess} />} />

        {/* Protected routes - auth required */}
        {user ? (
          <Route path="/*" element={<AppContent user={user} onLogout={handleLogout} onLoginSuccess={handleLoginSuccess} />} />
        ) : (
          <Route path="/*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;