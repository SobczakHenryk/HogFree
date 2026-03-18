---
name: chakra-patterns
description: Proporciona patrones, mejores prácticas y guías de estilo para desarrollar interfaces con Chakra UI.
---

# Chakra UI Patterns & Best Practices

Esta habilidad guía al agente en la creación de interfaces limpias, accesibles y consistentes utilizando Chakra UI.

## Filosofía de Diseño
- **Composición sobre Herencia**: Construye componentes complejos combinando componentes simples (Box, Flex, Stack).
- **Style Props**: Utiliza props de estilo (ej. `mb={4}`, `color="blue.500"`) en lugar de hojas de estilo externas o `styled-components` siempre que sea posible para mantener la localidad de los estilos.
- **Accesibilidad por Defecto**: Utiliza los componentes semánticos de Chakra y sus props de accesibilidad (aria-*) correctamente.

## Mejores Prácticas

### Layout y Estructura
1. **Evita `div`**: Usa `Box` como el bloque de construcción fundamental en lugar de `div`.
2. **Espaciado**: Usa `Stack` (HStack, VStack) para manejar el espaciado entre elementos en lugar de márgenes manuales en cada hijo.
   ```jsx
   // Mal ❌
   <Box>
     <Box mb={4}>Item 1</Box>
     <Box mb={4}>Item 2</Box>
   </Box>

   // Bien ✅
   <VStack spacing={4} align="stretch">
     <Box>Item 1</Box>
     <Box>Item 2</Box>
   </VStack>
   ```
3. **Contenedores**: Usa `Container` para restringir el ancho del contenido principal y asegurar márgenes consistentes.

### Estilos y Tema
1. **Tokens del Tema**: Usa siempre valores del tema (colores, espaciado, fuentes) `color="blue.500"`, `p={4}` (que equivale a 1rem/16px), en lugar de valores hardcodeados `color="#3182ce"`, `p="16px"`.
2. **Responsive Styles**: Usa la sintaxis de array u objeto para estilos responsivos.
   ```jsx
   // Array: [base, sm, md, lg, xl]
   <Box w={[ "100%", "50%", "25%" ]} />
   ```

## Patrones Comunes

### Tarjetas (Cards)
Usa `Box` con sombras y bordes redondeados, o el componente `Card` si usas versiones recientes de Chakra.
```jsx
<Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={6} boxShadow="md">
  <Heading size="md" mb={2}>Título de la Tarjeta</Heading>
  <Text color="gray.600">Contenido de la tarjeta...</Text>
</Box>
```

### Formularios
Usa `FormControl`, `FormLabel`, `Input`, y `FormErrorMessage` para accesibilidad y validación.
```jsx
<FormControl isInvalid={isError}>
  <FormLabel htmlFor="email">Email</FormLabel>
  <Input id="email" type="email" />
  {!isError ? (
    <FormHelperText>Ingresa tu email personal.</FormHelperText>
  ) : (
    <FormErrorMessage>Email es requerido.</FormErrorMessage>
  )}
</FormControl>
```
