import React, { useState, useEffect } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Flex, Text, Card, CardBody, SimpleGrid, InputGroup, InputLeftElement, Input, Icon, Button, useToast, Alert, AlertIcon, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Textarea, NumberInput, NumberInputField } from '@chakra-ui/react';
import { FaSearch, FaUser, FaArrowUp, FaArrowDown, FaFileExport, FaMoneyBillWave, FaHandshake, FaHandPaper } from 'react-icons/fa';
import { api } from '../api/axiosClient';
import { startHealthCheck, stopHealthCheck } from '../utils/healthCheck';
import { format } from 'date-fns';

const Balances = () => {
  const [balances, setBalances] = useState([]);
  const [summary, setSummary] = useState({ total_receivable: 0, total_payable: 0 });
  const [filteredBalances, setFilteredBalances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPartyForSettlement, setSelectedPartyForSettlement] = useState(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementNote, setSettlementNote] = useState('');
  const { isOpen: settlementModal, onOpen: openSettlementModal, onClose: closeSettlementModal } = useDisclosure();
  const toast = useToast();

  // Notification controls: dismiss once-per-day behavior
  const [backendOnline, setBackendOnline] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);

  const todayKey = () => new Date().toISOString().split('T')[0];

  const [showBackendAlert, setShowBackendAlert] = useState(false);

  const [showLowStockAlert, setShowLowStockAlert] = useState(() => {
    try {
      const d = localStorage.getItem('dismiss_lowstock_alert');
      return d === todayKey() ? false : true;
    } catch (e) {
      return true;
    }
  });

  // Initialize silent health check polling
  useEffect(() => {
    const cleanup = startHealthCheck((isOnline) => {
      setBackendOnline(isOnline);
      // Only show alert if backend goes offline AND it wasn't already offline
      if (!isOnline) {
        setShowBackendAlert(true);
      }
    });

    return cleanup;
  }, []);

  // Fetch low-stock count on mount
  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await api.getLowStock();
        let count = 0;
        if (res?.data) {
          if (Array.isArray(res.data)) count = res.data.length;
          else if (typeof res.data.count === 'number') count = res.data.count;
          else if (Array.isArray(res.data.products)) count = res.data.products.length;
        }
        setLowStockCount(count);
      } catch (err) {
        // Silently ignore low-stock fetch errors
        console.error('Could not fetch low-stock data:', err.message);
      }
    };

    fetchLowStock();
  }, []);

  const dismissBackendAlert = () => {
    setShowBackendAlert(false);
  };

  const dismissLowStockAlert = () => {
    try { localStorage.setItem('dismiss_lowstock_alert', todayKey()); } catch (e) {}
    setShowLowStockAlert(false);
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    const filtered = balances.filter(balance =>
      balance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      balance.phone?.includes(searchTerm) ||
      balance.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBalances(filtered);
  }, [searchTerm, balances]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      console.log('[BALANCES] Fetching balances...');
      const response = await api.getAllBalances();
      console.log('[BALANCES] Response received:', response.data);
      
      // Convert string numbers to actual numbers
      const balancesWithNumbers = (response.data.balances || []).map(b => ({
        ...b,
        opening_balance: parseFloat(b.opening_balance) || 0,
        total_sales: parseFloat(b.total_sales) || 0,
        total_purchases: parseFloat(b.total_purchases) || 0,
        total_payments: parseFloat(b.total_payments) || 0,
        current_balance: parseFloat(b.current_balance) || 0,
      }));
      
      const summaryWithNumbers = {
        total_receivable: parseFloat(response.data.summary?.total_receivable) || 0,
        total_payable: parseFloat(response.data.summary?.total_payable) || 0,
      };
      
      console.log('[BALANCES] Balances (converted):', balancesWithNumbers);
      console.log('[BALANCES] Summary (converted):', summaryWithNumbers);
      setBalances(balancesWithNumbers);
      setFilteredBalances(balancesWithNumbers);
      setSummary(summaryWithNumbers);
      console.log('[BALANCES] State updated successfully');
    } catch (error) {
      console.error('[BALANCES] Fetch error:', error);
      console.error('[BALANCES] Error details:', error.response?.data || error.message);
      toast({
        title: 'Error',
        description: 'Failed to load balances: ' + (error.response?.data?.error || error.message),
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'green';
    if (balance < 0) return 'red';
    return 'gray';
  };

  const getStatusBadge = (balance) => {
    // Use tolerance for floating-point comparison (NOT exact equality)
    if (Math.abs(balance) < 0.01) {  // Within 1 paisa = SETTLED
      return <Badge colorScheme="green">Settled</Badge>;
    } else if (balance > 0) {
      return <Badge colorScheme="yellow">Pending</Badge>;
    } else {
      return <Badge colorScheme="orange">Pending</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Phone', 'Current Balance', 'Status', 'Settlement', 'On Credit'];
    const rows = filteredBalances.map(balance => [
      balance.name,
      balance.type,
      balance.phone || '',
      balance.current_balance,
      Math.abs(balance.current_balance) < 0.01 ? 'Settled' : balance.current_balance > 0 ? 'Pending' : 'Credit',
      'Settle', // Settlement action
      balance.current_balance > 0 ? 'No' : 'Yes', // On Credit status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balances_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleSettlementClick = (balance) => {
    setSelectedPartyForSettlement(balance);
    setSettlementAmount(Math.abs(balance.current_balance).toString());
    setSettlementNote('');
    openSettlementModal();
  };

  const handleSettlePayment = async () => {
    if (loading) return; // Prevent duplicate submissions
    if (!selectedPartyForSettlement || !settlementAmount) {
      toast({
        title: 'Error',
        description: 'Please enter settlement amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const amount = parseFloat(settlementAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Settlement amount must be a valid number greater than 0',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Recording settlement:', {
        party_id: selectedPartyForSettlement.id,
        party_name: selectedPartyForSettlement.name,
        party_type: selectedPartyForSettlement.type,
        amount: amount,
        outstanding_balance: selectedPartyForSettlement.current_balance
      });

      // For suppliers with negative balance (we owe them), record payment as POSITIVE
      // Balance formula: opening + sales - purchases - payments
      // So payments always reduce the balance (move toward zero)
      const settlementAmount = amount;  // ALWAYS POSITIVE

      const response = await api.createPayment({
        party_id: selectedPartyForSettlement.id,
        amount: settlementAmount,
        mode: 'cash',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: settlementNote || `Bill Settlement - ${selectedPartyForSettlement.name}`,
      });

      console.log('Settlement recorded successfully:', response.data);

      toast({
        title: 'Success',
        description: `Settlement of ₹${amount.toFixed(2)} recorded successfully for ${selectedPartyForSettlement.name}`,
        status: 'success',
        duration: 4000,
      });

      closeSettlementModal();
      setSettlementAmount('');
      setSettlementNote('');
      setSelectedPartyForSettlement(null);
      
      // Refresh balances after 1 second to ensure database is updated
      setTimeout(() => {
        console.log('Refreshing balances...');
        fetchBalances();
      }, 1000);
    } catch (error) {
      console.error('Settlement error:', error.response || error);
      toast({
        title: 'Error Recording Settlement',
        description: error.response?.data?.error || error.message || 'Failed to record settlement',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Backend offline alert - shown only if backend is truly offline after grace period */}
      {!backendOnline && showBackendAlert && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Flex justify="space-between" align="center" width="100%">
            <Text>Backend server is offline. Please start the backend server. Retrying in background...</Text>
            <Button variant="ghost" size="sm" onClick={dismissBackendAlert}>×</Button>
          </Flex>
        </Alert>
      )}

      {/* Low stock alert - dismissed once per day */}
      {lowStockCount > 0 && showLowStockAlert && (
        <Alert status="warning" mb={4} borderRadius="md">
          <AlertIcon />
          <Flex justify="space-between" align="center" width="100%">
            <Text>Low stock alert: {lowStockCount} products need restocking</Text>
            <Button variant="ghost" size="sm" onClick={dismissLowStockAlert}>×</Button>
          </Flex>
        </Alert>
      )}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Balances Summary</Heading>
        <Button
          leftIcon={<FaFileExport />}
          onClick={exportToCSV}
          colorScheme="blue"
          variant="outline"
        >
          Export CSV
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Card bg="green.50">
          <CardBody>
            <Flex align="center">
              <Box mr={4} color="green.500">
                <FaArrowDown size={24} />
              </Box>
              <Box>
                <Text fontSize="sm" color="green.600">Total Receivable</Text>
                <Heading fontSize="2xl" fontWeight="bold" color="green.700">
                  ₹{summary.total_receivable?.toLocaleString() || '0'}
                </Heading>
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg="red.50">
          <CardBody>
            <Flex align="center">
              <Box mr={4} color="red.500">
                <FaArrowUp size={24} />
              </Box>
              <Box>
                <Text fontSize="sm" color="red.600">Total Payable</Text>
                <Heading fontSize="2xl" fontWeight="bold" color="red.700">
                  ₹{summary.total_payable?.toLocaleString() || '0'}
                </Heading>
              </Box>
            </Flex>
          </CardBody>
        </Card>

        <Card bg="blue.50">
          <CardBody>
            <Flex align="center">
              <Box mr={4} color="blue.500">
                <FaMoneyBillWave size={24} />
              </Box>
              <Box>
                <Text fontSize="sm" color="blue.600">Net Position</Text>
                <Heading
                  fontSize="2xl"
                  fontWeight="bold"
                  color={
                    (summary.total_receivable - summary.total_payable) >= 0
                      ? 'green.700'
                      : 'red.700'
                  }
                >
                  ₹{(summary.total_receivable - summary.total_payable).toLocaleString()}
                </Heading>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      <InputGroup mb={6} maxW="400px">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search by name, phone, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {loading ? (
        <Text textAlign="center" py={10}>Loading balances...</Text>
      ) : (
        <>
          <Box mb={8}>
            <Heading size="md" mb={4} color="green.600">
              <Flex align="center">
                <Icon as={FaUser} mr={2} />
                Clients ({filteredBalances.filter(b => b.type === 'client').length})
              </Flex>
            </Heading>
            <Card shadow="md">
              <CardBody>
                {filteredBalances.filter(b => b.type === 'client').length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="striped" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Contact</Th>
                          <Th>Current Balance</Th>
                          <Th>On Credit</Th>
                          <Th>Status</Th>
                          <Th>Settlement</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredBalances
                          .filter(b => b.type === 'client')
                          .sort((a, b) => Math.abs(b.current_balance) - Math.abs(a.current_balance))
                          .map((balance) => (
                            <Tr key={balance.id}>
                              <Td fontWeight="medium">{balance.name}</Td>
                              <Td>{balance.phone || 'N/A'}</Td>
                              <Td>
                                <Badge
                                  colorScheme={getBalanceColor(balance.current_balance)}
                                  px={3}
                                  py={1}
                                  fontSize="sm"
                                >
                                  ₹{balance.current_balance.toFixed(2)}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={balance.current_balance > 0 ? "blue" : "green"}>
                                  {balance.current_balance > 0 ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td>{getStatusBadge(balance.current_balance)}</Td>
                              <Td>
                                {balance.current_balance !== 0 && (
                                  <Button
                                    size="xs"
                                    colorScheme="orange"
                                    variant="outline"
                                    leftIcon={<FaHandshake />}
                                    onClick={() => handleSettlementClick(balance)}
                                  >
                                    Settle
                                  </Button>
                                )}
                              </Td>
                              <Td>
                                <Button
                                  as="a"
                                  href={`/ledger/${balance.id}`}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                >
                                  View
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No clients found
                  </Text>
                )}
              </CardBody>
            </Card>
          </Box>

          <Box>
            <Heading size="md" mb={4} color="purple.600">
              <Flex align="center">
                <Icon as={FaUser} mr={2} />
                Suppliers ({filteredBalances.filter(b => b.type === 'supplier').length})
              </Flex>
            </Heading>
            <Card shadow="md">
              <CardBody>
                {filteredBalances.filter(b => b.type === 'supplier').length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="striped" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Contact</Th>
                          <Th>Current Balance</Th>
                          <Th>On Credit</Th>
                          <Th>Status</Th>
                          <Th>Settlement</Th>
                          <Th>Action</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredBalances
                          .filter(b => b.type === 'supplier')
                          .sort((a, b) => Math.abs(b.current_balance) - Math.abs(a.current_balance))
                          .map((balance) => (
                            <Tr key={balance.id}>
                              <Td fontWeight="medium">{balance.name}</Td>
                              <Td>{balance.phone || 'N/A'}</Td>
                              <Td>
                                <Badge
                                  colorScheme={getBalanceColor(balance.current_balance)}
                                  px={3}
                                  py={1}
                                  fontSize="sm"
                                >
                                  ₹{balance.current_balance.toFixed(2)}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme={balance.current_balance < 0 ? "blue" : "green"}>
                                  {balance.current_balance < 0 ? 'Yes' : 'No'}
                                </Badge>
                              </Td>
                              <Td>{getStatusBadge(balance.current_balance)}</Td>
                              <Td>
                                {balance.current_balance !== 0 && (
                                  <Button
                                    size="xs"
                                    colorScheme="orange"
                                    variant="outline"
                                    leftIcon={<FaHandshake />}
                                    onClick={() => handleSettlementClick(balance)}
                                  >
                                    Settle
                                  </Button>
                                )}
                              </Td>
                              <Td>
                                <Button
                                  as="a"
                                  href={`/ledger/${balance.id}`}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                >
                                  View
                                </Button>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No suppliers found
                  </Text>
                )}
              </CardBody>
            </Card>
          </Box>
        </>
      )}

      <Modal isOpen={settlementModal} onClose={closeSettlementModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Settle Bill</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPartyForSettlement && (
              <Box>
                <Alert status="info" mb={4} borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">{selectedPartyForSettlement.name}</Text>
                    <Text fontSize="sm" mt={1}>
                      <strong>Current Balance:</strong> <Badge colorScheme="orange">₹{Math.abs(selectedPartyForSettlement.current_balance).toFixed(2)}</Badge>
                    </Text>
                    <Text fontSize="xs" color="gray.600" mt={2}>
                      {selectedPartyForSettlement.type === 'supplier' 
                        ? `You owe this supplier ₹${Math.abs(selectedPartyForSettlement.current_balance).toFixed(2)}`
                        : `This customer owes you ₹${selectedPartyForSettlement.current_balance.toFixed(2)}`}
                    </Text>
                  </Box>
                </Alert>

                <FormControl mb={4}>
                  <FormLabel fontWeight="bold">Settlement Amount (₹)</FormLabel>
                  <NumberInput
                    value={settlementAmount}
                    onChange={(value) => setSettlementAmount(value)}
                    min={0}
                    step={1}
                    precision={2}
                  >
                    <NumberInputField 
                      placeholder="Enter settlement amount"
                      name="settlementAmount"
                    />
                  </NumberInput>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Outstanding: ₹{Math.abs(selectedPartyForSettlement.current_balance).toFixed(2)}
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Note (Optional)</FormLabel>
                  <Textarea
                    value={settlementNote}
                    onChange={(e) => setSettlementNote(e.target.value)}
                    placeholder="Add settlement note..."
                    rows={3}
                  />
                </FormControl>
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeSettlementModal}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              leftIcon={<FaHandshake />}
              onClick={handleSettlePayment}
              isLoading={loading}
            >
              Record Settlement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};


export default Balances;
