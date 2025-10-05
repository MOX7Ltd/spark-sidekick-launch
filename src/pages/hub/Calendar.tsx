import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from '@/components/hub/SectionHeader';
import { EmptyState } from '@/components/hub/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { listEvents, createEvent, updateEvent, deleteEvent, type CalendarEvent, type CreateEventData } from '@/lib/db/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    type: 'other',
    start_at: '',
    end_at: '',
    location_url: '',
    price: undefined,
    product_id: undefined
  });

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const data = await listEvents(user.id, start, end);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Failed to load events",
        description: "Could not load calendar events.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'other',
      start_at: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
      end_at: '',
      location_url: '',
      price: undefined,
      product_id: undefined
    });
    setShowModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      start_at: event.start_at.slice(0, 16),
      end_at: event.end_at?.slice(0, 16) || '',
      location_url: event.location_url || '',
      price: event.price,
      product_id: event.product_id
    });
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.start_at) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        toast({ title: "Event updated", description: "Your event has been updated." });
      } else {
        await createEvent(user.id, formData);
        toast({ title: "Event created", description: "Your event has been added." });
      }

      await loadEvents();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Save failed",
        description: "Could not save the event.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      await loadEvents();
      setShowModal(false);
      toast({ title: "Event deleted", description: "The event has been removed." });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the event.",
        variant: "destructive"
      });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_at), day));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Calendar"
        subtitle="Plan sessions, workshops, and classes."
        primaryAction={{
          label: 'Add Event',
          icon: Plus,
          onClick: handleCreateEvent
        }}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No events scheduled"
          description="Create your first event to start scheduling with customers."
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                Previous
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                Next
              </Button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {monthDays.map(day => {
                const dayEvents = getEventsForDay(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      handleCreateEvent();
                    }}
                    className="min-h-20 p-2 border rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                    {dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        className="w-full text-xs bg-primary/10 text-primary rounded px-1 py-0.5 mb-1 truncate text-left hover:bg-primary/20"
                      >
                        {event.title}
                      </button>
                    ))}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">One-on-One</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location URL</Label>
              <Input
                value={formData.location_url}
                onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="hero"
                onClick={handleSaveEvent}
                disabled={!formData.title || !formData.start_at || isSaving}
                className="flex-1"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              {editingEvent && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
