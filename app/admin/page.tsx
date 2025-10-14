import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/scanner');
  }

  return <AdminDashboard />;
}

