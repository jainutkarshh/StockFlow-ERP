import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  TabPanel,
  TabPanels,
  Tabs,
  TabList,
  Tab,
  Divider,
  HStack,
  Image,
} from '@chakra-ui/react';
import { api } from '../api/axiosClient';
import GoogleLogo from '../assets/google.svg';

export default function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(loginData);
      const { token, user } = response.data;

      // Store token securely via Electron API
      if (window.electronAPI?.setToken) {
        await window.electronAPI.setToken(token);
      }

      setLoginData({ email: '', password: '' });
      onLoginSuccess(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (registerData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await api.register(registerData);
      const { token, user } = response.data;

      // Store token securely via Electron API
      if (window.electronAPI?.setToken) {
        await window.electronAPI.setToken(token);
      }

      setRegisterData({ email: '', password: '', name: '' });
      onLoginSuccess(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg="#F7F9FC"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Container maxW="md">
        <Box
          bg="white"
          p={8}
          borderRadius="16px"
          boxShadow="0 2px 8px rgba(0,0,0,0.08)"
        >
          <VStack spacing={6} align="center">
            <Heading as="h1" size="lg" color="#1a202c" fontWeight="600">
              Utkarsh Trading 
            </Heading>
            <Text color="#718096" textAlign="center" fontSize="14px">
              Distribution • Inventory — Simplified
            </Text>

            {error && (
              <Alert status="error" borderRadius="8px" bg="#FEE" borderColor="#F56565">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <Box width="100%">
              <Tabs isFitted variant="soft-rounded" colorScheme="blue">
                <TabList mb="1em" bg="#F7F9FC" p="4px" borderRadius="8px">
                  <Tab
                    _selected={{ bg: 'white', color: '#0F4C81', fontWeight: '500' }}
                    color="#718096"
                    fontSize="14px"
                  >
                    Login
                  </Tab>
                  <Tab
                    _selected={{ bg: 'white', color: '#0F4C81', fontWeight: '500' }}
                    color="#718096"
                    fontSize="14px"
                  >
                    Sign Up
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Login Tab */}
                  <TabPanel>
                    <form onSubmit={handleLogin}>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel color="#2d3748" fontWeight="500" fontSize="14px">
                            Email
                          </FormLabel>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={loginData.email}
                            onChange={(e) =>
                              setLoginData({ ...loginData, email: e.target.value })
                            }
                            borderColor="#cbd5e0"
                            focusBorderColor="#0F4C81"
                            required
                            fontSize="14px"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel color="#2d3748" fontWeight="500" fontSize="14px">
                            Password
                          </FormLabel>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) =>
                              setLoginData({ ...loginData, password: e.target.value })
                            }
                            borderColor="#cbd5e0"
                            focusBorderColor="#0F4C81"
                            required
                            fontSize="14px"
                          />
                        </FormControl>

                        <Button
                          type="submit"
                          width="100%"
                          bg="#0F4C81"
                          color="white"
                          _hover={{ bg: '#0C3E6B' }}
                          _active={{ bg: '#0A2F52' }}
                          isLoading={loading}
                          fontWeight="500"
                          fontSize="14px"
                          borderRadius="8px"
                          h="40px"
                        >
                          Login
                        </Button>

                        <Box width="100%" display="flex" alignItems="center" gap={3}>
                          <Divider borderColor="#e2e8f0" />
                          <Text fontSize="12px" color="#a0aec0" whiteSpace="nowrap">
                            OR
                          </Text>
                          <Divider borderColor="#e2e8f0" />
                        </Box>

                        <Button
                          width="100%"
                          height="44px"
                          bg="white"
                          color="gray.700"
                          border="1px solid"
                          borderColor="#dadce0"
                          borderRadius="6px"
                          fontWeight="500"
                          _hover={{ bg: '#f7f8f8' }}
                          _active={{ bg: '#eee' }}
                          onClick={() => {
                            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://stockflow-erp.onrender.com';
                            window.location.href = `${backendUrl}/api/auth/google`;
                          }}
                        >
                          <HStack spacing={3}>
                            <Image src="https://developers.google.com/identity/images/g-logo.png" alt="Google" boxSize="18px" />
                            <Text>Continue with Google</Text>
                          </HStack>
                        </Button>
                      </VStack>
                    </form>
                  </TabPanel>

                  {/* Register Tab */}
                  <TabPanel>
                    <form onSubmit={handleRegister}>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel color="#2d3748" fontWeight="500" fontSize="14px">
                            Full Name
                          </FormLabel>
                          <Input
                            type="text"
                            placeholder="John Doe"
                            value={registerData.name}
                            onChange={(e) =>
                              setRegisterData({ ...registerData, name: e.target.value })
                            }
                            borderColor="#cbd5e0"
                            focusBorderColor="#0F4C81"
                            required
                            fontSize="14px"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel color="#2d3748" fontWeight="500" fontSize="14px">
                            Email
                          </FormLabel>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={registerData.email}
                            onChange={(e) =>
                              setRegisterData({ ...registerData, email: e.target.value })
                            }
                            borderColor="#cbd5e0"
                            focusBorderColor="#0F4C81"
                            required
                            fontSize="14px"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel color="#2d3748" fontWeight="500" fontSize="14px">
                            Password
                          </FormLabel>
                          <Input
                            type="password"
                            placeholder="Min 6 characters"
                            value={registerData.password}
                            onChange={(e) =>
                              setRegisterData({ ...registerData, password: e.target.value })
                            }
                            borderColor="#cbd5e0"
                            focusBorderColor="#0F4C81"
                            required
                            fontSize="14px"
                          />
                        </FormControl>

                        <Button
                          type="submit"
                          width="100%"
                          bg="#0F4C81"
                          color="white"
                          _hover={{ bg: '#0C3E6B' }}
                          _active={{ bg: '#0A2F52' }}
                          isLoading={loading}
                          fontWeight="500"
                          fontSize="14px"
                          borderRadius="8px"
                          h="40px"
                        >
                          Create Account
                        </Button>

                        <Box width="100%" display="flex" alignItems="center" gap={3}>
                          <Divider borderColor="#e2e8f0" />
                          <Text fontSize="12px" color="#a0aec0" whiteSpace="nowrap">
                            OR
                          </Text>
                          <Divider borderColor="#e2e8f0" />
                        </Box>

                        <Button
                          width="100%"
                          height="44px"
                          bg="white"
                          color="gray.700"
                          border="1px solid"
                          borderColor="#dadce0"
                          borderRadius="6px"
                          fontWeight="500"
                          _hover={{ bg: '#f7f8f8' }}
                          _active={{ bg: '#eee' }}
                          onClick={() => {
                            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://stockflow-erp.onrender.com';
                            window.location.href = `${backendUrl}/api/auth/google`;
                          }}
                        >
                          <HStack spacing={3}>
                            <Image src={GoogleLogo} alt="Google" boxSize="18px" />
                            <Text>Continue with Google</Text>
                          </HStack>
                        </Button>
                      </VStack>
                    </form>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>

            <Divider borderColor="#e2e8f0" />

            <Text fontSize="12px" color="#a0aec0" textAlign="center">
              Your data is secure. Passwords are encrypted and never stored in plaintext.
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
