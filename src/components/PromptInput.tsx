import { useRef, useCallback } from 'react';

interface Props {
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}

const measureCanvas = document.createElement('canvas');
const measureCtx = measureCanvas.getContext('2d')!;

function getAvailableWidth(input: HTMLInputElement): number {
  const style = getComputedStyle(input);
  measureCtx.font = style.font || `${style.fontSize} ${style.fontFamily}`;
  return input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

export function PromptInput({ value, readOnly, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      let val = input.value;
      const available = getAvailableWidth(input);
      while (val.length > 0 && measureCtx.measureText(val).width > available) {
        val = val.slice(0, -1);
      }
      onChange(val);
    },
    [onChange]
  );

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      readOnly={readOnly}
      onChange={handleInput}
    />
  );
}
