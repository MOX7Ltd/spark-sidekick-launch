import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  format?: string;
  price?: number;
  visible: boolean;
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
  onEdit,
  onToggleVisible,
}: ProductCardProps) => {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="flex-1 pt-6">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          {format && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {format}
            </Badge>
          )}
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
