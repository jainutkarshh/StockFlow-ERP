import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e0ff',
      200: '#80c9ff',
      300: '#4db2ff',
      400: '#1a9bff',
      500: '#0084e6',
      600: '#0067b3',
      700: '#004a80',
      800: '#002d4d',
      900: '#00101a',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
      },
    },
    Table: {
      variants: {
        striped: {
          tbody: {
            tr: {
              '&:nth-of-type(odd)': {
                td: {
                  background: 'gray.50',
                },
              },
            },
          },
        },
      },
    },
  },
});

export default theme;
