"use client"

import Image from "next/image"

interface AiAvatarProps {
  src?: string // Make src optional
}

export function AiAvatar({ src }: AiAvatarProps) {
  const defaultSrc =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design%20%2838%29-3NtaTB4rUdzFs7nOwHchN5oRtxq5wQ.png"

  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden">
      <Image
        src={src || defaultSrc} // Use prop src or fallback to default
        alt="WasLost AI Avatar"
        width={48}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
