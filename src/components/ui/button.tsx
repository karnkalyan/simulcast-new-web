import * as React from 'react';import {Slot} from '@radix-ui/react-slot';import {cva,type VariantProps} from 'class-variance-authority';import {cn} from '@/lib/utils';
const buttonVariants=cva('s4-ui-button',{variants:{variant:{default:'s4-ui-button-primary',outline:'s4-ui-button-outline',ghost:'s4-ui-button-ghost'},size:{default:'s4-ui-button-md',sm:'s4-ui-button-sm',lg:'s4-ui-button-lg'}},defaultVariants:{variant:'default',size:'default'}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export function Button({className,variant,size,asChild=false,...props}:ButtonProps){const Component=asChild?Slot:'button';return <Component className={cn(buttonVariants({variant,size,className}))} {...props}/>}
