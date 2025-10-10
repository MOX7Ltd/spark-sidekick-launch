import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function AnalyticsChart({ data }: { data: Array<{ type: string; created_at: string }> }) {
  // Group events by date and type
  const grouped = Object.values(
    data.reduce((acc: any, e: any) => {
      const date = e.created_at.slice(0, 10); // YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = { date, view: 0, message: 0, review: 0 };
      }
      if (e.type === 'view') acc[date].view++;
      if (e.type === 'message_click') acc[date].message++;
      if (e.type === 'review_submit') acc[date].review++;
      return acc;
    }, {})
  ).sort((a: any, b: any) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={grouped}>
        <XAxis 
          dataKey="date" 
          fontSize={12}
          tickFormatter={(value) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis fontSize={12} />
        <Tooltip 
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="view" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          name="Views"
        />
        <Line 
          type="monotone" 
          dataKey="message" 
          stroke="hsl(var(--accent))" 
          strokeWidth={2}
          name="Messages"
        />
        <Line 
          type="monotone" 
          dataKey="review" 
          stroke="hsl(var(--chart-2))" 
          strokeWidth={2}
          name="Reviews"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
