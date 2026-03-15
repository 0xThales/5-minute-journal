import { useApp } from '../contexts/AppContext';
import { t } from '../lib/i18n';
import { getToday } from '../lib/dates';
import { PromptGroup } from './PromptGroup';

interface PromptConfig {
  field: string;
  labelKey: 'grateful' | 'great' | 'affirmation' | 'amazing' | 'better';
  count: number;
  numbered: boolean;
}

interface Props {
  section: 'morning' | 'evening';
  prompts: PromptConfig[];
  onFieldChange: (section: 'morning' | 'evening', field: string, index: number, value: string) => void;
}

export function JournalSection({ section, prompts, onFieldChange }: Props) {
  const { state } = useApp();
  const isToday = state.currentDate === getToday();
  const icon = section === 'morning' ? '☼' : '☽';
  const iconClass = section === 'morning' ? 'icon-sun' : 'icon-moon';

  return (
    <section className="section" id={section}>
      <div className="section-header">
        <span className={`section-icon ${iconClass}`}>{icon}</span>
        <h2>{t(state.lang, section)}</h2>
      </div>
      {prompts.map((p) => (
        <PromptGroup
          key={p.field}
          label={t(state.lang, p.labelKey)}
          values={(state.entry[section] as any)[p.field] || Array(p.count).fill('')}
          readOnly={!isToday}
          numbered={p.numbered}
          onFieldChange={(index, value) => onFieldChange(section, p.field, index, value)}
        />
      ))}
    </section>
  );
}
