import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ApplyTrack — Job search, in focus', description: 'A calm, clear workspace for tracking your job applications.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
