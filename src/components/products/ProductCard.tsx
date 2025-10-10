import { motion } from 'framer-motion';
import { Edit, Share2, Copy, MoreVertical, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPrice, getStatusColor, getStatusLabel, type ProductStatus } from '@/lib/products';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  title: string;
  status: ProductStatus;
  family?: string;
  price?: number;
  priceHigh?: number;
  priceModel?: string;
  isNew?: boolean;
  onTogglePublish: (id: string, newStatus: ProductStatus) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({
  id,
  title,
  status,
  family,
  price,
  priceHigh,
  priceModel = 'one-off',
  isNew = false,
  onTogglePublish,
  onDuplicate,
  onDelete,
}: ProductCardProps) {
  const navigate = useNavigate();

  const handleShare = () => {
    const url = `${window.location.origin}/shopfront/product/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleToggle = () => {
    const newStatus: ProductStatus = status === 'published' ? 'draft' : 'published';
    onTogglePublish(id, newStatus);
  };

  const midPrice = price || 0;
  const revenueHint = `Sell 10 @ £${midPrice} → ~£${midPrice * 10}/mo`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-md bg-white/75 border border-white/30 shadow-lg rounded-xl p-4 transition-all ${
        isNew ? 'ring-2 ring-[hsl(var(--sh-cta-from))]/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate mb-1">{title}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </span>
            {family && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {family}
              </span>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDuplicate(id)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {price && (
        <div className="mb-3">
          <p className="text-sm text-muted-foreground">
            {formatPrice(price, priceHigh)} • {priceModel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{revenueHint}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Switch checked={status === 'published'} onCheckedChange={handleToggle} />
          <span className="text-sm text-muted-foreground">
            {status === 'published' ? 'Published' : 'Publish'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/hub/products/edit/${id}`)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
