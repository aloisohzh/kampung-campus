'use client';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { towns, type Town } from '@/lib/towns';

export function TownSelector({
  value,
  disabled,
  onChange,
  label = 'Choose your town',
}: {
  value: Town;
  disabled?: boolean;
  onChange: (town: Town) => void;
  label?: string;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(town) => {
        if (town) onChange(town as Town);
      }}
    >
      <SelectTrigger className="town-selector" aria-label={label}>
        <MapPin size={16} />
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {towns.map((town) => (
          <SelectItem value={town} key={town}>
            {town}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
