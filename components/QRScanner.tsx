'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<{ id: string; name: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingRef = useRef<boolean>(false);
  const sessionRef = useRef<number>(0);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadScanHistory();
    return () => stopScanning();
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

  const stopScanning = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setScanning(false);
    } catch (e) {
      console.warn('Error stopping scan:', e);
    }
  };

  const startScanning = async () => {
    sessionRef.current++;
    const currentSession = sessionRef.current;

    stopScanning(); // cleanup
    await new Promise((r) => setTimeout(r, 100));

    processingRef.current = false;
    setError('');
    setResult(null);

    try {
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (devices.length === 0) {
        setError('No camera found on this device');
        return;
      }

      // Find back camera by label or use environment facing mode
      const backCamera = devices.find(
        (d) => /back|rear|environment/i.test(d.label)
      );

      let selectedDeviceId: string | undefined;
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      } else if (devices.length > 1) {
        // If we have multiple cameras, prefer the second one (usually back)
        selectedDeviceId = devices[1].deviceId;
      } else {
        selectedDeviceId = devices[0].deviceId;
      }

      if (!videoRef.current) return;

      // Use the decoder's method to start video which handles camera better
      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (res, err) => {
          if (sessionRef.current !== currentSession) return;
          if (res && !processingRef.current) {
            onScanSuccess(res.getText());
          }
        }
      );

      // Store the stream from the video element
      if (videoRef.current.srcObject) {
        streamRef.current = videoRef.current.srcObject as MediaStream;
      }

      setScanning(true);
      controlsRef.current = controls;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to start camera. Please allow camera access.');
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    console.log('QR Scanned:', decodedText);
    setScanning(false);

    const match = decodedText.match(/\/validate\/([a-f0-9-]+)/i);
    if (!match) {
      setResult({
        message: '❌ Invalid QR code format',
        status: 'invalid',
      });
      return;
    }

    const ticketId = match[1];

    try {
      const response = await fetch('/api/check-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId }),
      });

      const data = await response.json();

      if (!data.exists) {
        setResult({ message: '❌ Invalid ticket', status: 'invalid' });
        return;
      }

      if (data.status === 'used') {
        setResult({
          message: '⚠️ Already checked in',
          status: 'already_used',
          ticket: {
            name: data.ticket.name,
            checked_in_at: data.ticket.checked_in_at,
          },
        });
        return;
      }

      setPendingTicket({ id: ticketId, name: data.ticket.name });
      setShowConfirmation(true);
    } catch (err) {
      console.error('Check ticket error:', err);
      setResult({ message: '❌ Validation failed', status: 'error' });
    }
  };

  const handleApprove = async () => {
    if (!pendingTicket) return;
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: pendingTicket.id }),
      });
      const data = await res.json();

      if (data.status === 'valid') {
        await fetch('/api/scan-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_id: pendingTicket.id, status: data.status }),
        });
        await loadScanHistory();
      }

      setResult(data);
    } catch {
      setResult({ message: '❌ Approval failed', status: 'error' });
    }

    setShowConfirmation(false);
    setPendingTicket(null);
  };

  const handleDeny = () => {
    setResult({
      message: '❌ Ticket Denied',
      status: 'invalid',
      ticket: { name: pendingTicket?.name || 'Unknown', checked_in_at: '' },
    });
    setShowConfirmation(false);
    setPendingTicket(null);
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

  // 👇 UI giữ nguyên của bạn
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
                <p className="text-gray-600">Camera inactive</p>
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

        {/* Confirmation Dialog */}
        {showConfirmation && pendingTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border-t-8 border-blue-500">
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Message */}
                <h3 className="text-2xl font-bold text-center mb-2 text-gray-800">
                  Confirm Check-In
                </h3>
                <p className="text-center text-gray-600 mb-6">
                  Do you want to approve this ticket?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Guest Name:</span>
                    <span className="font-semibold text-gray-800 text-lg">
                      {pendingTicket.name}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition text-xl shadow-lg"
                  >
                    ✅ Approve Ticket
                  </button>
                  <button
                    onClick={handleDeny}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                  >
                    ❌ Deny
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Modal */}
        {result && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`bg-white rounded-lg shadow-2xl max-w-md w-full border-t-8 ${
                result.status === 'valid'
                  ? 'border-green-500'
                  : result.status === 'already_used'
                  ? 'border-yellow-500'
                  : 'border-red-500'
              }`}
            >
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2 text-gray-800">
                  {result.status === 'valid'
                    ? 'Ticket Approved'
                    : result.status === 'already_used'
                    ? 'Already Used'
                    : 'Ticket Denied'}
                </h3>
                <p className="mb-6 text-gray-700">{result.message}</p>
                <button
                  onClick={() => {
                    setResult(null);
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
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          APPROVED
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
