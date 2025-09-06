import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Web3 Quest Platform Variants
        quest: "bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:from-neon-blue/90 hover:to-neon-purple/90 shadow-lg hover:shadow-xl hover:shadow-neon-blue/25 transform hover:scale-105 transition-all duration-300",
        hero: "bg-gradient-to-r from-neon-cyan to-neon-green text-background font-bold text-lg px-8 py-4 rounded-xl hover:from-neon-cyan/90 hover:to-neon-green/90 shadow-2xl hover:shadow-neon-cyan/30 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300",
        glass: "glass border-neon-blue/30 text-foreground hover:border-neon-blue/50 hover:bg-neon-blue/10 backdrop-blur-lg",
        glow: "bg-neon-purple/20 border border-neon-purple/50 text-neon-purple hover:bg-neon-purple/30 hover:text-white hover:shadow-lg hover:shadow-neon-purple/50 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 px-12 text-lg rounded-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
