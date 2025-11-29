import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { getCachedUserProfile } from '@/utils/profileCache';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use cached profile lookup for faster page load
  const role = await getCachedUserProfile(user.id);

  if (role !== 'admin') {
    redirect('/scanner');
  }

  return <AdminDashboard />;
}

