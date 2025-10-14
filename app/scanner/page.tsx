import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import QRScanner from '@/components/QRScanner';

export default async function ScannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/login');
  }

  return <QRScanner />;
}

