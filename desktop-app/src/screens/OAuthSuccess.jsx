import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Center, Spinner, Alert, AlertIcon, VStack, Heading, Text } from '@chakra-ui/react';

export default function OAuthSuccess({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No authentication token received. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {
      // ✅ Store token using SAME key as rest of app
      localStorage.setItem('auth_token', token);

      // Also store via Electron API if available
      if (window.electronAPI?.setToken) {
        window.electronAPI.setToken(token);
      }

      // Decode token to get user info (JWT has 3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      const user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        provider: payload.provider,
      };

      // Notify parent component
      if (onLoginSuccess) {
        onLoginSuccess(user, token);
      }

      // ✅ Navigate to dashboard with small delay to ensure state updates
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (err) {
      console.error('OAuth error:', err);
      setError('Failed to process authentication. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, onLoginSuccess]);

  return (
    <Box minH="100vh" bg="#F7F9FC" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Center>
        <VStack spacing={6} align="center">
          {error ? (
            <>
              <Heading as="h2" size="md" color="#c53030">
                Authentication Error
              </Heading>
              <Alert status="error" borderRadius="8px" maxW="md">
                <AlertIcon />
                {error}
              </Alert>
              <Text fontSize="14px" color="#718096">
                Redirecting to login...
              </Text>
            </>
          ) : (
            <>
              <Heading as="h2" size="md" color="#0F4C81">
                Welcome! 🎉
              </Heading>
              <Text fontSize="14px" color="#718096">
                Setting up your session...
              </Text>
              <Spinner size="lg" color="#0F4C81" mt={4} />
            </>
          )}
        </VStack>
      </Center>
    </Box>
  );
}
