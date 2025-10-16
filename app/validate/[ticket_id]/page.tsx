import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ValidateTicketClient from '@/components/ValidateTicketClient';

export default async function ValidatePage({
  params,
}: {
  params: Promise<{ ticket_id: string }>;
}) {
  const { ticket_id } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_id', ticket_id)
    .single();

  if (!ticket) {
    notFound();
  }

  // Check if user is authenticated and get their role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    userRole = profile?.role;
  }
  if (!user) {
    notFound();
  }
  return (
    <ValidateTicketClient 
      ticket={ticket} 
      userRole={userRole}
      isAuthenticated={!!user}
    />
  );
}

