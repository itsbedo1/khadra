# khadra

موقع خضرة — متجر خضروات وفواكه بسيط، مبني بـ React + Framer Motion.

## التطوير محليًا

```bash
npm install
npm run dev
```

## البناء للنشر

```bash
npm run build
```

الناتج ينحط بمجلد `dist/`. المستودع فيه GitHub Action (`.github/workflows/deploy.yml`)
يبني وينشر تلقائيًا على GitHub Pages كل ما يصير push على `main`.

## صفحة تعديل الأسعار

`public/prices.html` صفحة مستقلة (بدون React) لتعديل الأسعار والمخزون، محمية بكلمة مرور.
بعد النشر تكون على: `https://<domain>/khadra/prices.html`
