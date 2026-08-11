import { redirect } from 'next/navigation'

// Temporarily skip the homepage and land on films.
export default function Page() {
  redirect('/films')
}
