import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

// Reliable fallback image - data URI instead of external URL
const FALLBACK_IMG_SRC = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCI+SGVhbHRoU2NhbiBJbWFnZTwvdGV4dD48L3N2Zz4='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [currentSrc, setCurrentSrc] = useState(props.src)
  const [errorCount, setErrorCount] = useState(0)

  const handleError = () => {
    // REDUCED: Only log image errors in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Image failed to load: ${currentSrc}`)
    }
    
    if (errorCount === 0) {
      // First error: try reliable fallback (data URI)
      if (process.env.NODE_ENV === 'development') {
        console.log('Trying reliable data URI fallback...')
      }
      setCurrentSrc(FALLBACK_IMG_SRC)
      setErrorCount(1)
    } else if (errorCount === 1) {
      // Second error: show error placeholder
      if (process.env.NODE_ENV === 'development') {
        console.error('Fallback image also failed, showing error placeholder')
      }
      setErrorCount(2)
    }
  }

  const { src, alt, style, className, ...rest } = props

  // Show error placeholder if both original and fallback failed
  if (errorCount >= 2) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    )
  }

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className} 
      style={style} 
      loading="lazy"
      decoding="async"
      {...rest} 
      onError={handleError} 
    />
  )
}