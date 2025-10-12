import * as React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Star, MessageSquare, X, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";

interface CustomerDetailDrawerProps {
  businessId: string;
  customerEmail: string | null;
  open: boolean;
  onClose: () => void;
}

export function CustomerDetailDrawer({
  businessId,
  customerEmail,
  open,
  onClose,
}: CustomerDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['customerProfile', businessId, customerEmail],
    enabled: open && !!customerEmail && !!businessId,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('get-customer-profile', {
        body: {
          business_id: businessId,
          customer_email: customerEmail,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.error) throw res.error;
      return res.data;
    },
  });

  const summary = data?.summary || {
    total_orders: 0,
    total_spent: '0.00',
    avg_rating: '0.0',
    total_reviews: 0,
    total_messages: 0,
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] md:max-h-[85vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="border-b sticky top-0 bg-background z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DrawerTitle className="text-xl font-bold">
                  {customerEmail || 'Customer Profile'}
                </DrawerTitle>
                <DrawerDescription className="mt-2">
                  Complete customer interaction history
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-bold">{summary.total_orders}</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold">${summary.total_spent}</div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <Star className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                  <div className="text-lg font-bold">{summary.avg_rating}</div>
                  <div className="text-xs text-muted-foreground">Avg Rating</div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-3 text-center">
                  <MessageSquare className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold">{summary.total_messages}</div>
                  <div className="text-xs text-muted-foreground">Messages</div>
                </CardContent>
              </Card>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading customer profile...
              </div>
            ) : (
              <>
                {/* Purchase History */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Purchase History</h3>
                  </div>
                  {data?.orders?.length > 0 ? (
                    <div className="space-y-2">
                      {data.orders.map((order: any) => (
                        <Card key={order.id} className="bg-card">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {order.products?.title || 'Product'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(order.created_at), 'PPp')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">
                                  ${(order.amount_total / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.currency || 'NZD'}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-muted/30">
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        No orders yet
                      </CardContent>
                    </Card>
                  )}
                </section>

                <Separator />

                {/* Reviews */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold">Reviews</h3>
                  </div>
                  {data?.reviews?.length > 0 ? (
                    <div className="space-y-3">
                      {data.reviews.map((review: any) => (
                        <Card key={review.id} className="bg-card">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(review.created_at), 'PP')}
                              </div>
                            </div>
                            {review.title && (
                              <div className="font-medium mb-1">{review.title}</div>
                            )}
                            {review.body && (
                              <div className="text-sm text-muted-foreground">
                                {review.body}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-muted/30">
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        No reviews yet
                      </CardContent>
                    </Card>
                  )}
                </section>

                <Separator />

                {/* Messages */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Messages</h3>
                  </div>
                  {data?.messages?.length > 0 ? (
                    <div className="space-y-2">
                      {data.messages.map((message: any) => (
                        <Card key={message.id} className="bg-card">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">
                                {message.customer_name || 'Customer'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(message.created_at), 'PP')}
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="inline-block px-2 py-1 rounded-md bg-muted text-xs">
                                {message.topic || 'general'}
                              </span>
                              <span className="ml-2 text-muted-foreground">
                                {message.status}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-muted/30">
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        No messages yet
                      </CardContent>
                    </Card>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
