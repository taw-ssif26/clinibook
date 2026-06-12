"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CardElement = HTMLDivElement;
type CardProps = React.HTMLAttributes<HTMLDivElement>;

const CardComponent = React.forwardRef<CardElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
CardComponent.displayName = "Card";

const CardHeader = React.forwardRef<CardElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "Card.Header";

const CardContent = React.forwardRef<CardElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "Card.Content";

const CardFooter = React.forwardRef<CardElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "Card.Footer";

interface CardType extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<CardElement>> {
  Header: typeof CardHeader;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
}

const Card = Object.assign(CardComponent, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
}) as CardType;

export { Card, CardHeader, CardContent, CardFooter };