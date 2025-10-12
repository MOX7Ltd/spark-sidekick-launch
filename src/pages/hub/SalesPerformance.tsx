import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, TrendingUp, Package, RefreshCw } from 'lucide-react';
import { AppSurface } from '@/components/layout/AppSurface';
import { BackBar } from '@/components/hub/BackBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/lib/flags';
import { useSalesSummary } from '@/hooks/sales/useSalesSummary';

export default function SalesPerformance() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!FLAGS.STRIPE_PAYMENTS_V1) {
      navigate('/hub');
      return;
    }
    loadBusinessAndOrders();
  }, []);

  const loadBusinessAndOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth/signin');
        return;
      }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (business) {
        setBusinessId(business.id);
        await loadOrders(business.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadOrders = async (bizId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading orders:', error);
    } else {
      setRecentOrders(data || []);
    }
  };

  const { data: summary } = useSalesSummary(businessId);

  const formatCurrency = (cents: number, currency: string = 'NZD') => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to process refunds.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('refund-order', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          orderId,
          reason: 'requested_by_customer',
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Refund processed",
        description: `Refund of ${formatCurrency(data.amount * 100)} has been initiated.`,
      });

      // Reload orders
      if (businessId) {
        await loadOrders(businessId);
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast({
        title: "Refund failed",
        description: error instanceof Error ? error.message : "Unable to process refund.",
        variant: "destructive",
      });
    }
  };

  if (!FLAGS.STRIPE_PAYMENTS_V1) {
    return null;
  }

  return (
    <AppSurface>
      <BackBar to="/hub" label="Back to Hub" />
      
      <div className="mx-auto mt-6 max-w-screen-xl space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Performance</h1>
          <p className="text-muted-foreground">Track your revenue and orders</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{summary?.orders || 0}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gross Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Math.round((summary?.gross_revenue || 0) * 100))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Fees</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(Math.round((summary?.platform_fees || 0) * 100))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Payout</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(Math.round((summary?.net_payout || 0) * 100))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          
          {isLoadingOrders ? (
            <p className="text-center text-muted-foreground py-8">Loading orders...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee (15%)</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{order.customer_email || 'Guest'}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.amount_total, order.currency)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        -{formatCurrency(order.platform_fee, order.currency)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(order.net_amount, order.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefund(order.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Fee Breakdown Info */}
        <Card className="p-6 bg-muted">
          <h3 className="font-semibold mb-2">Platform Fee Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            SideHive retains 15% of each sale to cover Stripe processing fees, currency conversion, 
            platform maintenance, and customer support. The remaining 85% is transferred to your 
            Stripe Connect account within 2-7 business days.
          </p>
        </Card>
      </div>
    </AppSurface>
  );
}
