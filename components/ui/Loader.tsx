import { Loader2 } from 'lucide-react'

export function Loader({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-600 ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader size="lg" className="mx-auto mb-4" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}


