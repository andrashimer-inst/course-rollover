import { Button, Heading, InstUISettingsProvider, Text, View, light } from '@instructure/ui/v11_7'
import DesktopWrapper from './DesktopWrapper'

export default function App() {
  return (
    <InstUISettingsProvider theme={light}>
      <DesktopWrapper
        pageTitle="Courses"
        breadcrumb={['Home']}
        activeNav="Courses"
        fullWidth
      >
        <View as="div" padding="medium" borderWidth="small" borderRadius="medium">
          <Heading level="h2">Sample content</Heading>
          <Text as="p">Sample course data only. Replace this with the screen you want to design.</Text>
          <Button color="primary">Primary action</Button>
        </View>
      </DesktopWrapper>
    </InstUISettingsProvider>
  )
}
