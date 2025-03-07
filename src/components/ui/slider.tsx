'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className='relative h-[6px] w-full grow overflow-hidden rounded-full bg-secondary transition-all duration-300 md:hover:h-[16px]'>
      <SliderPrimitive.Range className='absolute h-full bg-primary' />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
