"use client";

import { cn } from "@/lib/utils";

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  wrapperClassName?: string;
}

export function IconInput({
  icon,
  trailing,
  className,
  wrapperClassName,
  ...props
}: IconInputProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <input
        className={cn(
          "input-field input-field-with-icon",
          trailing && "input-field-with-trailing",
          className
        )}
        {...props}
      />
      <span className="input-leading-icon" aria-hidden>
        {icon}
      </span>
      {trailing ? (
        <span className="input-trailing-slot" aria-hidden>
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export function SearchInput({
  className,
  wrapperClassName,
  ...props
}: Omit<IconInputProps, "icon">) {
  return (
    <IconInput
      type="search"
      icon={
        <svg
          className="size-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      className={className}
      wrapperClassName={wrapperClassName}
      {...props}
    />
  );
}
