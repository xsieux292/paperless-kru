import { useMemo, useState } from 'react';
import { Check, ClipboardList, PackagePlus, PackageSearch, Search, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/toastContext';
import type { SupplyRoute } from '@/routes';
import { useSupplyCart, useSupplyCatalog } from '@/hooks/useSupplyRequisition';
import {
  availabilityContent,
  LoadingSkeleton,
  QuantityStepper,
  StatePanel,
  SupplyImage,
  SupplyPageHeading,
} from './SupplyShared';
import { CustomSupplyModal } from './CustomSupplyModal';

export function SupplyCatalog({ onNavigate }: { onNavigate: (route: SupplyRoute) => void }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [customOpen, setCustomOpen] = useState(false);
  const catalog = useSupplyCatalog();
  const { cart, setCatalogQuantity, saveCustom } = useSupplyCart();
  const toast = useToast();

  const quantities = useMemo(
    () =>
      new Map(
        cart.flatMap((item) =>
          item.source === 'catalog' ? [[item.supplyId, item.requestedQuantity] as const] : [],
        ),
      ),
    [cart],
  );
  const categories = useMemo(
    () => ['ทั้งหมด', ...new Set((catalog.data ?? []).map((item) => item.category))],
    [catalog.data],
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('th');
    return (catalog.data ?? []).filter((item) => {
      const inCategory = category === 'ทั้งหมด' || item.category === category;
      const matches =
        !term ||
        item.name.toLocaleLowerCase('th').includes(term) ||
        item.code.toLocaleLowerCase('th').includes(term);
      return inCategory && matches && item.active;
    });
  }, [catalog.data, category, search]);
  const totalPieces = cart.reduce((sum, item) => sum + item.requestedQuantity, 0);

  return (
    <>
      <SupplyPageHeading
        eyebrow="สำหรับคุณครู · เข้าสู่ระบบแล้ว"
        title="เบิกพัสดุ"
        description="เลือกพัสดุที่ต้องการได้เลย เจ้าหน้าที่จะตรวจสอบของจริงและแจ้งจำนวนที่ยืนยันได้ก่อนคุณครูรับของ"
        action={
          <button
            type="button"
            onClick={() => onNavigate({ name: 'supply-requests' })}
            className="tap-target inline-flex items-center gap-2 rounded-xl border-2 border-white/70 px-4 text-base font-bold text-white transition hover:bg-white/10"
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
            ดูคำขอของฉัน
          </button>
        }
      />

      <section className="card mb-5 p-4 sm:p-5" aria-label="ค้นหาและกรองพัสดุ">
        <label htmlFor="supply-search" className="mb-2 block text-base font-bold text-ink">
          ค้นหาพัสดุ
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-ink-light" aria-hidden />
          <input
            id="supply-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาจากชื่อหรือรหัส เช่น SUP-001"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-3 text-base text-ink placeholder:text-ink-mute focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-base font-bold text-ink">หมวดหมู่</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="กรองตามหมวดหมู่">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={cn(
                  'tap-target shrink-0 rounded-full border-2 px-4 text-base font-bold transition',
                  category === item
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-slate-300 bg-white text-ink-light hover:border-primary-300 hover:text-ink',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {catalog.isLoading ? (
        <LoadingSkeleton cards={6} />
      ) : catalog.isError ? (
        <StatePanel
          tone="danger"
          title="โหลดรายการพัสดุไม่สำเร็จ"
          description="กรุณาตรวจสอบการเชื่อมต่อ แล้วลองโหลดรายการอีกครั้ง"
          actionLabel="โหลดรายการอีกครั้ง"
          onAction={() => void catalog.refetch()}
        />
      ) : filtered.length === 0 ? (
        <div className="space-y-4">
          <StatePanel
            icon={PackageSearch}
            title="ไม่พบพัสดุที่ค้นหา"
            description="ลองใช้คำค้นอื่น หรือแจ้งรายการเพิ่มเติมให้เจ้าหน้าที่ตรวจสอบ"
            actionLabel="ล้างตัวกรอง"
            onAction={() => {
              setSearch('');
              setCategory('ทั้งหมด');
            }}
          />
          <CustomSupplyPrompt onOpen={() => setCustomOpen(true)} />
        </div>
      ) : (
        <section aria-labelledby="catalog-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="catalog-heading" className="font-display text-xl font-bold text-ink">
              รายการพัสดุ
            </h2>
            <p className="text-base text-ink-light">พบ {filtered.length} รายการ</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const availability = availabilityContent[item.availabilityLabel];
              const AvailabilityIcon = availability.icon;
              const quantity = quantities.get(item.id) ?? 0;
              const paused = item.availabilityLabel === 'paused';
              return (
                <article key={item.id} className="card flex min-w-0 flex-col overflow-hidden">
                  <SupplyImage item={item} className="h-36 w-full" />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold leading-snug text-ink">{item.name}</h3>
                        <p className="mt-1 text-base text-ink-light">รหัส {item.code}</p>
                      </div>
                      {quantity > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-sm font-bold text-primary-800">
                          <Check className="h-4 w-4" aria-hidden /> ในตะกร้า
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-base text-ink-light">
                      {item.category} · หน่วยนับ {item.unit}
                    </p>
                    <span className={cn('mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold', availability.className)}>
                      <AvailabilityIcon className="h-4 w-4" aria-hidden />
                      {availability.label}
                    </span>

                    <div className="mt-auto pt-5">
                      {quantity > 0 ? (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-semibold text-ink">จำนวน ({item.unit})</span>
                          <QuantityStepper
                            label={item.name}
                            value={quantity}
                            onChange={(next) => setCatalogQuantity(item.id, next)}
                          />
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          fullWidth
                          disabled={paused}
                          leftIcon={<ShoppingBasket className="h-5 w-5" aria-hidden />}
                          onClick={() => {
                            setCatalogQuantity(item.id, 1);
                            toast.success('เพิ่มลงตะกร้าแล้ว', `${item.name} จำนวน 1 ${item.unit}`);
                          }}
                        >
                          {paused ? 'ยังไม่เปิดให้เบิก' : 'เพิ่มลงตะกร้า'}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <CustomSupplyPrompt onOpen={() => setCustomOpen(true)} />
        </section>
      )}

      {totalPieces > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink">ตะกร้า {cart.length} รายการ</p>
              <p className="text-sm text-ink-light">รวม {totalPieces} ชิ้น</p>
            </div>
            <Button
              size="lg"
              leftIcon={<ShoppingBasket className="h-5 w-5" aria-hidden />}
              onClick={() => onNavigate({ name: 'supply-cart' })}
            >
              เปิดตะกร้า
            </Button>
          </div>
        </div>
      )}

      <CustomSupplyModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onSave={(value) => {
          saveCustom(value);
          toast.success('เพิ่มรายการลงตะกร้าแล้ว', `${value.name} · รอเจ้าหน้าที่ตรวจสอบรายการ`);
        }}
      />
    </>
  );
}

function CustomSupplyPrompt({ onOpen }: { onOpen: () => void }) {
  return (
    <aside className="mt-6 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5" aria-labelledby="custom-supply-prompt-title">
      <div>
        <h2 id="custom-supply-prompt-title" className="font-display text-xl font-bold text-primary-950">
          ไม่พบวัสดุที่ต้องการ?
        </h2>
        <p className="mt-1 text-base leading-relaxed text-primary-900">
          คุณครูสามารถแจ้งรายการเพิ่มเติมให้เจ้าหน้าที่ตรวจสอบได้
        </p>
      </div>
      <Button type="button" variant="outline" className="mt-4 shrink-0 bg-white sm:mt-0" leftIcon={<PackagePlus className="h-5 w-5" aria-hidden />} onClick={onOpen}>
        เพิ่มของที่ไม่มีในรายการ
      </Button>
    </aside>
  );
}
