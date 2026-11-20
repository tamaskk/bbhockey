import { Gutter } from '@payloadcms/ui'
import { Folders } from './Folders'

// List view of the Jelentkezések collection: submissions organised in folders.
// Payload renders it inside the normal admin frame and checks access itself.
export function Mappak() {
  return (
    <Gutter>
      <Folders />
    </Gutter>
  )
}
