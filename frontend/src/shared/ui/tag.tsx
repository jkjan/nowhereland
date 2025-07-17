import { cn } from "@/lib/utils";
import { Button } from "./button";

export default function Tag({tag, selected = false, onClick} :{tag: string,  selected?: boolean, onClick?: (tag: string) => void,}) {
    return (
        <Button
            onClick={() => onClick?.(tag)}
            variant={selected ? "default" : "outline"}
            size="sm"
            className={cn(
                "bg-[var(--color-accent)] justify-start text-left h-auto px-3 py-2 w-fit min-w-0 border-0 transition-all duration-200",
                selected
                    ? "text-[var(--color-primary)] pressed-effect" 
                    : "text-[var(--color-primary)] hover:brightness-90 shadow-sm hover:shadow-md"
            )}
      >
        #{tag}
      </Button>
    )
}