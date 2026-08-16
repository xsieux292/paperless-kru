import { Check, Lightbulb, MousePointerClick, Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FLOW_LABEL, FLOW_SEQUENCE, STEPS, type FlowId, type StepId } from '../journey';

export interface PresenterPanelProps {
  flow: FlowId;
  stepId: StepId;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onJump: (step: StepId) => void;
}

/**
 * แผงด้านขวาสำหรับคนนำเสนอ
 * บอกว่า "ตอนนี้เกิดอะไรบนจอ" และ "ทำไมถึงออกแบบแบบนี้" เพื่อให้พูดตามได้เลยโดยไม่ต้องท่อง
 */
export function PresenterPanel({
  flow,
  stepId,
  isPlaying,
  onTogglePlay,
  onReset,
  onJump,
}: PresenterPanelProps) {
  const step = STEPS[stepId];
  const sequence = FLOW_SEQUENCE[flow];
  const currentIndex = sequence.indexOf(stepId);

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="card p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-ink-mute">กำลังสาธิต</p>
        <h2 className="mt-1 font-display text-heading text-ink">{FLOW_LABEL[flow]}</h2>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="tap-target flex flex-1 items-center justify-center gap-2 rounded-btn bg-primary-600 px-4 font-display text-base font-bold text-white transition active:scale-[0.98] hover:bg-primary-700"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5" aria-hidden />
                หยุดเล่นอัตโนมัติ
              </>
            ) : (
              <>
                <Play className="h-5 w-5" aria-hidden />
                เล่นอัตโนมัติ
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="tap-target flex items-center justify-center gap-2 rounded-btn border-2 border-slate-300 px-4 font-display text-base font-bold text-ink transition hover:bg-slate-50"
          >
            <RotateCcw className="h-5 w-5" aria-hidden />
            เริ่มใหม่
          </button>
        </div>
      </div>

      {/* ไทม์ไลน์ขั้นตอน — กดข้ามไปขั้นไหนก็ได้ตอนตอบคำถามกรรมการ */}
      <div className="card p-5">
        <h3 className="mb-3 font-display text-base font-bold text-ink">ขั้นตอนใน flow นี้</h3>
        <ol className="space-y-1.5">
          {sequence.map((id, index) => {
            const isCurrent = id === stepId;
            const isPast = index < currentIndex;

            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onJump(id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-left transition-colors',
                    isCurrent ? 'bg-primary-50 ring-2 ring-primary-600' : 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      isCurrent && 'bg-primary-600 text-white',
                      isPast && 'bg-primary-100 text-primary-700',
                      !isCurrent && !isPast && 'bg-slate-200 text-ink-light',
                    )}
                  >
                    {isPast ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-base',
                      isCurrent ? 'font-bold text-primary-800' : 'text-ink-light',
                    )}
                  >
                    {STEPS[id].label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-base font-bold text-ink">เกิดอะไรขึ้นบนจอตอนนี้</h3>
        <p className="mt-1.5 text-base leading-relaxed text-ink-light">{step.what}</p>

        {step.cue && (
          <p className="mt-3 flex items-start gap-2 rounded-btn bg-attention-50 p-3 text-base text-attention-900">
            <MousePointerClick className="mt-0.5 h-5 w-5 shrink-0 text-attention-600" aria-hidden />
            {step.cue}
          </p>
        )}

        <h3 className="mt-5 flex items-center gap-2 font-display text-base font-bold text-ink">
          <Lightbulb className="h-5 w-5 shrink-0 text-primary-700" aria-hidden />
          ทำไมถึงออกแบบแบบนี้
        </h3>
        <ul className="mt-2 space-y-2">
          {step.why.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-2 text-base leading-relaxed text-ink-light"
            >
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-primary-600"
                strokeWidth={3}
                aria-hidden
              />
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          {step.principles.map((principle) => (
            <span
              key={principle}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-ink-light"
            >
              {principle}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
