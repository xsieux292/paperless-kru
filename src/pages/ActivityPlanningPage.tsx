import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { HelpCard } from '@/components/layout/HelpCard';
import { MockModeBanner } from '@/components/layout/MockModeBanner';
import { HowToUseModal } from '@/features/help/HowToUseModal';
import { ActivityInfoForm } from '@/features/planning/ActivityInfoForm';
import { AiQuestionnaire } from '@/features/planning/AiQuestionnaire';
import { BudgetPlanTable } from '@/features/planning/BudgetPlanTable';
import { ConfidencePanel } from '@/features/planning/ConfidencePanel';
import { toFriendlyMessage } from '@/api/http';
import { useDraftActivityPlan } from '@/hooks/useAiAssist';
import { useGenerateActivityBudget, usePlanningQuestions } from '@/hooks/useActivityPlanning';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { ActivityBudgetPlan, ActivityPlanForm } from '@/types';
import type { AppRoute } from '@/routes';

const STEPS = ['บอกข้อมูลกิจกรรม', 'AI ถามเพิ่ม', 'ได้รายการงบ'];

const INITIAL_FORM: ActivityPlanForm = {
  eventName: '',
  objective: '',
  eventDate: '',
  venue: '',
  durationHours: '',
  students: '',
  parents: '',
  teachers: '',
  guests: '',
  budget: '',
  agenda: '',
};

