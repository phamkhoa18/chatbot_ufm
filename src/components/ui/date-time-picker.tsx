'use client';

import * as React from 'react';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DateTimePicker({ date, setDate, className }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  // Extract time from current date
  const [time, setTime] = React.useState<string>(
    date ? format(date, 'HH:mm') : '00:00'
  );

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setTime(format(date, 'HH:mm'));
    }
  }, [date]);

  const handleSelectDate = (newDate: Date | undefined) => {
    if (newDate) {
      const parsedTime = time.split(':');
      if (parsedTime.length === 2) {
        newDate.setHours(parseInt(parsedTime[0], 10));
        newDate.setMinutes(parseInt(parsedTime[1], 10));
      }
      setSelectedDate(newDate);
      setDate(newDate);
    } else {
      setSelectedDate(undefined);
      setDate(undefined);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (selectedDate && newTime) {
      const parsedTime = newTime.split(':');
      if (parsedTime.length === 2) {
        const updatedDate = new Date(selectedDate);
        updatedDate.setHours(parseInt(parsedTime[0], 10));
        updatedDate.setMinutes(parseInt(parsedTime[1], 10));
        setDate(updatedDate);
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            'w-full justify-start text-left font-normal border-slate-200 h-10 px-3 rounded-lg',
            !date && 'text-slate-400',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
          {date ? format(date, 'dd/MM/yyyy - HH:mm') : <span>Chọn ngày giờ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[280px] p-0 border-slate-200 rounded-xl overflow-hidden" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelectDate}
          initialFocus
          // captionLayout="dropdown-buttons"
          className="rounded-t-xl"
        />
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500 ml-1 shrink-0" />
            <span className="text-xs font-medium text-slate-600">Giờ xuất bản</span>
            <Input
              type="time"
              className="ml-auto w-[120px] h-8 text-sm bg-white border-slate-200"
              value={time}
              onChange={handleTimeChange}
              disabled={!selectedDate}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
