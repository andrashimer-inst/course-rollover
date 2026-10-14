import { Flex, IconOffLine, Link, List, ScreenReaderContent, View } from '@instructure/ui/v11_7'
import type { CourseNav } from './GlobalNav'

// Legacy secondary navigation: the course menu as a column of plain blue links, with an eye icon
// on unpublished items (Canvas today). Light and Dark show this menu in the Courses sub navigation
// of the global nav instead (see GlobalNav).
export default function LegacyCourseMenu({ course }: { course: CourseNav }) {
  return (
    <View as="nav" aria-label="Course navigation" display="block" width="16rem" padding="general.spaceLg general.spaceXl general.space2xl">
      <List isUnstyled itemSpacing="small">
        {course.items.map((item) => (
          <List.Item key={item.label}>
            <Flex justifyItems="space-between" alignItems="center" gap="general.spaceSm">
              <Link href="#" variant="standalone" aria-current={item.current ? 'page' : undefined}>
                {item.label}
              </Link>
              {item.unpublished && (
                <>
                  <IconOffLine />
                  <ScreenReaderContent>Unpublished</ScreenReaderContent>
                </>
              )}
            </Flex>
          </List.Item>
        ))}
      </List>
    </View>
  )
}
