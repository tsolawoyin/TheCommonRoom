'use client'

import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Button
      variant="ghost"
      onClick={logout}
      className="text-[#0a2463]/70 hover:text-[#0a2463] hover:bg-[#0a2463]/5"
    >
      Log out
    </Button>
  )
}
