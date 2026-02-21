export function mapShelf(
  exclusiveShelf: string,
): 'reading' | 'want_to_read' | 'finished' | 'abandoned' {
  switch (exclusiveShelf?.toLowerCase()) {
    case 'read':
      return 'finished'
    case 'currently-reading':
      return 'reading'
    case 'to-read':
      return 'want_to_read'
    default:
      return 'want_to_read'
  }
}
