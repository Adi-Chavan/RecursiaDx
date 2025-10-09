import React from "react"
import { cn } from "@/lib/utils"

export function ImageCard({
  src,
  alt,
  className,
  ...props
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("rounded-lg border", className)}
      {...props}
    />
  )
}
