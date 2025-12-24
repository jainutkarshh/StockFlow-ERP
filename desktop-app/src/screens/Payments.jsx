import React, { useState, useEffect } from 'react';
import { Box, Heading, Grid, GridItem, FormControl, FormLabel, Select, Input, NumberInput, NumberInputField, Textarea, Button, Table, Thead, Tbody, Tr, Th, Td, Badge, Flex, Text, Alert, AlertIcon, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { FaMoneyBillWave, FaSave, FaCheckCircle } from 'react-icons/fa';
import { api } from '../api/axiosClient';
import { format } from 'date-fns';

const Payments = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [payments, setPayments] = useState([]);
  const [partyBalance, setPartyBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isOpen: clearBalanceModal, onOpen: openClearModal, onClose: closeClearModal } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    party_id: '',
    amount: '',
    mode: 'cash',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    if (formData.party_id) {
      fetchPartyDetails(parseInt(formData.party_id));
    }
  }, [formData.party_id]);

  const fetchParties = async () => {
    try {
      const response = await api.getParties();
      setParties(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load parties',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchPartyDetails = async (partyId) => {
    try {
      const [balanceRes, paymentsRes] = await Promise.all([
        api.getPartyBalance(partyId),
        api.getPayments(partyId),
      ]);

      setSelectedParty(parties.find(p => p.id === partyId));
      setPartyBalance(balanceRes.data.current_balance);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching party details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (value) => {
    setFormData(prev => ({ ...prev, amount: value }));
  };

  const handleSubmit = async () => {
    if (!formData.party_id || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please select party and enter amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: 'Error',
        description: 'Amount must be greater than 0',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      await api.createPayment({
        ...formData,
        party_id: parseInt(formData.party_id),
        amount: amount,
      });

      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
        status: 'success',
        duration: 3000,
      });

      // Reset form but keep party selected
      setFormData({
        party_id: formData.party_id,
        amount: '',
        mode: 'cash',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: '',
      });

      // Refresh party details immediately
      setTimeout(() => {
        fetchPartyDetails(parseInt(formData.party_id));
      }, 500);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to record payment',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearBalance = async () => {
    if (!formData.party_id || partyBalance === 0) {
      toast({
        title: 'Error',
        description: 'No balance to clear',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await api.clearBalance(parseInt(formData.party_id));

      toast({
        title: 'Success',
        description: 'Balance cleared successfully',
        status: 'success',
        duration: 3000,
      });

      closeClearModal();
      fetchPartyDetails(parseInt(formData.party_id));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to clear balance',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Heading mb={6} size="lg">
        <Flex align="center">
          <Box mr={3} color="purple.500">
            <FaMoneyBillWave />
          </Box>
          Payments Management
        </Flex>
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
        <GridItem>
          <Box bg="white" p={6} borderRadius="lg" shadow="md">
            <Heading size="md" mb={4}>
              Record Payment
            </Heading>

            <FormControl mb={4}>
              <FormLabel>Party</FormLabel>
              <Select
                name="party_id"
                value={formData.party_id}
                onChange={handleInputChange}
                placeholder="Select party"
              >
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name} ({party.type})
                  </option>
                ))}
              </Select>
            </FormControl>

            {selectedParty && (
              <Alert status={partyBalance > 0 ? "info" : "success"} mb={4} borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">{selectedParty.name}</Text>
                  <Text>
                    Current Balance: 
                    <Badge ml={2} colorScheme={partyBalance > 0 ? "orange" : "green"}>
                      ₹{Math.abs(partyBalance).toFixed(2)}
                    </Badge>
                  </Text>
                </Box>
              </Alert>
            )}

            <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
              <FormControl>
                <FormLabel>Amount (₹)</FormLabel>
                <NumberInput
                  value={formData.amount}
                  onChange={handleNumberChange}
                  min={0}
                  precision={2}
                >
                  <NumberInputField placeholder="Enter amount" />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Payment Mode</FormLabel>
                <Select
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </Select>
              </FormControl>
            </Grid>

            <FormControl mb={4}>
              <FormLabel>Date</FormLabel>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl mb={6}>
              <FormLabel>Note (Optional)</FormLabel>
              <Textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Add payment note..."
                rows={3}
              />
            </FormControl>

            <Flex justify="space-between">
              {partyBalance > 0 && (
                <Button
                  leftIcon={<FaCheckCircle />}
                  onClick={openClearModal}
                  colorScheme="green"
                  variant="outline"
                >
                  Clear Full Balance
                </Button>
              )}
              <Button
                leftIcon={<FaSave />}
                onClick={handleSubmit}
                colorScheme="purple"
                isLoading={loading}
              >
                Record Payment
              </Button>
            </Flex>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg="white" p={6} borderRadius="lg" shadow="md">
            <Heading size="md" mb={4}>
              Payment History
            </Heading>

            {payments.length > 0 ? (
              <Box overflowY="auto" maxH="500px">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Amount</Th>
                      <Th>Mode</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {payments.map((payment) => (
                      <Tr key={payment.id}>
                        <Td>{format(new Date(payment.date), 'dd/MM/yy')}</Td>
                        <Td>
                          <Badge colorScheme="blue">
                            ₹{payment.amount}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={payment.mode === 'cash' ? 'green' : 'purple'}>
                            {payment.mode}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text color="gray.500" textAlign="center" py={10}>
                {selectedParty ? 'No payments recorded' : 'Select a party to view payment history'}
              </Text>
            )}
          </Box>
        </GridItem>
      </Grid>

      <Modal isOpen={clearBalanceModal} onClose={closeClearModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Clear Full Balance</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              Are you sure you want to clear the full balance?
            </Alert>
            <Box p={4} bg="gray.50" borderRadius="md">
              <Text fontWeight="bold">{selectedParty?.name}</Text>
              <Text>
                Current Balance: 
                <Badge ml={2} colorScheme="red" fontSize="lg">
                  ₹{partyBalance.toFixed(2)}
                </Badge>
              </Text>
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeClearModal}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleClearBalance} isLoading={loading}>
              Clear Balance
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Payments;
