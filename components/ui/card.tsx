import { View, type ViewProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva('rounded-lg overflow-hidden bg-card', {
  variants: {
    variant: {
      default: '',
      elevated: 'shadow-md',
      outline: 'border border-border',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface CardProps extends ViewProps, VariantProps<typeof cardVariants> {
  animated?: boolean;
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  animated = true,
  style,
  className,
  ...props
}: CardProps) {
  const cardClassName = cn(cardVariants({ variant }), className);

  if (animated) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        className={cardClassName}
        style={style}
        {...props}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <View className={cardClassName} style={style} {...props}>
      {children}
    </View>
  );
}

interface CardHeaderProps extends ViewProps {
  className?: string;
}

export function CardHeader({ children, style, className, ...props }: CardHeaderProps) {
  return (
    <View className={cn('p-4 pb-2', className)} style={style} {...props}>
      {children}
    </View>
  );
}

interface CardContentProps extends ViewProps {
  className?: string;
}

export function CardContent({ children, style, className, ...props }: CardContentProps) {
  return (
    <View className={cn('p-4 pt-0', className)} style={style} {...props}>
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  className?: string;
}

export function CardFooter({ children, style, className, ...props }: CardFooterProps) {
  return (
    <View className={cn('p-4 pt-2 flex-row justify-end gap-2', className)} style={style} {...props}>
      {children}
    </View>
  );
}
