import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../lib/i18n';
import { setMeta } from '../lib/db';

export function GuideModal() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (state.guideOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [state.guideOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.guideOpen) closeGuide();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  const closeGuide = () => {
    dispatch({ type: 'SET_GUIDE_OPEN', open: false });
    dispatch({ type: 'SET_GUIDED', guided: true });
    setMeta('guided', true);
  };

  const lang = state.lang;
  const steps = [
    { num: 1, title: t(lang, 'step1title'), text: t(lang, 'step1text'), example: t(lang, 'step1example') },
    { num: 2, title: t(lang, 'step2title'), text: t(lang, 'step2text'), example: t(lang, 'step2example') },
    { num: 3, title: t(lang, 'step3title'), text: t(lang, 'step3text'), example: t(lang, 'step3example') },
  ];
  const eveningSteps = [
    { num: 4, title: t(lang, 'step4title'), text: t(lang, 'step4text'), example: t(lang, 'step4example') },
    { num: 5, title: t(lang, 'step5title'), text: t(lang, 'step5text'), example: t(lang, 'step5example') },
  ];

  return (
    <div
      className={`guide-overlay${state.guideOpen ? ' visible' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeGuide(); }}
    >
      <div className="guide">
        <button className="guide-close" onClick={closeGuide}>&times;</button>
        <h2>{t(lang, 'guideTitle')}</h2>
        <p className="guide-subtitle">{t(lang, 'guideSubtitle')}</p>
        <hr className="guide-divider" />
        <div className="guide-section">
          <h3><span className="icon-sun">☼</span> {t(lang, 'guideMorning')}</h3>
          {steps.map((s) => (
            <div key={s.num} className="guide-step">
              <span className="step-num">{s.num}</span>
              <span className="step-title">{s.title}</span>
              <p>{s.text}</p>
              <div className="guide-example">{s.example}</div>
            </div>
          ))}
        </div>
        <hr className="guide-divider" />
        <div className="guide-section">
          <h3><span className="icon-moon">☽</span> {t(lang, 'guideEvening')}</h3>
          {eveningSteps.map((s) => (
            <div key={s.num} className="guide-step">
              <span className="step-num">{s.num}</span>
              <span className="step-title">{s.title}</span>
              <p>{s.text}</p>
              <div className="guide-example">{s.example}</div>
            </div>
          ))}
        </div>
        <hr className="guide-divider" />
        <p className="guide-privacy" dangerouslySetInnerHTML={{ __html: t(lang, 'privacy') }} />
        <button className="guide-start" onClick={closeGuide}>{t(lang, 'begin')}</button>
      </div>
    </div>
  );
}
