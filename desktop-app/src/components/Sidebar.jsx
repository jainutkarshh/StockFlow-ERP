import React from 'react';
import {
  Box,
  VStack,
  Button,
  Icon,
  Text,
  useColorModeValue,
  Divider,
  Badge,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBox,
  FaUsers,
  FaArrowDown,
  FaArrowUp,
  FaMoneyBillWave,
  FaBook,
  FaBalanceScale,
  FaExclamationTriangle,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { api } from '../api/axiosClient';

const Sidebar = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [lowStockCount, setLowStockCount] = React.useState(0);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    checkLowStock();
    const interval = setInterval(checkLowStock, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const checkLowStock = async () => {
    try {
      const response = await api.getLowStock();
      setLowStockCount(response.data.length);
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/products', icon: FaBox, label: 'Products', badge: lowStockCount },
    { path: '/parties', icon: FaUsers, label: 'Parties' },
    { path: '/stock-in', icon: FaArrowDown, label: 'Stock In' },
    { path: '/stock-out', icon: FaArrowUp, label: 'Stock Out' },
    { path: '/payments', icon: FaMoneyBillWave, label: 'Payments' },
    { path: '/ledger', icon: FaBook, label: 'Ledger' },
    { path: '/balances', icon: FaBalanceScale, label: 'Balances' },
  ];

  return (
    <Box
      w={isCollapsed ? '60px' : '250px'}
      h="100vh"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      p={4}
      position="fixed"
      left={0}
      top={0}
      overflowY="auto"
      transition="width 0.3s ease"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        {!isCollapsed && (
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="brand.500">
              Utkarsh Trading
            </Text>
            <Text fontSize="xs" color="gray.500">
              Distribution
            </Text>
          </Box>
        )}
        <IconButton
          icon={isCollapsed ? <FaBars /> : <FaTimes />}
          size="sm"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </Flex>

      <VStack spacing={2} align="stretch">
        {menuItems.map((item) => (
          <Link to={item.path} key={item.path}>
            <Button
              w="100%"
              justifyContent={isCollapsed ? "center" : "flex-start"}
              leftIcon={<Icon as={item.icon} />}
              variant={location.pathname === item.path ? 'solid' : 'ghost'}
              colorScheme={location.pathname === item.path ? 'brand' : 'gray'}
              position="relative"
              title={isCollapsed ? item.label : ''}
            >
              {!isCollapsed && item.label}
              {!isCollapsed && item.badge > 0 && (
                <Badge
                  ml={2}
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  right={2}
                  top={2}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </VStack>

      <Divider my={6} />

      {lowStockCount > 0 && !isCollapsed && (
        <Box
          p={3}
          bg="red.50"
          border="1px"
          borderColor="red.200"
          borderRadius="md"
          mb={4}
        >
          <Box display="flex" alignItems="center">
            <Icon as={FaExclamationTriangle} color="red.500" mr={2} />
            <Text fontSize="sm" color="red.700">
              {lowStockCount} products low in stock
            </Text>
          </Box>
        </Box>
      )}

      <Box mt="auto" pt={4}>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          {!isCollapsed && 'Version 1.0.0'}
        </Text>
      </Box>
    </Box>
  );
};

export default Sidebar;
