# BOAG Koncernapp v2

Fältapp för hela BOAG-koncernen med stöd för fyra bolag,
gemensam anslagstavla, PIN-inloggning och personalhantering.

---

## Bolag i appen
1. BOAG Mark AB
2. BOAG Bygg AB
3. BOAG Transport AB
4. MB Mark & Hyr AB

---

## Driftsätta (20 min, gratis)

### Steg 1 — Supabase-databas

1. Gå till **https://supabase.com** → logga in → **New project**
2. Namn: `boag-koncern`, Region: EU (Irland eller Stockholm)
3. Gå till **SQL Editor** → klistra in `supabase_schema.sql` → **Run**
4. Gå till **Settings → API** → kopiera:
   - **Project URL**
   - **anon public key**

### Steg 2 — GitHub

1. Gå till **https://github.com** → skapa konto → **New repository**
2. Namnge det `boag-app` → **Create repository**
3. Ladda upp alla filer från detta paket

### Steg 3 — Vercel

1. Gå till **https://vercel.com** → logga in med GitHub
2. **Add New Project** → välj `boag-app`
3. Under **Environment Variables**, lägg till:
   - `VITE_SUPABASE_URL` = din Project URL
   - `VITE_SUPABASE_ANON_KEY` = din anon key
4. Klicka **Deploy**

Din app är live på t.ex. `boag-app.vercel.app` 🎉

---

## Lägga till anställda

### Via appen (rekommenderat)
Logga in som Mattias → tryck kugghjulet ⚙️ → Lägg till

### Via Supabase SQL Editor
```sql
INSERT INTO employees (id, name, role, pin) VALUES
  ('erik', 'Erik Johansson', 'employee', '4321'),
  ('anna', 'Anna Lindström', 'employee', '8765');
```

---

## Hur anställda loggar in

1. Du skickar URL:en via SMS
2. De öppnar i mobilen → väljer sitt namn → anger PIN
3. I Safari: tryck dela → "Lägg till på hemskärmen" = ser ut som en app

---

## Standardkonton (ändra PIN-koderna!)
- Mattias Simonsson — Admin — PIN: 1234
- Martti Ollila — Anställd — PIN: 5678

---

## Lokal utveckling

```bash
npm install
cp .env.example .env
# Fyll i Supabase-nycklar i .env
npm run dev
```

---

## Stack
- React 18 + Vite
- Supabase (PostgreSQL)
- Vercel hosting
- Kostnad: ~270 kr/mån (Supabase Pro)
