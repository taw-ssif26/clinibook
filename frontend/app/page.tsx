import { redirect } from 'next/navigation'

// Root → redirect to login (auth state managed client-side)
export default function Home() {
  redirect('/login')
}
