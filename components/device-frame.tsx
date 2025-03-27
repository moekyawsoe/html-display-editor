import type React from "react"
import { cn } from "@/lib/utils"

interface DeviceFrameProps {
  children: React.ReactNode
  deviceType: string
  orientation: string
  className?: string
}

export function DeviceFrame({ children, deviceType, orientation, className }: DeviceFrameProps) {
  const isLandscape = orientation === "landscape"

  // Determine frame styling based on device type
  const getFrameStyles = () => {
    switch (deviceType) {
      case "mobile":
        return {
          wrapper: cn("rounded-[36px] border-[14px] border-black bg-black shadow-xl", isLandscape ? "rotate-90" : ""),
          notch: "absolute top-0 left-1/2 -translate-x-1/2 h-6 w-40 bg-black rounded-b-xl z-10",
          button: "absolute right-[-20px] top-32 h-12 w-3 bg-gray-800 rounded-r-lg",
        }
      case "tablet":
        return {
          wrapper: cn("rounded-[24px] border-[12px] border-black bg-black shadow-xl", isLandscape ? "rotate-90" : ""),
          notch: "absolute top-0 left-1/2 -translate-x-1/2 h-2 w-20 bg-black rounded-b-xl z-10",
          button: "absolute right-[-18px] top-32 h-10 w-3 bg-gray-800 rounded-r-lg",
        }
      case "desktop":
        return {
          wrapper: "rounded-t-lg border-t-[24px] border-x-[12px] border-black bg-black shadow-xl",
          stand:
            "absolute -bottom-16 left-1/2 -translate-x-1/2 h-16 w-1/3 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-lg",
          base: "absolute -bottom-20 left-1/2 -translate-x-1/2 h-4 w-2/3 bg-gray-800 rounded-full",
        }
      case "tv":
        return {
          wrapper: "rounded-md border-[20px] border-black bg-black shadow-xl",
          stand: "absolute -bottom-12 left-1/2 -translate-x-1/2 h-12 w-1/3 bg-gray-800",
          base: "absolute -bottom-16 left-1/2 -translate-x-1/2 h-4 w-1/2 bg-gray-900 rounded-full",
        }
      case "kiosk":
        return {
          wrapper: "rounded-md border-[16px] border-gray-800 bg-gray-800 shadow-xl",
          base: "absolute -bottom-32 left-1/2 -translate-x-1/2 w-1/3 h-32 bg-gradient-to-t from-gray-900 to-gray-800",
          floor: "absolute -bottom-36 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-gray-900 rounded-full",
        }
      case "monitor":
        return {
          wrapper: "rounded-md border-[16px] border-gray-800 bg-gray-800 shadow-xl",
          stand: "absolute -bottom-20 left-1/2 -translate-x-1/2 h-20 w-1/6 bg-gray-700",
          base: "absolute -bottom-24 left-1/2 -translate-x-1/2 h-4 w-1/3 bg-gray-800 rounded-full",
        }
      default:
        return {
          wrapper: "",
        }
    }
  }

  const frameStyles = getFrameStyles()

  return (
    <div className="relative flex items-center justify-center">
      <div className={cn("relative", className)}>
        <div className={frameStyles.wrapper}>{children}</div>

        {/* Device-specific elements */}
        {deviceType === "mobile" && (
          <>
            <div className={frameStyles.notch}></div>
            <div className={frameStyles.button}></div>
          </>
        )}

        {deviceType === "tablet" && (
          <>
            <div className={frameStyles.notch}></div>
            <div className={frameStyles.button}></div>
          </>
        )}

        {deviceType === "desktop" && (
          <>
            <div className={frameStyles.stand}></div>
            <div className={frameStyles.base}></div>
          </>
        )}

        {deviceType === "tv" && (
          <>
            <div className={frameStyles.stand}></div>
            <div className={frameStyles.base}></div>
          </>
        )}

        {deviceType === "kiosk" && (
          <>
            <div className={frameStyles.base}></div>
            <div className={frameStyles.floor}></div>
          </>
        )}

        {deviceType === "monitor" && (
          <>
            <div className={frameStyles.stand}></div>
            <div className={frameStyles.base}></div>
          </>
        )}
      </div>
    </div>
  )
}

