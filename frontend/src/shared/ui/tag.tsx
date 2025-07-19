import { cn } from "@/shared/lib/utils";
import { Button } from "./button";

export default function Tag({tag, selected = false, onClick} :{tag: string,  selected?: boolean, onClick?: (tag: string) => void,}) {
    return (
        <Button
            onClick={() => onClick?.(tag)}
            size="sm"
            className={cn(
                "justify-start text-left h-auto px-3 py-2 w-fit min-w-0 border-0 transition-all duration-200",
                selected
                    ? "pressed-effect" 
                    : "hover:brightness-90 shadow-sm hover:shadow-md"
            )}
      >
        #{tag}
      </Button>
    )
}