export function ActivityPlanningPage({
  route,
  onNavigate,
}: {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [form, setForm] = useState<ActivityPlanForm>(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  const { data: questions = [] } = usePlanningQuestions();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [draftAnswer, setDraftAnswer] = useState('');
  const [extraContext, setExtraContext] = useState('');

  const toast = useToast();
  const prefill = useDraftActivityPlan();
  const { mutate: generateBudget, isPending: isGenerating } = useGenerateActivityBudget();
  const [plan, setPlan] = useState<ActivityBudgetPlan | null>(null);

  const handleFormChange = (field: keyof ActivityPlanForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  /** ให้ AI เติมช่องให้จากประโยคเดียว — ครูจะได้ไม่ต้องกรอกเอง 11 ช่อง */
  const handleAiPrefill = (description: string) => {
    prefill.mutate(description, {
      onSuccess: (draft) => {
        setForm((current) => ({ ...current, ...draft }));
        setPrefilled(true);
        setFormError('');
        toast.success(
          'AI เติมข้อมูลให้แล้วค่ะ',
          'เลื่อนขึ้นไปดูในฟอร์มด้านบน แก้ได้ทุกช่องเลยนะคะ',
        );
        // เลื่อนกลับไปที่ฟอร์มให้เลย ครูจะได้เห็นสิ่งที่ AI เติมทันที
        document
          .getElementById('plan-eventName')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      onError: (error) => toast.error('ยังเติมข้อมูลให้ไม่ได้', toFriendlyMessage(error)),
    });
  };

  const submitForm = () => {
    if (!form.eventName.trim()) {
      setFormError('ยังไม่มีชื่อกิจกรรมค่ะ — กรอกในฟอร์มด้านบน หรือให้ AI ช่วยกรอกจากกล่องด้านล่างก็ได้');
      return;
    }
    const attendees = [form.students, form.parents, form.teachers, form.guests]
      .map((value) => Number(value) || 0)
      .reduce((sum, value) => sum + value, 0);

    if (attendees === 0) {
      setFormError('กรุณาระบุจำนวนผู้เข้าร่วมอย่างน้อย 1 กลุ่ม เพื่อให้ AI คิดปริมาณของได้ถูก');
      return;
    }

    setStage(1);
    setQuestionIndex(0);
    setAnswers({});
    setDraftAnswer('');
    setExtraContext('');
  };

  const submitAnswer = () => {
    const question = questions[questionIndex];
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: draftAnswer }));
    setDraftAnswer('');
    setQuestionIndex((current) => current + 1);
  };

  const submitToAi = () => {
    generateBudget(
      { form, answers: { ...answers, extra: extraContext } },
      {
        onSuccess: (data) => {
          setPlan(data);
          setStage(2);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: (error) =>
          toast.error('ยังสร้างรายการงบไม่ได้', toFriendlyMessage(error)),
      },
    );
  };

  const resetAll = () => {
    setStage(0);
    setForm(INITIAL_FORM);
    setAnswers({});
    setPlan(null);
    setPrefilled(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answeredCount = Object.keys(answers).length;
  const confidence = plan?.overallConfidence ?? Math.min(88, 30 + answeredCount * 12);
  const ready = plan?.ready ?? confidence >= 85;
  const dimensions = plan?.confidence ?? {
    coverage: Math.min(90, 40 + answeredCount * 10),
    people: 40 + (answers.snacks ? 50 : 0) + (answers.elderly ? 10 : 0),
    prices: 30 + answeredCount * 8,
    assets: 20 + (answers.audio ? 70 : 0),
  };
  const pending = questions
    .slice(questionIndex)
    .map((question) => question.label)
    .concat(ready ? [] : ['ตรวจสอบราคาตลาดล่าสุด']);

  const confidencePanel = (
    <ConfidencePanel
      confidence={plan?.overallConfidence ?? confidence}
      dimensions={plan?.confidence ?? dimensions}
      ready={plan?.ready ?? ready}
      pending={plan ? [] : pending}
    />
  );

  return (
    <div className="min-h-screen bg-surface pb-12">
      <MockModeBanner />
      <AppHeader route={route} onNavigate={onNavigate} onOpenHelp={() => setHelpOpen(true)} />

      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* แบนเนอร์หัวหน้า — รูปแบบเดียวกับหน้าเบิกงบ */}
        <section className="mb-6 rounded-2xl bg-primary-600 px-5 py-5 text-white sm:px-6">
          <h2 className="font-display text-xl font-bold sm:text-2xl">วางแผนงบกิจกรรม</h2>
          <p className="mt-1 text-base text-primary-50">
            กรอกข้อมูลกิจกรรมด้านล่าง แล้ว AI จะช่วยคิดว่าต้องใช้อะไรบ้าง เท่าไร
            พร้อมส่งต่อไปทำใบเบิกได้เลยค่ะ — ถ้าไม่อยากกรอกเอง ให้ AI ช่วยกรอกได้ที่ท้ายฟอร์ม
          </p>
        </section>

        {/* ตัวบอกขั้นตอน — ใช้แถบแบ่งช่วงเหมือนหน้าเบิกงบ อ่านง่ายกว่าจุดกลม */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-display text-base font-bold text-ink">
              ขั้นที่ {stage + 1} จาก {STEPS.length}
            </span>
            <span className="text-base text-ink-light">{STEPS[stage]}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  index <= stage ? 'bg-primary-600' : 'bg-slate-200',
                )}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {stage === 0 && (
              <ActivityInfoForm
                form={form}
                onFormChange={handleFormChange}
                onSubmit={submitForm}
                onAiPrefill={handleAiPrefill}
                isPrefilling={prefill.isPending}
                prefilled={prefilled}
                error={formError}
              />
            )}

            {stage === 1 && (
              <AiQuestionnaire
                form={form}
                questions={questions}
                questionIndex={questionIndex}
                answers={answers}
                draftAnswer={draftAnswer}
                extraContext={extraContext}
                ready={ready}
                onDraftAnswerChange={setDraftAnswer}
                onExtraContextChange={setExtraContext}
                onSubmitAnswer={submitAnswer}
                onBackToAnswer={setQuestionIndex}
                onProceed={submitToAi}
              />
            )}

            {stage === 2 && plan && (
              <BudgetPlanTable
                items={plan.items}
                totalBudget={Number(form.budget) || 0}
                onReset={resetAll}
                onCreateRequisition={() => onNavigate('requisition')}
              />
            )}
          </div>

          {/* แผงข้าง — บนมือถือแสดงต่อท้าย ไม่ซ่อนทิ้งเหมือนเดิม */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            {stage > 0 && confidencePanel}
            <HelpCard onOpenHelp={() => setHelpOpen(true)} />
          </aside>
        </div>
      </main>

      {/* กำลังสร้างรายการงบ */}
      {isGenerating && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm"
        >
          <div className="card flex flex-col items-center p-8 text-center">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary-600" aria-hidden />
            <h2 className="font-display text-heading text-ink">AI กำลังคิดรายการงบให้…</h2>
            <p className="mt-1 text-base text-ink-light">
              กำลังประมวลผลคำตอบและราคาอ้างอิง ใช้เวลาสักครู่ค่ะ
            </p>
          </div>
        </div>
      )}

      <HowToUseModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
