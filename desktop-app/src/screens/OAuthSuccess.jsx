import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Center, Spinner, Heading, Text } from '@chakra-ui/react';

export default function OAuthSuccess({ onLoginSuccess }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    console.log('OAuthSuccess: token received =', !!token);

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      // ✅ Save token with SAME key app uses
      localStorage.setItem('auth_token', token);
      console.log('OAuthSuccess: token saved to localStorage');

      // Update app state
      if (onLoginSuccess) {
        onLoginSuccess(null, token);
      }

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
    } catch (err) {
      console.error('OAuthSuccess error:', err);
      navigate('/login', { replace: true });
    }
  }, [navigate, onLoginSuccess]);

  return (
    <Box minH="100vh" bg="#F7F9FC" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Center>
        <Box textAlign="center">
          <Heading as="h2" size="md" color="#0F4C81" mb={4}>
            Welcome! 🎉
          </Heading>
          <Text fontSize="14px" color="#718096" mb={6}>
            Setting up your session...
          </Text>
          <Spinner size="lg" color="#0F4C81" />
        </Box>
      </Center>
    </Box>
  );
}
