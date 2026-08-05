import { useState } from 'react';
import { Check, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toFriendlyMessage } from '@/api/http';
import { useSuggestItems } from '@/hooks/useRequisitions';
import { cn } from '@/lib/cn';
import type { SuggestedItem } from '@/types';

export interface AiItemSuggestDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (items: SuggestedItem[]) => void;
}

const EXAMPLE_PROMPTS = [
  'จัดกิจกรรมวันวิทยาศาสตร์ มีฐานทดลอง 5 ฐาน นักเรียน 120 คน',
  'จัดกีฬาสีภายใน 4 สี ใช้เวลา 2 วัน',
  'อบรมครูเรื่อง Active Learning 1 วัน ผู้เข้าอบรม 50 คน',
];

const formatBaht = (value: number) => value.toLocaleString('th-TH');

/**
 * "ให้ AI ช่วยคิด" ของ Flow B
 * ครูพิมพ์สั้น ๆ ว่าจะจัดกิจกรรมอะไร → AI คืนรายการ + ราคาประมาณ
 * → ครูเลือกทีละรายการเข้าฟอร์ม (AI ทำก่อน ครูแค่ตรวจ ตาม plan ข้อ ⑥)
 */
export function AiItemSuggestDialog({ open, onClose, onAdd }: AiItemSuggestDialogProps) {
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const suggest = useSuggestItems();

  const items: SuggestedItem[] = suggest.data ?? [];

  const toggle = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAsk = () => {
    setSelected(new Set());
    suggest.mutate(description, {
      // เลือกทุกรายการไว้ก่อน ครูค่อยเอาอันที่ไม่ต้องการออก จะเร็วกว่าติ๊กทีละอัน
      onSuccess: (result) => setSelected(new Set(result.map((_, index) => index))),
    });
  };

  const handleAdd = () => {
    onAdd(items.filter((_, index) => selected.has(index)));
    setDescription('');
    setSelected(new Set());
    suggest.reset();
    onClose();
  };

  const handleClose = () => {
    setDescription('');
    setSelected(new Set());
    suggest.reset();
    onClose();
  };

  const total = items.reduce(
    (sum, item, index) => (selected.has(index) ? sum + item.quantity * item.unitPrice : sum),
    0,
  );

  return (
    <Modal open={open} onClose={handleClose} labelledBy="ai-suggest-title" className="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h3 id="ai-suggest-title" className="font-display text-heading text-ink">
              ให้ AI ช่วยคิดรายการอุปกรณ์
            </h3>
            <p className="text-base text-ink-light">
              พิมพ์สั้น ๆ ว่าจะจัดกิจกรรมอะไร AI จะเสนอรายการพร้อมราคาประมาณให้ค่ะ
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="activity-desc" className="mb-1.5 block text-base font-semibold text-ink">
            จะจัดกิจกรรมอะไรคะ?
          </label>
          <textarea
            id="activity-desc"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="เช่น จัดกิจกรรมวันวิทยาศาสตร์ มีฐานทดลอง 5 ฐาน นักเรียน 120 คน"
            className="w-full rounded-xl border border-slate-300 p-3 text-base text-ink placeholder:text-ink-mute focus:border-primary-600 focus:ring-2 focus:ring-primary-500"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setDescription(prompt)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-ink-light transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={suggest.isPending}
          loadingText="AI กำลังคิดรายการให้…"
          disabled={!description.trim()}
          leftIcon={<Sparkles className="h-5 w-5" aria-hidden />}
          onClick={handleAsk}
        >
          ให้ AI คิดรายการให้
        </Button>

        {suggest.isError && (
          <div className="rounded-xl border-2 border-danger-300 bg-danger-50 p-3">
            <p className="text-base font-bold text-danger-700">ยังคิดรายการให้ไม่ได้</p>
            <p className="mt-0.5 text-base text-ink">{toFriendlyMessage(suggest.error)}</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-display text-base font-bold text-ink">
                AI เสนอมา {items.length} รายการ
              </h4>
              <span className="text-base text-ink-light">
                เลือกไว้ {selected.size} รายการ · {formatBaht(total)} บาท
              </span>
            </div>
            <p className="text-sm text-ink-light">
              ระบบเลือกไว้ให้ทั้งหมดแล้ว แตะเอาออกได้ถ้าไม่ต้องการรายการไหน
            </p>

            <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const isSelected = selected.has(index);
                return (
                  <li key={`${item.name}-${index}`}>
                    <button
                      type="button"
                      onClick={() => toggle(index)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all',
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
                          isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-300',
                        )}
                      >
                        {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-bold text-ink">
                          {item.name}
                        </span>
                        <span className="block text-base text-ink-light">
                          {item.quantity} {item.unit} × {formatBaht(item.unitPrice)} บาท ={' '}
                          {formatBaht(item.quantity * item.unitPrice)} บาท
                        </span>
                        <span className="block text-sm text-ink-mute">{item.reason}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={selected.size === 0}
                leftIcon={<Plus className="h-5 w-5" aria-hidden />}
                onClick={handleAdd}
              >
                {selected.size > 0
                  ? `ใส่ ${selected.size} รายการลงในใบเบิก`
                  : 'เลือกอย่างน้อย 1 รายการ'}
              </Button>
              <Button type="button" variant="ghost" size="md" fullWidth onClick={handleClose}>
                ปิดหน้าต่างนี้
              </Button>
            </div>
          </div>
        )}

        {items.length === 0 && !suggest.isPending && (
          <Button type="button" variant="ghost" size="md" fullWidth onClick={handleClose}>
            ปิดหน้าต่างนี้
          </Button>
        )}
      </div>
    </Modal>
  );
}
