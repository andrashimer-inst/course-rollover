import { View, Heading, Text, Button, Flex } from '@instructure/ui'

export default function App() {
  return (
    <View as="div" padding="large">
      <Flex direction="column" gap="medium">
        <Heading level="h1">InstUI designs</Heading>
        <Text>If you can see this, InstUI is working.</Text>
        <Button color="primary">Primary button</Button>
      </Flex>
    </View>
  )
}
