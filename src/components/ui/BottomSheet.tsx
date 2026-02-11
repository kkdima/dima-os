import type { ReactNode } from 'react';
import { useEffect } from 'react';

export function BottomSheet({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-xl rounded-t-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#171718]/95 shadow-[0_-20px_60px_rgba(0,0,0,0.35)]">
          <div className="px-4 pt-3">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-black/10 dark:bg-white/10" />
            {(title || description) && (
              <div className="mt-3">
                {title && <div className="text-base font-semibold tracking-tight">{title}</div>}
                {description && (
                  <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{description}</div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-4">{children}</div>

          {footer && (
            <div className="px-4 pb-5 pt-0 border-t border-black/5 dark:border-white/10">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
