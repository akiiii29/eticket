'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface ValidationResult {
  message: string;
  status: 'valid' | 'invalid' | 'already_used' | 'error';
  ticket?: {
    name: string;
    checked_in_at: string;
    ticket_id?: string;
  };
}

interface ScanHistoryItem {
  ticketId: string;
  name: string;
  status: 'valid' | 'invalid' | 'already_used' | 'error';
  scannedAt: string;
}

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef<boolean>(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Load scan history for current user
    loadScanHistory();
    
    return () => {
      stopScanning();
    };
  }, []);

  const loadScanHistory = async () => {
    try {
      const response = await fetch('/api/scan-logs?type=my');
      const data = await response.json();
      
      if (data.logs) {
        const history: ScanHistoryItem[] = data.logs.map((log: any) => ({
          ticketId: log.ticket_id,
          name: log.tickets?.name || 'Unknown',
          status: log.status,
          scannedAt: log.scanned_at,
        }));
        setScanHistory(history);
      }
    } catch (err) {
      console.error('Failed to load scan history:', err);
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setResult(null);
      
      // Reset processing flag when starting a new scan
      processingRef.current = false;

      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setError('No camera found on this device');
        return;
      }

      // Try to use back camera with environment facing mode
      if (videoRef.current) {
        let stream: MediaStream;
        
        try {
          // First try to get environment-facing camera (back camera)
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' } }
          });
        } catch (err) {
          // Fallback: Try to find back camera by device ID
          const backCamera = videoInputDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          
          if (backCamera) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: backCamera.deviceId } }
            });
          } else {
            // Last fallback: use any camera with preference for environment
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' }
            });
          }
        }
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await codeReader.decodeFromVideoElement(
          videoRef.current,
          (result, error) => {
            if (result) {
              onScanSuccess(result.getText());
            }
          }
        );

        setScanning(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to start camera. Please allow camera access and use HTTPS.');
    }
  };

  const stopScanning = () => {
    // Stop the video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear the code reader reference
    codeReaderRef.current = null;
    
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Prevent multiple scans of the same QR code
    if (processingRef.current) {
      return;
    }
    
    // Set flag FIRST to block any subsequent callbacks
    processingRef.current = true;

    // Stop camera immediately to prevent more scans
    stopScanning();

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

      // Save scan log to database
      await fetch('/api/scan-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: data.status,
        }),
      });

      // Reload scan history from database to ensure consistency
      await loadScanHistory();
    } catch (err) {
      const errorResult = {
        message: '❌ Validation failed',
        status: 'error' as const,
      };
      setResult(errorResult);
      
      // Save error to database
      await fetch('/api/scan-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: 'error',
        }),
      }).catch(() => {}); // Silently fail if can't save error
      
      // Reload history
      await loadScanHistory();
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

            <video
              ref={videoRef}
              className={`w-full max-w-md rounded-lg mb-4 ${scanning ? 'block' : 'hidden'}`}
              style={{ maxHeight: '400px' }}
            />

            {error && (
              <div className="w-full max-w-md mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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

        {/* Result Modal */}
        {result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-lg shadow-2xl max-w-md w-full border-t-8 ${
              result.status === 'valid' ? 'border-green-500' :
              result.status === 'already_used' ? 'border-yellow-500' :
              'border-red-500'
            }`}>
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  {result.status === 'valid' && (
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {result.status === 'already_used' && (
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  )}
                  {(result.status === 'invalid' || result.status === 'error') && (
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Message */}
                <h3 className="text-2xl font-bold text-center mb-2 text-gray-800">
                  {result.status === 'valid' && 'Ticket Approved'}
                  {result.status === 'already_used' && 'Already Used'}
                  {result.status === 'invalid' && 'Ticket Denied'}
                  {result.status === 'error' && 'Error'}
                </h3>
                
                <p className={`text-center text-lg mb-6 ${
                  result.status === 'valid' ? 'text-green-700' :
                  result.status === 'already_used' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {result.message}
                </p>

                {/* Ticket Details */}
                {result.ticket && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guest:</span>
                      <span className="font-semibold text-gray-800">{result.ticket.name}</span>
                    </div>
                    {result.ticket.checked_in_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Checked in:</span>
                        <span className="text-sm text-gray-700">
                          {new Date(result.ticket.checked_in_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <button
                  onClick={() => {
                    setResult(null);
                    // Flag will be reset in startScanning
                    startScanning();
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
                >
                  Scan Next Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan History Table */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Scan History</h2>
              <button
                onClick={loadScanHistory}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Scanned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scanHistory.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">
                        {item.ticketId.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'valid'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'already_used'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status === 'valid' ? 'APPROVED' : 
                           item.status === 'already_used' ? 'ALREADY USED' : 
                           'DENIED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.scannedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
