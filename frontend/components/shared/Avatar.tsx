import { getInitials } from '@/lib/utils'

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  return (
    <div className={`${sizes[size]} rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}
