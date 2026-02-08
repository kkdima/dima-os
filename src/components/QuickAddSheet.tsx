import { useState } from 'react';

const commands = [
  {
    command: 'inbox:',
    description: 'Quick capture',
    example: 'inbox: Call dentist tomorrow',
  },
  {
    command: 'buy:',
    description: 'Shopping list',
    example: 'buy: Oat milk, bananas',
  },
  {
    command: 'trade:',
    description: 'Trade idea',
    example: 'trade: AAPL long @ 180',
  },
  {
    command: 'debrief:',
    description: 'End of day',
    example: 'debrief: Good focus, hit goals',
  },
];

export function QuickAddSheet() {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform z-20"
        aria-label="Quick Add"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white dark:bg-[#2c2c2e] rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />

          <h3 className="text-lg font-semibold mb-4">Telegram Commands</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Copy and send to your Telegram bot
          </p>

          <div className="flex flex-col gap-3">
            {commands.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => handleCopy(cmd.command)}
                className="bg-gray-100 dark:bg-[#3a3a3c] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between mb-1">
                  <code className="text-blue-500 font-mono font-semibold">{cmd.command}</code>
                  <span className="text-xs text-gray-400">Tap to copy</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{cmd.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{cmd.example}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-6 py-3 bg-gray-100 dark:bg-[#3a3a3c] rounded-xl font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
