import type { FormEvent } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, inputClass, textareaClass } from '@/components/ui/FormField';
import { cn } from '@/lib/cn';
import type { ActivityPlanForm, PlanningQuestion } from '@/types';

/**
 * ขั้นที่ 2 — AI ถามรายละเอียดเพิ่มทีละข้อ
 *
 * ถามทีละคำถามแทนที่จะยัดฟอร์มยาว ๆ ให้ครูกรอกทีเดียว
 * และบอก "เหตุผลที่ถาม" ทุกข้อ ครูจะได้รู้ว่าตอบไปแล้วเอาไปทำอะไร
 */
export function AiQuestionnaire({
  form,
  questions,
  questionIndex,
  answers,
  draftAnswer,
  extraContext,
  ready,
  onDraftAnswerChange,
  onExtraContextChange,
  onSubmitAnswer,
  onBackToAnswer,
  onProceed,
}: {
  form: ActivityPlanForm;
  questions: PlanningQuestion[];
  questionIndex: number;
  answers: Record<string, string>;
  draftAnswer: string;
  extraContext: string;
  ready: boolean;
  onDraftAnswerChange: (value: string) => void;
  onExtraContextChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onBackToAnswer: (index: number) => void;
  onProceed: () => void;
}) {
  const baht = (value: number) => value.toLocaleString('th-TH');
  const attendees = [form.students, form.parents, form.teachers, form.guests]
    .map((value) => Number(value) || 0)
    .reduce((sum, value) => sum + value, 0);

  const answeredQuestions = questions.slice(0, questionIndex);
  const currentQuestion = questions[questionIndex];
  const isFinished = questionIndex >= questions.length;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmitAnswer();
  };

  const chips = [
    form.eventName,
    attendees > 0 ? `${baht(attendees)} คน` : '',
    form.venue,
    Number(form.budget) > 0 ? `วงเงิน ${baht(Number(form.budget))} บาท` : '',
  ].filter(Boolean);

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-heading text-ink">AI ขอถามเพิ่มอีกนิดค่ะ</h2>
          <p className="mt-0.5 text-base text-ink-light">
            ตอบสั้น ๆ ได้เลย ยิ่งตรงกับของจริง AI ยิ่งคิดงบได้แม่น
          </p>
        </div>

        {!isFinished && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-primary-50 px-3 py-1 text-base font-bold text-primary-800">
            ข้อ {Math.min(questionIndex + 1, questions.length)} / {questions.length}
          </span>
        )}
      </div>

      {/* สรุปสิ่งที่กรอกมาแล้ว ครูจะได้ไม่ต้องเลื่อนกลับไปดู */}
      {chips.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-ink-light"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4" aria-live="polite">
        {/* คำถามที่ตอบไปแล้ว — แตะเพื่อกลับไปแก้ได้ */}
        {answeredQuestions.map((question, index) => (
          <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink-light">{question.label}</p>
                <p className="mt-0.5 text-base font-bold text-ink">
                  {answers[question.id] || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onBackToAnswer(index)}
                className="tap-target shrink-0 rounded-btn px-2 text-sm font-bold text-primary-700 transition hover:bg-primary-50"
              >
                แก้
              </button>
            </div>
          </div>
        ))}

        {/* คำถามปัจจุบัน */}
        {!isFinished && currentQuestion && (
          <div className="rounded-xl border-2 border-primary-500 bg-primary-50 p-4">
            <div className="mb-3 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-snug text-ink">
                  {currentQuestion.label}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-light">
                  ถามเพราะ: {currentQuestion.reason}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="dynamic-answer" className="sr-only">
                {currentQuestion.label}
              </label>

              {currentQuestion.type === 'number' ? (
                <div className="flex items-center gap-2">
                  <input
                    id="dynamic-answer"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder={currentQuestion.placeholder}
                    value={draftAnswer}
                    onChange={(event) => onDraftAnswerChange(event.target.value)}
                    className={cn(inputClass, 'w-40')}
                  />
                  <span className="text-base text-ink-light">{currentQuestion.suffix}</span>
                </div>
              ) : (
                <textarea
                  id="dynamic-answer"
                  rows={3}
                  placeholder={currentQuestion.placeholder}
                  value={draftAnswer}
                  onChange={(event) => onDraftAnswerChange(event.target.value)}
                  className={textareaClass}
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="mt-3"
                disabled={!draftAnswer.trim()}
                leftIcon={<Send className="h-5 w-5" aria-hidden />}
              >
                ส่งคำตอบ
              </Button>

              <button
                type="button"
                onClick={onSubmitAnswer}
                className="tap-target mt-2 w-full rounded-btn text-base font-bold text-ink-light transition hover:bg-slate-50"
              >
                ข้อนี้ยังไม่รู้ — ข้ามไปก่อน
              </button>
            </form>
          </div>
        )}

        {/* ตอบครบแล้ว */}
        {isFinished && (
          <div
            className={cn(
              'rounded-xl border-2 p-4',
              ready ? 'border-primary-500 bg-primary-50' : 'border-attention-500 bg-attention-50',
            )}
          >
            <div className="mb-3 flex items-start gap-3">
              {ready ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-attention-600" aria-hidden />
              )}
              <div className="min-w-0">
                <h3
                  className={cn(
                    'font-display text-base font-bold',
                    ready ? 'text-primary-800' : 'text-attention-800',
                  )}
                >
                  {ready ? 'ข้อมูลพอแล้วค่ะ' : 'ยังมีบางจุดที่ AI ไม่แน่ใจ'}
                </h3>
                <p className="mt-0.5 text-base leading-relaxed text-ink">
                  {ready
                    ? 'AI จะสร้างรายการงบพร้อมสมมติฐานให้ แล้วคุณครูตรวจอีกครั้งได้'
                    : 'จะเพิ่มรายละเอียดก่อน หรือให้สร้างร่างพร้อมคำเตือนไว้ก่อนก็ได้ค่ะ'}
                </p>
              </div>
            </div>

            {!ready && (
              <FormField
                label="รายละเอียดเพิ่มเติม"
                htmlFor="extraContext"
                optional
                className="mb-4"
              >
                <textarea
                  id="extraContext"
                  rows={3}
                  placeholder="เช่น โรงเรียนมีเครื่องเสียงอยู่แล้ว ไม่ต้องเช่า"
                  value={extraContext}
                  onChange={(event) => onExtraContextChange(event.target.value)}
                  className={textareaClass}
                />
              </FormField>
            )}

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<ArrowRight className="h-5 w-5" aria-hidden />}
              onClick={onProceed}
            >
              {ready ? 'ให้ AI สร้างรายการงบ' : 'สร้างร่างพร้อมคำเตือน'}
            </Button>

            <button
              type="button"
              onClick={() => onBackToAnswer(Math.max(0, questions.length - 1))}
              className="tap-target mt-2 w-full rounded-btn text-base font-bold text-ink-light transition hover:bg-slate-50"
            >
              กลับไปแก้คำตอบ
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
