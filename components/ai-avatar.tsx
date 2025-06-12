"use client"

import Image from "next/image"

export function AiAvatar() {
  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design%20%2837%29-SlgyG0gQYL8hyyfLxncnOVOXLgP2Tm.png"
        alt="WasLost AI Avatar"
        width={48}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
