import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';

// ═══════════ إعدادات — عدّلها مرة واحدة فقط ═══════════

// قاعدة بيانات Supabase (نفس القاعدة الموجودة مسبقًا في المشروع)
const SUPABASE_URL = 'https://teospyoryqqgieqbbqtt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlb3NweW9yeXFxZ2llcWJicXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTYxNDIsImV4cCI6MjA5MTM3MjE0Mn0.NMf-fhlUJh-SFCEuqMzCTx9DYj40u6U7acECZu09Oko';
const HD = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };

// بوت تيليجرام — استبدل القيمتين بالتوكن والـ chat id الخاصين بمحلك
const TELEGRAM_BOT_TOKEN = 'PASTE_YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = 'PASTE_YOUR_CHAT_ID_HERE';

// رسوم التوصيل الثابتة (IQD)
const DELIVERY_FEE = 2500;

// ═══════════ نهاية الإعدادات ═══════════

const CATS = [
  { id: 'all', ar: 'الكل', ic: '🌿' },
  { id: 'vegetables', ar: 'خضروات', ic: '🥦' },
  { id: 'fruits', ar: 'فواكه', ic: '🍎' },
  { id: 'herbs', ar: 'أعشاب', ic: '🌿' },
  { id: 'citrus', ar: 'حمضيات', ic: '🍋' },
];

const DEMO_PRODUCTS = [
  { id: 1, ar: 'طماطم', price: 2000, stock: 50, emoji: '🍅', cat: 'vegetables' },
  { id: 2, ar: 'خيار', price: 1500, stock: 50, emoji: '🥒', cat: 'vegetables' },
  { id: 3, ar: 'بطاطا', price: 1000, stock: 50, emoji: '🥔', cat: 'vegetables' },
  { id: 4, ar: 'بصل', price: 1000, stock: 50, emoji: '🧅', cat: 'vegetables' },
  { id: 5, ar: 'جزر', price: 1200, stock: 50, emoji: '🥕', cat: 'vegetables' },
  { id: 6, ar: 'تفاح', price: 3000, stock: 50, emoji: '🍎', cat: 'fruits' },
  { id: 7, ar: 'موز', price: 2500, stock: 50, emoji: '🍌', cat: 'fruits' },
  { id: 8, ar: 'برتقال', price: 2000, stock: 50, emoji: '🍊', cat: 'citrus' },
  { id: 9, ar: 'ليمون', price: 1500, stock: 50, emoji: '🍋', cat: 'citrus' },
  { id: 10, ar: 'نعناع', price: 500, stock: 50, emoji: '🌿', cat: 'herbs' },
];

function rP(r) {
  return { id: r.id, ar: r.name_ar, price: r.price, stock: r.stock, emoji: r.emoji, cat: r.category };
}

async function sGet(t, q = '') {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + t + '?' + q, { headers: HD });
  if (!r.ok) throw await r.text();
  return r.json();
}

