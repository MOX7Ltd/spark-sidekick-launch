import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  type: 'one_on_one' | 'workshop' | 'class' | 'other';
  start_at: string;
  end_at?: string;
  location_url?: string;
  price?: number;
  product_id?: string;
  created_at: string;
}

export interface CreateEventData {
  title: string;
  type: 'one_on_one' | 'workshop' | 'class' | 'other';
  start_at: string;
  end_at?: string;
  location_url?: string;
  price?: number;
  product_id?: string;
}

export async function listEvents(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarEvent[]> {
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_at', { ascending: true });

  if (startDate) {
    query = query.gte('start_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('start_at', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CalendarEvent[];
}

export async function createEvent(
  userId: string,
  eventData: CreateEventData
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: userId,
      ...eventData
    })
    .select()
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventData>
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}
