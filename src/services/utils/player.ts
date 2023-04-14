import { IconType } from "@/enums/IconTypes";

export function swapIconType(icon: IconType) {
  if (icon == IconType.O) {
    return IconType.X
  }

  return IconType.O
}
