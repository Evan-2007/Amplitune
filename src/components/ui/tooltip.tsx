'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>,
    'delayDuration'
  > {
  delayDuration?: number;
  ref?: React.ForwardedRef<React.ElementRef<typeof TooltipPrimitive.Root>>;
}

const Tooltip = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Root>,
  TooltipProps
>(({ children, delayDuration = 0, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [forceOpen, setForceOpen] = React.useState(false);

  const handlePointerDown = React.useCallback(() => {
    setForceOpen(true);
    setOpen(true);
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    setForceOpen(false);
    setOpen(false);
  }, []);

  return (
    <TooltipPrimitive.Root
      // @ts-ignore
      ref={ref}
      delayDuration={delayDuration}
      open={open || forceOpen}
      onOpenChange={(newOpen: boolean) => {
        if (!forceOpen) {
          setOpen(newOpen);
        }
      }}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onPointerDown: (e: React.PointerEvent) => {
              handlePointerDown();
              if (child.props.onPointerDown) child.props.onPointerDown(e);
            },
            onPointerLeave: (e: React.PointerEvent) => {
              handlePointerLeave();
              if (child.props.onPointerLeave) child.props.onPointerLeave(e);
            },
          } as React.HTMLAttributes<HTMLElement>);
        }
        return child;
      })}
    </TooltipPrimitive.Root>
  );
});
Tooltip.displayName = TooltipPrimitive.Root.displayName;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