export default function App() {
  const [prods, setProds] = useState([]);
  const [cart, setCart] = useState({});
  const [actCat, setActCat] = useState('all');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  function toast(msg) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3200);
  }

  useEffect(() => {
    (async () => {
      try {
        const p = await sGet('khadra_products', 'order=id');
        setProds(p.map(rP));
      } catch (e) {
        console.warn('تعذر تحميل المنتجات من قاعدة البيانات:', e);
        setProds(DEMO_PRODUCTS);
        toast('⚠️ تعذر الاتصال بقاعدة البيانات — عرض بيانات تجريبية');
      }
    })();
  }, []);

  const filteredProds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prods.filter((p) => (actCat === 'all' || p.cat === actCat) && (!q || p.ar.includes(q)));
  }, [prods, actCat, search]);

  const cartEntries = useMemo(() => Object.entries(cart).filter(([, q]) => q > 0), [cart]);
  const subtotal = useMemo(
    () => cartEntries.reduce((s, [id, q]) => { const p = prods.find((x) => x.id == id); return s + (p ? p.price * q : 0); }, 0),
    [cartEntries, prods]
  );
  const cartCount = cartEntries.reduce((s, [, q]) => s + q, 0);

  function addCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function chgQ(id, d) {
    setCart((c) => {
      const next = Math.max(0, (c[id] || 0) + d);
      const copy = { ...c };
      if (next) copy[id] = next; else delete copy[id];
      return copy;
    });
  }

  function openCheckout() {
    if (!cartEntries.length) { toast('⚠️ السلة فارغة'); return; }
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  return (
    <>
      <Topbar />
      <main className="app">
        <Hero search={search} setSearch={setSearch} />
        <section className="sc">
          <div className="sc-t">الأقسام</div>
          <Categories actCat={actCat} setActCat={setActCat} />
        </section>
        <section className="sc">
          <div className="sc-t">المنتجات</div>
          <ProductGrid products={filteredProds} cart={cart} onAdd={addCart} onChgQ={chgQ} />
        </section>
      </main>

      <CartFab count={cartCount} total={subtotal + (cartCount ? DELIVERY_FEE : 0)} onClick={() => setCartOpen(true)} visible={cartCount > 0} />

      <CartPanel
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        entries={cartEntries}
        prods={prods}
        onChgQ={chgQ}
        subtotal={subtotal}
        onCheckout={openCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartEntries={cartEntries}
        prods={prods}
        subtotal={subtotal}
        toast={toast}
        onSuccess={() => { setCart({}); setCheckoutOpen(false); }}
      />

      <Toast message={toastMsg} />
    </>
  );
}

// ═══════════ التوپبار ═══════════
function Topbar() {
  return (
    <motion.div className="tb" initial={{ y: -50 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }}>
      <div className="tbr">🌿 خضرة · Khadra</div>
    </motion.div>
  );
}

// ═══════════ الهيرو ═══════════
function Hero({ search, setSearch }) {
  return (
    <motion.div className="hr" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="hb">🚀 توصيل سريع</div>
      <h1>
        خضروات <span>طازجة</span>
        <br />
        لباب بيتك
      </h1>
      <p>اختر منتجاتك وأرسل طلبك بضغطة زر</p>
      <div className="hs">
        <input type="text" placeholder="ابحث عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button>🔍</button>
      </div>
    </motion.div>
  );
}

// ═══════════ الأقسام ═══════════
function Categories({ actCat, setActCat }) {
  return (
    <div className="cs">
      {CATS.map((c) => (
        <button key={c.id} className={`cb ${actCat === c.id ? 'on' : ''}`} onClick={() => setActCat(c.id)}>
          {actCat === c.id && (
            <motion.div className="cbPill" layoutId="catPill" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
          )}
          <span className="ci2">{c.ic}</span>
          <span className="cn">{c.ar}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════ شبكة المنتجات ═══════════
function ProductGrid({ products, cart, onAdd, onChgQ }) {
  if (!products.length) {
    return <div className="pempty">لا توجد منتجات 🔍</div>;
  }
  return (
    <div className="pg">
      <AnimatePresence>
        {products.map((p) => (
          <ProductCard key={p.id} p={p} qty={cart[p.id] || 0} onAdd={onAdd} onChgQ={onChgQ} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ p, qty, onAdd, onChgQ }) {
  const [floats, setFloats] = useState([]);

  function handleAdd() {
    onAdd(p.id);
    const fid = Date.now() + Math.random();
    setFloats((f) => [...f, fid]);
  }

  return (
    <motion.div
      className="pc"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25 }}
    >
      <div className="pi">
        {p.emoji || '🥬'}
        <AnimatePresence>
          {floats.map((fid) => (
            <motion.div
              key={fid}
              className="float-label"
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -44, scale: 0.8 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              onAnimationComplete={() => setFloats((f) => f.filter((x) => x !== fid))}
            >
              +1
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="pin">
        <div className="pn">{p.ar}</div>
        <div className="pp">{(p.price || 0).toLocaleString()} IQD</div>
      </div>
      <div className="pf">
        {qty ? (
          <div className="qc">
            <motion.button whileTap={{ scale: 0.8 }} className="qb" onClick={() => onChgQ(p.id, -1)}>−</motion.button>
            <span className="qn">{qty}</span>
            <motion.button whileTap={{ scale: 0.8 }} className="qb" onClick={() => onChgQ(p.id, 1)}>+</motion.button>
          </div>
        ) : (
          <div />
        )}
        <motion.button whileTap={{ scale: 0.9 }} className={`ba ${qty ? 'add' : ''}`} onClick={handleAdd}>
          {qty ? '✓ أضيف' : '+ أضف'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════ زر السلة العائم ═══════════
function CartFab({ count, total, onClick, visible }) {
  const controls = useAnimationControls();
  useEffect(() => {
    if (count > 0) controls.start({ scale: [1, 1.14, 1], transition: { duration: 0.3 } });
  }, [count, controls]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="cf"
          onClick={onClick}
          animate={controls}
          initial={{ opacity: 0, y: 30 }}
          exit={{ opacity: 0, y: 30 }}
          style={{ display: 'flex' }}
        >
          <div className="cc">{count}</div>
          <div className="cf-info">
            <span className="cf-items">{count} {count === 1 ? 'منتج' : 'منتجات'} في السلة</span>
            <span className="cf-total">{total.toLocaleString()} IQD</span>
          </div>
          <span style={{ fontSize: '1.1rem' }}>←</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ═══════════ لوحة السلة ═══════════
function CartPanel({ open, onClose, entries, prods, onChgQ, subtotal, onCheckout }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="ov" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="cp"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="ch">
              <h3>🛒 سلة التسوق</h3>
              <button className="cclose" onClick={onClose}>✕</button>
            </div>
            <div className="citems">
              {!entries.length ? (
                <div className="cemp">🛒<br />السلة فارغة</div>
              ) : (
                <AnimatePresence>
                  {entries.map(([id, qty]) => {
                    const p = prods.find((x) => x.id == id);
                    if (!p) return null;
                    return (
                      <motion.div key={id} className="cit" layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <div className="cie">{p.emoji || '🥬'}</div>
                        <div className="cii">
                          <div className="cin">{p.ar}</div>
                          <div className="cip">{(p.price * qty).toLocaleString()} IQD</div>
                        </div>
                        <div className="qc">
                          <motion.button whileTap={{ scale: 0.8 }} className="qb" onClick={() => onChgQ(p.id, -1)}>−</motion.button>
                          <span className="qn">{qty}</span>
                          <motion.button whileTap={{ scale: 0.8 }} className="qb" onClick={() => onChgQ(p.id, 1)}>+</motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
            {!!entries.length && (
              <div className="cfoot">
                <div className="crow"><span>المجموع الفرعي</span><span>{subtotal.toLocaleString()} IQD</span></div>
                <div className="crow"><span>رسوم التوصيل</span><span>{DELIVERY_FEE.toLocaleString()} IQD</span></div>
                <div className="crow tot"><span>الإجمالي</span><span>{(subtotal + DELIVERY_FEE).toLocaleString()} IQD</span></div>
                <button className="bco" onClick={onCheckout}>✅ تأكيد الطلب</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════ نافذة تأكيد الطلب ═══════════
function CheckoutModal({ open, onClose, cartEntries, prods, subtotal, toast, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [copyText, setCopyText] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setCopyText(null);
  }, [open]);

  function buildOrderText() {
    const total = subtotal + DELIVERY_FEE;
    const ref = '#' + Date.now().toString().slice(-6);
    const lines = cartEntries
      .map(([id, q]) => { const p = prods.find((x) => x.id == id); return p ? `• ${p.ar} × ${q} = ${(p.price * q).toLocaleString()} IQD` : ''; })
      .filter(Boolean)
      .join('\n');
    return `🌿 طلب جديد من خضرة ${ref}\n\n📦 المنتجات:\n${lines}\n\n💵 المجموع الفرعي: ${subtotal.toLocaleString()} IQD\n🚚 التوصيل: ${DELIVERY_FEE.toLocaleString()} IQD\n💰 الإجمالي: ${total.toLocaleString()} IQD\n\n👤 الاسم: ${name}\n📞 الهاتف: ${phone}\n📍 العنوان: ${address}${note ? `\n📝 ملاحظة: ${note}` : ''}`;
  }

  async function submitOrder() {
    if (!name.trim()) { toast('⚠️ أدخل الاسم'); return; }
    if (!phone.trim()) { toast('⚠️ أدخل رقم الهاتف'); return; }
    if (!address.trim()) { toast('⚠️ أدخل العنوان'); return; }

    const text = buildOrderText();
    setSending(true);
    try {
      if (TELEGRAM_BOT_TOKEN === 'PASTE_YOUR_BOT_TOKEN_HERE' || TELEGRAM_CHAT_ID === 'PASTE_YOUR_CHAT_ID_HERE') {
        throw new Error('لم يتم إعداد بوت تيليجرام بعد');
      }
      const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      });
      if (!r.ok) throw new Error(await r.text());
      setSending(false);
      toast('🎉 تم إرسال طلبك بنجاح! سنتواصل معك قريبًا');
      setName(''); setPhone(''); setAddress(''); setNote('');
      onSuccess();
    } catch (e) {
      console.warn('فشل إرسال الطلب لتيليجرام:', e);
      setSending(false);
      setCopyText(text);
      toast('⚠️ تعذر الإرسال التلقائي — انسخ الطلب وأرسله يدويًا');
    }
  }

  function copyOrderText() {
    navigator.clipboard?.writeText(copyText).then(() => toast('📋 تم نسخ الطلب')).catch(() => {});
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="mbg" onClick={(e) => e.target === e.currentTarget && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="mb" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}>
            <div className="mh">
              <h3>📦 تأكيد الطلب</h3>
              <button className="mx" onClick={onClose}>✕</button>
            </div>
            <div className="mbd">
              <div className="fg"><label>الاسم</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" /></div>
              <div className="fg"><label>رقم الهاتف</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xxxxxxxxx" /></div>
              <div className="fg"><label>العنوان</label><textarea rows="3" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المحافظة، المنطقة، أقرب نقطة دالة..." /></div>
              <div className="fg"><label>ملاحظة (اختياري)</label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: اتصل قبل الوصول" /></div>

              {!copyText ? (
                <motion.button whileTap={{ scale: 0.97 }} className="bsub" onClick={submitOrder} disabled={sending}>
                  {sending ? '⏳ جاري الإرسال...' : '🚀 إرسال الطلب على تيليجرام'}
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ fontSize: '.78rem', color: 'var(--mut)', marginBottom: 6 }}>⚠️ تعذر الإرسال التلقائي — انسخ الطلب وأرسله يدويًا:</div>
                  <textarea readOnly value={copyText} style={{ height: 130, fontSize: '.78rem' }} />
                  <button className="bsub" style={{ marginTop: 8, background: 'var(--gold)', color: '#111' }} onClick={copyOrderText}>📋 نسخ نص الطلب</button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════ التوست ═══════════
function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="tst"
          initial={{ opacity: 0, y: 16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 16, x: '-50%' }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
