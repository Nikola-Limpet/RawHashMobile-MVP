import { forwardRef } from 'react';
import {
  Pressable,
  ActivityIndicator,
  Text,
  type PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md gap-2',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'bg-transparent border border-border',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive',
      },
      size: {
        sm: 'py-1.5 px-2.5 min-h-[32px]',
        md: 'py-2.5 px-4 min-h-[44px]',
        lg: 'py-4 px-6 min-h-[52px]',
        icon: 'w-10 h-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const buttonTextVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-destructive-foreground',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      className,
      textClassName,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    const isDisabled = disabled || loading;

    return (
      <AnimatedPressable
        ref={ref}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          buttonVariants({ variant, size }),
          isDisabled && 'opacity-50',
          className
        )}
        style={[animatedStyle, style]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === 'outline' || variant === 'ghost'
                ? '#0a0a0a'
                : '#ffffff'
            }
          />
        ) : typeof children === 'string' ? (
          <Text
            className={cn(buttonTextVariants({ variant, size }), textClassName)}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </AnimatedPressable>
    );
  }
);

Button.displayName = 'Button';
