import { type FC } from 'react'
import { useAppVersion } from '../hooks/useElectronAPI'
import { IconButton } from './ui/IconButton'
import { Skeleton } from './ui/Skeleton'

export interface WelcomeScreenProps {
  onSettingsClick?: () => void
}

export const WelcomeScreen: FC<WelcomeScreenProps> = ({ onSettingsClick }) => {
  const { version, error } = useAppVersion()

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-bg-primary">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">
          AI CLI Studio
        </h1>
        <IconButton
          label="Settings"
          onClick={onSettingsClick}
          className="ml-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </IconButton>
      </div>

      {/* Version badge */}
      <div className="mb-8">
        {version ? (
          <span className="px-3 py-1 text-xs rounded-full border border-border-default text-text-secondary">
            v{version}
          </span>
        ) : error ? (
          <span className="px-3 py-1 text-xs rounded-full border border-status-error text-status-error">
            Version unavailable
          </span>
        ) : (
          <Skeleton className="w-20 h-5 rounded-full" />
        )}
      </div>

      {/* TaskTray placeholder */}
      <div className="w-full max-w-lg p-4 border border-border-default rounded-lg bg-bg-secondary">
        <p className="text-center text-text-faint text-sm">
          TaskTray — coming soon
        </p>
      </div>

      {/* Footer hints */}
      <p className="mt-12 text-xs text-text-faint">
        Press <code className="px-1 py-0.5 rounded bg-bg-secondary text-code-text">Ctrl+Shift+P</code> to open command palette
      </p>
    </div>
  )
}
