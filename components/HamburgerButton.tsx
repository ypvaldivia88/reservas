"use client";

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export default function HamburgerButton({
  isOpen,
  onClick,
  ariaLabel = "Abrir menú",
  className = "",
}: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 backdrop-blur-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${className}`}
      aria-label={isOpen ? "Cerrar menú" : ariaLabel}
      aria-expanded={isOpen}
    >
      <span className="sr-only">{isOpen ? "Cerrar menú" : ariaLabel}</span>
      <div className="w-5 h-4 relative" aria-hidden="true">
        <span
          className={`absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
          }`}
        />
        <span
          className={`absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
          }`}
        />
      </div>
    </button>
  );
}
