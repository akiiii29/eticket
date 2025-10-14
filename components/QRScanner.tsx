'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ValidationResult {
  message: string;
  status: 'valid' | 'invalid' | 'already_used' | 'error';
  ticket?: {
    name: string;
    checked_in_at: string;
  };
}

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setResult(null);

      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {}
      );

      setScanning(true);
    } catch (err) {
      setError('Failed to start camera. Please allow camera access.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning temporarily
    await stopScanning();

    // Extract ticket_id from URL
    const match = decodedText.match(/\/validate\/([a-f0-9-]+)/i);
    if (!match) {
      setResult({
        message: '❌ Invalid QR code format',
        status: 'invalid',
      });
      return;
    }

    const ticketId = match[1];

    // Validate ticket
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticket_id: ticketId }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({
        message: '❌ Validation failed',
        status: 'error',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getResultColor = () => {
    switch (result?.status) {
      case 'valid':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'already_used':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'invalid':
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">QR Scanner</h1>
              <p className="text-gray-600 mt-1">Scan tickets to check in</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col items-center">
            <div
              id="qr-reader"
              className={`w-full max-w-md ${scanning ? 'block' : 'hidden'}`}
            ></div>

            {!scanning && (
              <div className="w-full max-w-md h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-600">Camera inactive</p>
                </div>
              </div>
            )}

            {error && (
              <div className="w-full mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={scanning ? stopScanning : startScanning}
              className={`w-full max-w-md py-3 rounded-lg font-semibold transition ${
                scanning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {scanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg shadow-md p-6 border-l-4 ${getResultColor()}`}
          >
            <h3 className="text-2xl font-bold mb-2">{result.message}</h3>
            {result.ticket && (
              <div className="mt-4 space-y-2">
                <p className="text-lg">
                  <span className="font-semibold">Guest:</span> {result.ticket.name}
                </p>
                {result.ticket.checked_in_at && (
                  <p className="text-sm">
                    <span className="font-semibold">Checked in at:</span>{' '}
                    {new Date(result.ticket.checked_in_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setResult(null);
                startScanning();
              }}
              className="mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

