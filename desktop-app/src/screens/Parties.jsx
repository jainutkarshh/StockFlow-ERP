import React, { useState, useEffect } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Button, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, NumberInput, NumberInputField, InputGroup, InputLeftElement, Icon, Badge, Flex, Text, useToast } from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUsers, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { api } from '../api/axiosClient';

const Parties = () => {
  const [parties, setParties] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'client',
    phone: '',
    address: '',
    opening_balance: '0',
  });

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    const filtered = parties.filter(party =>
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.phone?.includes(searchTerm)
    );
    setFilteredParties(filtered);
  }, [searchTerm, parties]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await api.getParties();
      setParties(response.data);
      setFilteredParties(response.data);

      const balancePromises = response.data.map(party =>
        api.getPartyBalance(party.id).then(res => res.data.current_balance)
      );
      const balanceResults = await Promise.all(balancePromises);
      const balanceMap = {};
      response.data.forEach((party, index) => {
        balanceMap[party.id] = balanceResults[index];
      });
      setBalances(balanceMap);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load parties',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedParty) {
        await api.updateParty(selectedParty.id, formData);
        toast({
          title: 'Success',
          description: 'Party updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        await api.createParty(formData);
        toast({
          title: 'Success',
          description: 'Party created successfully',
          status: 'success',
          duration: 3000,
        });
      }
      fetchParties();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Operation failed',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleEdit = (party) => {
    setSelectedParty(party);
    setFormData({
      name: party.name,
      type: party.type,
      phone: party.phone || '',
      address: party.address || '',
      opening_balance: party.opening_balance.toString(),
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        await api.deleteParty(id);
        toast({
          title: 'Success',
          description: 'Party deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchParties();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete party',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const resetForm = () => {
    setSelectedParty(null);
    setFormData({
      name: '',
      type: 'client',
      phone: '',
      address: '',
      opening_balance: '0',
    });
  };

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'green';
    if (balance < 0) return 'red';
    return 'gray';
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Parties Management</Heading>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="blue"
          onClick={() => {
            resetForm();
            onOpen();
          }}
        >
          Add Party
        </Button>
      </Flex>

      <InputGroup mb={6} maxW="400px">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search parties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Heading size="md">Loading parties...</Heading>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Contact</Th>
                <Th>Current Balance</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredParties.map((party) => (
                <Tr key={party.id}>
                  <Td fontWeight="medium">
                    <Link to={`/ledger/${party.id}`}>
                      <Text color="brand.500" _hover={{ textDecoration: 'underline' }}>
                        {party.name}
                      </Text>
                    </Link>
                  </Td>
                  <Td>
                    <Badge colorScheme={party.type === 'client' ? 'green' : 'purple'}>
                      {party.type === 'client' ? 'Client' : 'Supplier'}
                    </Badge>
                  </Td>
                  <Td>{party.phone || 'N/A'}</Td>
                  <Td>
                    <Badge colorScheme={getBalanceColor(balances[party.id])}>
                      ₹{Math.abs(balances[party.id] || 0).toFixed(2)}
                    </Badge>
                  </Td>
                  <Td>
                    {balances[party.id] === 0 ? (
                      <Badge colorScheme="green">Settled</Badge>
                    ) : (
                      <Badge colorScheme="yellow">Pending</Badge>
                    )}
                  </Td>
                  <Td>
                    <Flex>
                      <IconButton
                        icon={<FaEdit />}
                        size="sm"
                        colorScheme="blue"
                        mr={2}
                        onClick={() => handleEdit(party)}
                      />
                      <IconButton
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(party.id)}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedParty ? 'Edit Party' : 'Add New Party'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Party Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter party name"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Type</FormLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="client">Client</option>
                <option value="supplier">Supplier</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Phone Number</FormLabel>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Address</FormLabel>
              <Input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Opening Balance</FormLabel>
              <NumberInput
                value={formData.opening_balance}
                onChange={(value) => setFormData(prev => ({ ...prev, opening_balance: value }))}
                precision={2}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {selectedParty ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Parties;
