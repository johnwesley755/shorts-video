import * as React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps {
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, min = 0, max = 100, step = 1, onValueChange, className, disabled }, ref) => {
    const currentValue = value[0] ?? min;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (onValueChange) {
        onValueChange([val]);
      }
    };

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
export default Slider;
