import { notFound } from 'next/navigation'

/** Unknown public URLs render the site's own 404, inside the site layout. */
export default function Missing() {
  notFound()
}
