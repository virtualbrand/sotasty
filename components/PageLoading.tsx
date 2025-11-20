import { Spinner } from '@/components/ui/spinner'

interface PageLoadingProps {
  message?: string
}

export default function PageLoading({ message }: PageLoadingProps) {
  return (
    <div className="flex justify-center py-8">
      <Spinner size="large" className="text-[var(--color-clay-500)] !w-[40px] !h-[40px]" />
    </div>
  )
}
