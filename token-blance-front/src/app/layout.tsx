'use client';

import { Toaster } from 'react-hot-toast';
import Web3Provider from '@/contexts/Web3Context';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>TokenBalanceX - Token Balance Tracking System</title>
        <meta name="description" content="Real-time blockchain token balance tracking and points calculation system" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50">
        <Web3Provider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}