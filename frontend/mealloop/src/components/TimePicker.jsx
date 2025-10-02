import React, { useState, useEffect } from 'react';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import { format, parseISO, setHours, setMinutes } from 'date-fns';

const TimePicker = ({ value, onChange, label, minTime }) => {
  const [time, setTime] = useState(value ? parseISO(value) : new Date());
  const [showClock, setShowClock] = useState(false);

  useEffect(() => {
    if (value) {
      setTime(parseISO(value));
    }
  }, [value]);

  const handleTimeChange = (newTime) => {
    setTime(newTime);
    const formattedTime = format(newTime, "yyyy-MM-dd'T'HH:mm");
    onChange(formattedTime);
  };

  const handleHourChange = (e) => {
    const newTime = setHours(time, parseInt(e.target.value) || 0);
    handleTimeChange(newTime);
  };

  const handleMinuteChange = (e) => {
    const newTime = setMinutes(time, parseInt(e.target.value) || 0);
    handleTimeChange(newTime);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={format(time, 'hh:mm a')}
          onClick={() => setShowClock(!showClock)}
          className="input w-full cursor-pointer"
        />
        {showClock && (
          <div className="absolute z-10 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <Clock
                  value={time}
                  onChange={handleTimeChange}
                  renderNumbers={true}
                  size={150}
                  className="react-clock"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <label className="text-sm text-gray-500 mb-1">Hour</label>
                  <select
                    value={time.getHours()}
                    onChange={handleHourChange}
                    className="input text-center w-16"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-sm text-gray-500 mb-1">Minute</label>
                  <select
                    value={time.getMinutes()}
                    onChange={handleMinuteChange}
                    className="input text-center w-16"
                  >
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                      <option key={minute} value={minute}>
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClock(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker;
