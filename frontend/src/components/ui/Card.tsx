// src/ui/Card.tsx
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

// Inline cheesy `cn()` utility (clsx + tailwind-merge baked-in clone)
function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-2xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900 p-4",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
);

Card.displayName = "Card";
