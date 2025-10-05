import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Eye, EyeOff, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  format?: string;
  price?: number;
  visible: boolean;
  asset_status?: string;
  onEdit: (id: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
}

export const ProductCard = ({
  id,
  title,
  description,
  format,
  price,
  visible,
  asset_status,
  onEdit,
  onToggleVisible,
}: ProductCardProps) => {
  const getAssetStatusBadge = () => {
    if (!asset_status) return null;
    
    if (asset_status === 'pending') {
      return (
        <Badge variant="secondary" className="shrink-0 text-xs gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating...
        </Badge>
      );
    }
    
    if (asset_status === 'ready') {
      return (
        <Badge variant="default" className="shrink-0 text-xs gap-1">
          <FileText className="h-3 w-3" />
          Ready
        </Badge>
      );
    }
    
    if (asset_status === 'failed') {
      return (
        <Badge variant="destructive" className="shrink-0 text-xs gap-1">
          <AlertCircle className="h-3 w-3" />
          Retry
        </Badge>
      );
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="flex-1 pt-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          <div className="flex flex-col gap-1">
            {format && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {format}
              </Badge>
            )}
            {getAssetStatusBadge()}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {description}
        </p>
        {price !== undefined && price > 0 && (
          <p className="text-sm font-medium text-primary">
            ${price.toFixed(2)}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Switch
            checked={visible}
            onCheckedChange={(checked) => onToggleVisible(id, checked)}
            id={`visible-${id}`}
          />
          <label
            htmlFor={`visible-${id}`}
            className="text-sm cursor-pointer flex items-center gap-1.5"
          >
            {visible ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>On shopfront</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hidden</span>
              </>
            )}
          </label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(id)}
          className="gap-1.5"
        >
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};
