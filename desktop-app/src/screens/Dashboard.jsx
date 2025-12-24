import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Spinner, Alert, AlertIcon, Card, CardBody } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../api/axiosClient';

const Dashboard = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getTopProducts();
      setTopProducts(response.data || []);
    } catch (err) {
      console.error('Error fetching top products:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} minH="100vh" bg="white">
      <Heading mb={6} size="lg">Dashboard</Heading>

      <Box p={6} bg="blue.50" borderRadius="lg" borderLeft="4px" borderColor="blue.500" shadow="sm" mb={8}>
        <Text fontSize="16px" color="#333" fontWeight="bold">
          Welcome to Utkarsh Trading! 👋
        </Text>
      </Box>

      <Card shadow="md">
        <CardBody>
          <Heading size="md" mb={4}>Top Selling Products</Heading>
          
          {loading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="lg" />
            </Box>
          ) : error ? (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          ) : topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="product" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => `${value} units`} />
                <Legend />
                <Bar dataKey="quantity" fill="#3182ce" name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Alert status="info">
              <AlertIcon />
              No sales data available
            </Alert>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;
