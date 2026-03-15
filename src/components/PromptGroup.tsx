import { PromptInput } from './PromptInput';

interface Props {
  label: string;
  values: string[];
  readOnly: boolean;
  numbered: boolean;
  onFieldChange: (index: number, value: string) => void;
}

export function PromptGroup({ label, values, readOnly, numbered, onFieldChange }: Props) {
  return (
    <div className="prompt">
      <div className="prompt-label">{label}</div>
      {values.map((val, i) => (
        <div key={i} className={numbered ? 'prompt-line' : 'prompt-single'}>
          {numbered && <span className="num">{i + 1}.</span>}
          <PromptInput
            value={val}
            readOnly={readOnly}
            onChange={(v) => onFieldChange(i, v)}
          />
        </div>
      ))}
    </div>
  );
}
