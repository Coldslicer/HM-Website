/* ================ [ IMPORTS ] ================ */

// React components
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

// Utility functions
import { cn } from "../../lib/utility";

/* ================ [ COMPONENT ] ================ */

// Label variants
const labelVariants = cva(
  "text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      weight: {
        normal: "font-medium",
        bold: "font-bold",
      },
    },
    defaultVariants: {
      weight: "normal",
    },
  }
);


// Label component
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

/* ================ [ EXPORTS ] ================ */

export { Label };
