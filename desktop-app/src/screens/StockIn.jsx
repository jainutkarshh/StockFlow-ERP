import React, { useState, useEffect } from 'react';
import { Box, Heading, Grid, GridItem, FormControl, FormLabel, Select, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Button, Alert, AlertIcon, AlertTitle, AlertDescription, Table, Thead, Tbody, Tr, Th, Td, Badge, Flex, Text, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter, useDisclosure } from '@chakra-ui/react';
import { FaArrowDown, FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import { api } from '../api/axiosClient';
import { format } from 'date-fns';

const StockIn = () => {
  const [products, setProducts] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '' });

  const [formData, setFormData] = useState({
    product_id: '',
    party_id: '',
    quantity: '1',
    rate: '',
    invoice_no: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.product_id) {
      const product = products.find(p => p.id === parseInt(formData.product_id));
      setSelectedProduct(product);
      if (product) {
        setFormData(prev => ({ ...prev, rate: product.purchase_rate.toString() }));
      }
    }
  }, [formData.product_id, products]);

  const fetchData = async () => {
    try {
      const [productsRes, partiesRes] = await Promise.all([
        api.getProducts(),
        api.getParties(),
      ]);
      setProducts(productsRes.data);
      const suppliers = partiesRes.data.filter(p => p.type === 'supplier');
      setParties(suppliers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) {
      toast({
        title: 'Error',
        description: 'Supplier name is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await api.createParty({
        ...newSupplier,
        type: 'supplier',
        opening_balance: 0,
      });

      toast({
        title: 'Success',
        description: 'Supplier added successfully',
        status: 'success',
        duration: 3000,
      });

      setNewSupplier({ name: '', phone: '', address: '' });
      onClose();
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add supplier',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.rate) || 0;
    return (quantity * rate).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.party_id) {
      toast({
        title: 'Error',
        description: 'Please select product and supplier',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      await api.stockIn({
        ...formData,
        product_id: parseInt(formData.product_id),
        party_id: parseInt(formData.party_id),
        quantity: parseInt(formData.quantity),
        rate: parseFloat(formData.rate),
        total_amount: calculateTotal(),
      });

      toast({
        title: 'Success',
        description: 'Stock added successfully',
        status: 'success',
        duration: 3000,
      });

      handleClear();
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add stock',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      product_id: '',
      party_id: '',
      quantity: '1',
      rate: '',
      invoice_no: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    });
    setSelectedProduct(null);
  };

  return (
    <Box>
      <Heading mb={6} size="lg">
        <Flex align="center">
          <Box mr={3} color="green.500">
            <FaArrowDown />
          </Box>
          Stock In (Purchase)
        </Flex>
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem>
          <Box bg="white" p={6} borderRadius="lg" shadow="md">
            <Heading size="md" mb={4}>
              Purchase Details
            </Heading>

            <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
              <FormControl>
                <Flex justify="space-between" align="center" mb={2}>
                  <FormLabel mb={0}>Supplier</FormLabel>
                  <Button size="sm" colorScheme="blue" leftIcon={<FaPlus />} onClick={onOpen}>
                    Add New
                  </Button>
                </Flex>
                <Select
                  name="party_id"
                  value={formData.party_id}
                  onChange={handleInputChange}
                  placeholder="Select supplier"
                >
                  {parties && parties.length > 0 ? (
                    parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No suppliers found</option>
                  )}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Product</FormLabel>
                <Select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleInputChange}
                  placeholder="Select product"
                >
                  {products && products.length > 0 ? (
                    products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.brand} - {product.name} ({product.size})
                      </option>
                    ))
                  ) : (
                    <option value="">No products found</option>
                  )}
                </Select>
              </FormControl>
            </Grid>

            {selectedProduct && (
              <Alert status="info" mb={4} borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Product Info</AlertTitle>
                  <AlertDescription>
                    Current Stock: {selectedProduct.current_stock || 0} | Min Stock: {selectedProduct.min_stock} | Purchase Rate: ₹{selectedProduct.purchase_rate}
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={4}>
              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <NumberInput
                  value={formData.quantity}
                  onChange={(value) => handleNumberChange('quantity', value)}
                  min={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Rate (₹)</FormLabel>
                <NumberInput
                  value={formData.rate}
                  onChange={(value) => handleNumberChange('rate', value)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Total Amount</FormLabel>
                <Input
                  value={`₹${calculateTotal()}`}
                  isReadOnly
                  bg="gray.50"
                  fontWeight="bold"
                />
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
              <FormControl>
                <FormLabel>Invoice No.</FormLabel>
                <Input
                  name="invoice_no"
                  value={formData.invoice_no}
                  onChange={handleInputChange}
                  placeholder="Enter invoice number"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </FormControl>
            </Grid>

            <Flex justify="space-between">
              <Button leftIcon={<FaTimes />} onClick={handleClear} variant="outline" colorScheme="gray">
                Clear
              </Button>
              <Button leftIcon={<FaSave />} onClick={handleSubmit} colorScheme="green" isLoading={loading}>
                Save Stock In
              </Button>
            </Flex>
          </Box>
        </GridItem>
      </Grid>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Supplier</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Supplier Name</FormLabel>
              <Input
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Phone Number</FormLabel>
              <Input
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Address</FormLabel>
              <Input
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                placeholder="Enter address"
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddSupplier}>
              Add Supplier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StockIn;
