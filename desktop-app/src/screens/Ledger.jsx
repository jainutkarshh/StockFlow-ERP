import React, { useState, useEffect } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Select, Input, Button, Flex, Badge, Text, Alert, AlertIcon, Card, CardBody, SimpleGrid, useToast } from '@chakra-ui/react';
import { FaFilter, FaFileExport } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { api } from '../api/axiosClient';
import { format } from 'date-fns';

const Ledger = () => {
  const { partyId } = useParams();
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(partyId || '');
  const [ledgerData, setLedgerData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from_date: '',
    to_date: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      fetchLedger(selectedParty);
    }
  }, [selectedParty, dateRange]);

  useEffect(() => {
    if (ledgerData?.transactions) {
      setFilteredData(ledgerData.transactions);
    }
  }, [ledgerData]);

  const fetchParties = async () => {
    try {
      const response = await api.getParties();
      setParties(response.data);
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const fetchLedger = async (partyId) => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.from_date) params.from_date = dateRange.from_date;
      if (dateRange.to_date) params.to_date = dateRange.to_date;

      const response = await api.getLedger(partyId, params);
      setLedgerData(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load ledger',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePartyChange = (e) => {
    setSelectedParty(e.target.value);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setDateRange({ from_date: '', to_date: '' });
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Sale': return 'green';
      case 'Purchase': return 'blue';
      case 'Payment': return 'purple';
      default: return 'gray';
    }
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const exportToCSV = () => {
    if (!ledgerData) return;

    const headers = ['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance'];
    const rows = filteredData.map(row => [
      format(new Date(row.date), 'dd/MM/yyyy'),
      row.transaction_type,
      row.description,
      row.debit,
      row.credit,
      row.running_balance,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${ledgerData.party_name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Party Ledger</Heading>
        <Button
          leftIcon={<FaFileExport />}
          onClick={exportToCSV}
          colorScheme="blue"
          variant="outline"
          isDisabled={!ledgerData}
        >
          Export CSV
        </Button>
      </Flex>

      <Card shadow="sm" mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel>Select Party</FormLabel>
              <Select
                value={selectedParty}
                onChange={handlePartyChange}
                placeholder="Select party"
              >
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name} ({party.type})
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>From Date</FormLabel>
              <Input
                type="date"
                name="from_date"
                value={dateRange.from_date}
                onChange={handleDateChange}
              />
            </FormControl>

            <FormControl>
              <FormLabel>To Date</FormLabel>
              <Input
                type="date"
                name="to_date"
                value={dateRange.to_date}
                onChange={handleDateChange}
              />
            </FormControl>
          </SimpleGrid>

          <Flex justify="flex-end" mt={4}>
            <Button leftIcon={<FaFilter />} onClick={handleClearFilters} variant="ghost" size="sm">
              Clear Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {ledgerData && (
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
          <Card bg="blue.50">
            <CardBody>
              <Text fontSize="sm" color="blue.600">Opening Balance</Text>
              <Heading fontSize="2xl" fontWeight="bold" color="blue.700">
                {formatAmount(ledgerData.opening_balance)}
              </Heading>
            </CardBody>
          </Card>

          <Card bg={ledgerData.closing_balance >= 0 ? 'green.50' : 'red.50'}>
            <CardBody>
              <Text fontSize="sm" color={ledgerData.closing_balance >= 0 ? 'green.600' : 'red.600'}>
                Closing Balance
              </Text>
              <Heading fontSize="2xl" fontWeight="bold" color={ledgerData.closing_balance >= 0 ? 'green.700' : 'red.700'}>
                {formatAmount(ledgerData.closing_balance)}
              </Heading>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      <Card shadow="md">
        <CardBody>
          {!selectedParty ? (
            <Alert status="info">
              <AlertIcon />
              Please select a party to view ledger
            </Alert>
          ) : loading ? (
            <Text textAlign="center" py={10}>Loading ledger...</Text>
          ) : ledgerData && filteredData.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="striped">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Description</Th>
                    <Th>Credit</Th>
                    <Th>Debit</Th>
                    <Th>Balance</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredData.map((row, index) => (
                    <Tr key={index}>
                      <Td>{format(new Date(row.date), 'dd/MM/yy')}</Td>
                      <Td>
                        <Badge colorScheme={getTransactionColor(row.transaction_type)}>
                          {row.transaction_type}
                        </Badge>
                      </Td>
                      <Td>{row.description}</Td>
                      <Td>
                        {row.debit > 0 && (
                          <Text color="green.600" fontWeight="bold">
                            {formatAmount(row.debit)}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        {row.credit > 0 && (
                          <Text color="red.600" fontWeight="bold">
                            {formatAmount(row.credit)}
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Badge colorScheme={row.running_balance >= 0 ? 'green' : 'red'}>
                          {formatAmount(row.running_balance)}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Text color="gray.500" textAlign="center" py={10}>
              {selectedParty ? 'No transactions found' : 'Select a party'}
            </Text>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

const FormControl = ({ children, ...props }) => (
  <Box {...props}>{children}</Box>
);

const FormLabel = ({ children }) => (
  <Text fontSize="sm" fontWeight="bold" mb={2}>{children}</Text>
);

export default Ledger;
