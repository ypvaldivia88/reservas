"use client";
import { useState, useEffect } from "react";

interface TimePickerInputProps {
  value: string; // Comma-separated times like "08:30, 10:30, 14:00"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TimePickerInput({ value, onChange, placeholder, className }: TimePickerInputProps) {
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    // Parse the comma-separated value into an array
    if (value) {
      const parsedTimes = value.split(",").map(t => t.trim()).filter(t => t.length > 0);
      setTimes(parsedTimes);
    } else {
      setTimes([]);
    }
  }, [value]);

  const addTime = () => {
    if (newTime && !times.includes(newTime)) {
      const updatedTimes = [...times, newTime].sort();
      setTimes(updatedTimes);
      onChange(updatedTimes.join(", "));
      setNewTime("");
    }
  };

  const removeTime = (timeToRemove: string) => {
    const updatedTimes = times.filter(t => t !== timeToRemove);
    setTimes(updatedTimes);
    onChange(updatedTimes.join(", "));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTime();
    }
  };

  return (
    <div className={className}>
      {/* Display selected times as chips */}
      {times.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {times.map((time) => (
            <span
              key={time}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {time}
              <button
                type="button"
                onClick={() => removeTime(time)}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                aria-label={`Eliminar ${time}`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input for adding new time */}
      <div className="flex gap-2">
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={addTime}
          disabled={!newTime}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors whitespace-nowrap"
        >
          + Agregar
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Use el selector de hora arriba para agregar horarios. Haga clic en × para eliminar.
      </p>
    </div>
  );
}
