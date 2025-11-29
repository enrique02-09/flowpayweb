import React from 'react'

type Props = { name: string; className?: string }

export default function Icon({ name, className = '' }: Props) {
  const base = `inline-block ${className}`

  switch (name) {
    case 'chartBar':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="11" width="3" height="9" rx="1" fill="currentColor" />
          <rect x="9" y="6" width="3" height="14" rx="1" fill="currentColor" />
          <rect x="15" y="3" width="3" height="17" rx="1" fill="currentColor" />
        </svg>
      )
    case 'users':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11z" fill="currentColor" />
          <path d="M6 11c1.657 0 3-1.567 3-3.5S7.657 4 6 4 3 5.567 3 7.5 4.343 11 6 11z" fill="currentColor" />
          <path d="M2 20.5c0-2.485 2.691-4.5 6-4.5s6 2.015 6 4.5v.5H2v-.5z" fill="currentColor" opacity="0.9" />
        </svg>
      )
    case 'creditCard':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="3" y="9" width="6" height="2" rx="0.5" fill="currentColor" />
        </svg>
      )
    case 'bill':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M8 7h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M8 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'cog':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 17.88l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.88 2.3l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c.12.46.46.86 1 .98h.24a1.65 1.65 0 0 0 1.51-1.51z" stroke="currentColor" strokeWidth="0.6" fill="none" />
        </svg>
      )
    case 'bell':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 17H9a3 3 0 0 1-3-3v-3a6 6 0 0 1 12 0v3a3 3 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'chartLine':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 14l3-3 4 4 5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'home':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 11.5v7.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'user':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M3 21a9 9 0 0 1 18 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      )
    case 'swap':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3v6h-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 21v-6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'grid':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      )
    case 'search':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      )
    case 'refresh':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12a9 9 0 1 0-3.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'download':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="19" width="18" height="2" rx="1" fill="currentColor" />
        </svg>
      )
    case 'close':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'lock':
      return (
        <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    default:
      return <svg className={base} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" fill="currentColor" /></svg>
  }
}
