import React, { useState, useEffect } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Button, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Alert, AlertIcon, Badge, Flex, InputGroup, InputLeftElement, Icon, useToast } from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox } from 'react-icons/fa';
import { api } from '../api/axiosClient';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    size: '',
    purchase_rate: '',
    sale_rate: '',
    min_stock: '10',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.size.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts();
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
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

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedProduct) {
        await api.updateProduct(selectedProduct.id, formData);
        toast({
          title: 'Success',
          description: 'Product updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        await api.createProduct(formData);
        toast({
          title: 'Success',
          description: 'Product created successfully',
          status: 'success',
          duration: 3000,
        });
      }
      fetchProducts();
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

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      size: product.size,
      purchase_rate: product.purchase_rate,
      sale_rate: product.sale_rate,
      min_stock: product.min_stock,
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchProducts();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete product',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      brand: '',
      size: '',
      purchase_rate: '',
      sale_rate: '',
      min_stock: '10',
    });
  };

  const brands = [
    'Bisleri', 'Clear Water', 'Kinley', 'Soul', 'Elite', 'Green Ocean', 'Royal Aqua',
    'Biclear', 'Coca-Cola', 'PepsiCo', 'Red Bull', 'Hell', 'Lahoree', 'Local', 'Other'
  ];

  const sizes = [
    '200 ml', '250 ml', '300 ml Can', '400 ml Can', '500 ml', '750 ml', '1 ltr', 
    '2 ltr', '5 ltr', 'Soda', '250 ml Can', '400 ml', 'Soda 750 ml'
  ];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Products Management</Heading>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="blue"
          onClick={() => {
            resetForm();
            onOpen();
          }}
        >
          Add Product
        </Button>
      </Flex>

      <InputGroup mb={6} maxW="400px">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Heading size="md">Loading products...</Heading>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Brand</Th>
                <Th>Size</Th>
                <Th>Purchase Rate</Th>
                <Th>Sale Rate</Th>
                <Th>Current Stock</Th>
                <Th>Min Stock</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProducts.map((product) => (
                <Tr key={product.id}>
                  <Td fontWeight="medium">{product.name}</Td>
                  <Td>
                    <Badge colorScheme="blue">{product.brand}</Badge>
                  </Td>
                  <Td>{product.size}</Td>
                  <Td>₹{product.purchase_rate}</Td>
                  <Td>₹{product.sale_rate}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        product.current_stock <= product.min_stock
                          ? 'red'
                          : product.current_stock <= product.min_stock * 2
                          ? 'yellow'
                          : 'green'
                      }
                    >
                      {product.current_stock || 0}
                    </Badge>
                  </Td>
                  <Td>{product.min_stock}</Td>
                  <Td>
                    {product.current_stock <= product.min_stock ? (
                      <Badge colorScheme="red">Low Stock</Badge>
                    ) : (
                      <Badge colorScheme="green">In Stock</Badge>
                    )}
                  </Td>
                  <Td>
                    <IconButton
                      icon={<FaEdit />}
                      size="sm"
                      colorScheme="blue"
                      mr={2}
                      onClick={() => handleEdit(product)}
                    />
                    <IconButton
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(product.id)}
                    />
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
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Product Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Water, Soda, Cold Drink"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Brand</FormLabel>
              <Select
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Select brand"
              >
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Size</FormLabel>
              <Select
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="Select size"
              >
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Flex gap={4} mb={4}>
              <FormControl>
                <FormLabel>Purchase Rate (₹)</FormLabel>
                <NumberInput
                  value={formData.purchase_rate}
                  onChange={(value) => handleNumberChange('purchase_rate', value)}
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
                <FormLabel>Sale Rate (₹)</FormLabel>
                <NumberInput
                  value={formData.sale_rate}
                  onChange={(value) => handleNumberChange('sale_rate', value)}
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
            </Flex>

            <FormControl>
              <FormLabel>Minimum Stock Alert Level</FormLabel>
              <NumberInput
                value={formData.min_stock}
                onChange={(value) => handleNumberChange('min_stock', value)}
                min={1}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Products;
