* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F5F4F0;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}

#root {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
}

/* ── Login ─────────────────────────── */
.login-screen {
  min-height: 100dvh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
}
.login-logo { height: 52px; width: auto; filter: invert(1); }
.login-divider { width: 1px; height: 20px; background: rgba(255,255,255,.2); margin: 8px auto; }
.login-label { font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,.4); font-weight: 600; margin-bottom: 24px; }
.login-sub { font-size: 13px; color: rgba(255,255,255,.4); margin-bottom: 20px; }
.emp-card {
  width: 100%; max-width: 340px;
  background: rgba(255,255,255,.07);
  border: 0.5px solid rgba(255,255,255,.12);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background .15s;
}
.emp-card:hover { background: rgba(255,255,255,.12); }
.emp-name { font-size: 15px; font-weight: 700; color: #fff; }
.emp-role-label { font-size: 12px; color: rgba(255,255,255,.4); }

/* ── PIN ────────────────────────────── */
.pin-screen { width: 100%; max-width: 320px; }
.pin-avatar-wrap { text-align: center; margin-bottom: 4px; }
.pin-name { font-size: 15px; font-weight: 700; color: #fff; margin-top: 8px; }
.pin-role { font-size: 12px; color: rgba(255,255,255,.4); margin-top: 2px; }
.pin-dots { display: flex; gap: 14px; justify-content: center; margin: 22px 0 8px; }
.pin-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); transition: all .15s; }
.pin-dot.filled { background: #E05D1A; border-color: #E05D1A; }
.pin-dot.error { background: #e24b4a; border-color: #e24b4a; animation: shake .3s; }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
.pin-error { font-size: 13px; color: #e24b4a; text-align: center; min-height: 20px; margin-bottom: 10px; }
.pin-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.pin-btn {
  background: rgba(255,255,255,.08);
  border: none;
  border-radius: 12px;
  padding: 16px 8px;
  font-size: 22px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  color: #fff;
  transition: background .1s;
}
.pin-btn:active { background: rgba(255,255,255,.2); }
.pin-btn-del { font-size: 16px; color: rgba(255,255,255,.5); }
.pin-back { font-size: 13px; color: rgba(255,255,255,.35); text-align: center; margin-top: 18px; cursor: pointer; }

/* ── Avatar ─────────────────────────── */
.avatar {
  width: 42px; height: 42px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700;
  flex-shrink: 0;
}
.av-admin { background: rgba(254,240,230,.12); color: #ff8c5a; border: 0.5px solid rgba(255,255,255,.1); }
.av-emp   { background: rgba(232,240,254,.12); color: #7ab4f5; border: 0.5px solid rgba(255,255,255,.1); }
.av-admin-light { background: #FEF0E6; color: #B84B12; }
.av-emp-light   { background: #E8F0FE; color: #1a56a4; }

/* ── Topbar ─────────────────────────── */
.topbar {
  background: #fff;
  border-bottom: 0.5px solid rgba(0,0,0,.1);
  padding: 9px 14px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 50;
}
.topbar-left { display: flex; align-items: center; gap: 8px; }
.topbar-logo { height: 22px; width: auto; }
.topbar-sep { width: 0.5px; height: 18px; background: rgba(0,0,0,.15); }
.topbar-label { font-size: 10px; letter-spacing: 1.5px; color: #bbb; font-weight: 600; }
.user-chip {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; padding: 4px 10px;
  border-radius: 20px; background: #F0EFE8;
  border: 0.5px solid rgba(0,0,0,.1);
  cursor: pointer; color: #1a1a1a; font-family: inherit;
}
.dot-admin { width: 7px; height: 7px; border-radius: 50%; background: #E05D1A; }
.dot-emp   { width: 7px; height: 7px; border-radius: 50%; background: #1a8cd8; }
.gear-btn { background: none; border: none; cursor: pointer; padding: 6px; color: #888; display: flex; align-items: center; }

/* ── Sub topbar (inside company) ────── */
.sub-topbar {
  background: #fff;
  border-bottom: 0.5px solid rgba(0,0,0,.1);
  padding: 9px 14px;
  display: flex; align-items: center; gap: 10px;
  position: sticky; top: 0; z-index: 50;
}
.sub-topbar-name { font-size: 14px; font-weight: 700; color: #1a1a1a; }
.back-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: #888; padding: 0; }

/* ── Bottom nav ─────────────────────── */
.nav {
  display: flex; background: #fff;
  border-bottom: 0.5px solid rgba(0,0,0,.1);
  position: sticky; top: 52px; z-index: 50;
}
.nav-btn {
  flex: 1; padding: 9px 3px 7px;
  border: none; background: transparent;
  font-size: 10px; color: #888;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-family: inherit;
}
.nav-btn svg { width: 16px; height: 16px; }
.nav-btn.active { color: var(--accent, #1a1a1a); border-bottom: 2px solid var(--accent, #1a1a1a); }

/* ── Content ────────────────────────── */
.content { padding: 12px; }

/* ── Cards ──────────────────────────── */
.card { background: #fff; border: 0.5px solid rgba(0,0,0,.1); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
.card-row { display: flex; align-items: center; justify-content: space-between; }
.divider { border: none; border-top: 0.5px solid rgba(0,0,0,.08); margin: 10px 0; }

/* ── Company cards ──────────────────── */
.company-card {
  border-radius: 14px; padding: 16px;
  margin-bottom: 12px; cursor: pointer;
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 8px;
  border: none;
}
.company-card:active { opacity: .92; }
.company-name { font-size: 16px; font-weight: 700; color: #fff; }
.company-stats { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
.company-stat { font-size: 12px; color: rgba(255,255,255,.85); }
.company-arrow { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 22px; color: rgba(255,255,255,.45); }
.company-ata-badge { font-size: 11px; background: rgba(255,255,255,.22); color: #fff; padding: 2px 8px; border-radius: 20px; font-weight: 700; }

/* ── Section title ──────────────────── */
.sec { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .6px; margin: 14px 0 8px; }

/* ── Form ────────────────────────────── */
.field-group { margin-bottom: 10px; }
.field-label { font-size: 12px; color: #888; margin-bottom: 4px; }
.field {
  width: 100%; border: 0.5px solid rgba(0,0,0,.2);
  border-radius: 8px; padding: 8px 10px;
  font-size: 14px; background: #fff; color: #1a1a1a;
  font-family: inherit; outline: none;
}
.field:focus { border-color: var(--accent, #E05D1A); }
textarea.field { resize: vertical; min-height: 72px; }
select.field { appearance: none; cursor: pointer; }

/* ── Buttons ─────────────────────────── */
.btn-primary {
  width: 100%; padding: 10px;
  background: var(--accent, #E05D1A); color: #fff;
  border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600;
  cursor: pointer; margin-top: 8px; font-family: inherit;
}
.btn-primary:active { opacity: .85; }
.btn-secondary {
  padding: 6px 11px; background: transparent;
  border: 0.5px solid rgba(0,0,0,.2); border-radius: 8px;
  font-size: 12px; color: #1a1a1a; cursor: pointer; font-family: inherit;
}
.btn-orange { padding: 5px 10px; background: var(--accent, #E05D1A); color: #fff; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; }
.btn-danger { padding: 5px 8px; background: transparent; border: 0.5px solid #e24b4a; color: #a32d2d; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; }
.btn-success { padding: 5px 8px; background: transparent; border: 0.5px solid #2d9e5a; color: #1a7a3c; border-radius: 8px; font-size: 12px; cursor: pointer; font-family: inherit; }
.btn-back { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--accent, #E05D1A); cursor: pointer; background: none; border: none; padding: 0; margin-bottom: 12px; font-family: inherit; }
.btn-add { background: var(--accent, #E05D1A); border: none; color: #fff; border-radius: 8px; padding: 7px 12px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; }

/* ── Typography ──────────────────────── */
.proj-name { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.proj-sub { font-size: 13px; color: #888; margin-top: 2px; }
.entry-text { font-size: 14px; color: #1a1a1a; margin: 4px 0; line-height: 1.5; }

/* ── Badges ──────────────────────────── */
.badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
.badge-active { background: #FEF0E6; color: #B84B12; }
.badge-done   { background: #F0EFE8; color: #888; }
.badge-plan   { background: #E8F0FE; color: #1a56a4; }
.badge-ata-p  { background: #FEF0E6; color: #B84B12; }
.badge-ata-a  { background: #E6F7EE; color: #1a7a3c; }
.badge-ata-r  { background: #FEECEC; color: #a32d2d; }
.badge-viktig { background: #FEF0E6; color: #B84B12; }
.badge-bradsk { background: #FEECEC; color: #a32d2d; }
.role-badge-admin { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; background: #FEF0E6; color: #B84B12; }
.role-badge-emp   { font-size: 11px; padding: 2px 8px; border-radius: 20px; font-weight: 500; background: #E8F0FE; color: #1a56a4; }

/* ── Tags ────────────────────────────── */
.tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 3px 8px; background: #F0EFE8; border-radius: 20px; color: #666; margin-top: 4px; }

/* ── Photo grid ──────────────────────── */
.photo-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin-top: 8px; }
.photo-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; border: 0.5px solid rgba(0,0,0,.1); cursor: pointer; }
.photo-add-btn { border: 1.5px dashed rgba(0,0,0,.2); border-radius: 8px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #F0EFE8; flex-direction: column; gap: 3px; font-size: 11px; color: #888; }
.photo-wrap { position: relative; }
.photo-del { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,.6); color: #fff; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

/* ── Stat grid ───────────────────────── */
.stat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 12px; }
.stat-card { background: #F0EFE8; border-radius: 8px; padding: 12px; }
.stat-label { font-size: 12px; color: #888; margin-bottom: 4px; }
.stat-val { font-size: 21px; font-weight: 700; color: #1a1a1a; }

/* ── Toggle row ──────────────────────── */
.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 0.5px solid rgba(0,0,0,.08); }
.toggle-row:last-child { border-bottom: none; }
.checkbox { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid rgba(0,0,0,.2); cursor: pointer; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0; }
.checkbox.checked { background: var(--accent, #E05D1A); border-color: var(--accent, #E05D1A); }

/* ── Sub-tabs ────────────────────────── */
.sub-tabs { display: flex; background: #F0EFE8; border-radius: 8px; padding: 3px; margin-bottom: 14px; gap: 2px; }
.sub-tab { flex: 1; padding: 6px 4px; border: none; background: transparent; font-size: 12px; color: #888; cursor: pointer; border-radius: 6px; font-family: inherit; }
.sub-tab.active { background: #fff; color: #1a1a1a; font-weight: 600; }

/* ── Project chip selector ───────────── */
.chip-group { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.chip { padding: 5px 11px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 0.5px solid rgba(0,0,0,.15); background: #F0EFE8; color: #1a1a1a; font-family: inherit; }
.chip.selected { background: var(--accent, #E05D1A); color: #fff; border-color: var(--accent, #E05D1A); }

/* ── Time row ────────────────────────── */
.hours-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 8px; }
.hours-input { width: 56px; text-align: center; font-size: 17px; font-weight: 700; border: 0.5px solid rgba(0,0,0,.2); border-radius: 8px; padding: 6px 4px; background: #fff; color: #1a1a1a; font-family: inherit; outline: none; }

/* ── File row ────────────────────────── */
.file-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 0.5px solid rgba(0,0,0,.08); }
.file-row:last-child { border-bottom: none; }
.file-icon { width: 33px; height: 33px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.upload-btn { border: 1.5px dashed rgba(0,0,0,.2); border-radius: 8px; padding: 11px; display: flex; align-items: center; gap: 10px; cursor: pointer; background: #F0EFE8; color: #888; font-size: 13px; width: 100%; font-family: inherit; }

/* ── Lightbox ────────────────────────── */
.lightbox { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.9); display: flex; align-items: center; justify-content: center; z-index: 200; }
.lightbox img { max-width: 95%; max-height: 85vh; border-radius: 8px; }
.lightbox-close { position: fixed; top: 14px; right: 14px; color: #fff; font-size: 30px; cursor: pointer; background: none; border: none; line-height: 1; }

/* ── Announcement ────────────────────── */
.ann-card { background: #fff; border: 0.5px solid rgba(0,0,0,.1); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; }
.ann-title { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.ann-text { font-size: 13px; color: #1a1a1a; line-height: 1.55; }
.ann-meta { font-size: 11px; color: #888; margin-top: 5px; }
.ann-pinned { background: #FEF0E6; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; border-left: 3px solid #E05D1A; }
.ann-pinned-title { font-size: 13px; font-weight: 700; color: #B84B12; margin-bottom: 2px; }

/* ── Summary ─────────────────────────── */
.summary-wrap { background: #fff; border-radius: 12px; padding: 16px; }
.summary-header { text-align: center; padding-bottom: 12px; border-bottom: 0.5px solid rgba(0,0,0,.08); margin-bottom: 14px; }
.summary-entry { padding: 10px 0; border-bottom: 0.5px solid rgba(0,0,0,.08); }
.summary-entry:last-child { border-bottom: none; }
.summary-date { font-size: 11px; font-weight: 600; margin-bottom: 3px; display: flex; align-items: center; gap: 7px; }
.summary-text { font-size: 13px; color: #1a1a1a; line-height: 1.5; }
.summary-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 0.5px solid rgba(0,0,0,.08); font-size: 13px; }
.summary-row:last-child { border-bottom: none; }

/* ── Settings sheet ──────────────────── */
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.45); z-index: 100; display: flex; align-items: flex-end; }
.sheet { background: #fff; border-radius: 18px 18px 0 0; padding: 20px 16px 32px; width: 100%; max-height: 85vh; overflow-y: auto; }
.sheet-handle { width: 40px; height: 4px; background: rgba(0,0,0,.15); border-radius: 2px; margin: 0 auto 16px; }
.emp-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 0.5px solid rgba(0,0,0,.08); }
.emp-row:last-child { border-bottom: none; }
.info-box { background: #E8F0FE; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px; color: #1a56a4; line-height: 1.6; }

/* ── Empty ───────────────────────────── */
.empty { text-align: center; padding: 40px 20px; color: #888; font-size: 14px; }

/* ── Entry card ──────────────────────── */
.entry-card { background: #fff; border: 0.5px solid rgba(0,0,0,.1); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; }

/* ── ATA card ────────────────────────── */
.ata-card { background: #fff; border: 0.5px solid rgba(0,0,0,.1); border-radius: 12px; padding: 11px 13px; margin-bottom: 8px; }

@media (prefers-color-scheme: dark) {
  body { background: #111; color: #f0f0f0; }
  #root { background: #111; }
  .topbar, .nav, .card, .entry-card, .ann-card, .ata-card, .summary-wrap, .sheet { background: #222; border-color: rgba(255,255,255,.1); }
  .field { background: #222; color: #f0f0f0; border-color: rgba(255,255,255,.2); }
  .chip { background: #333; color: #f0f0f0; }
  .stat-card { background: #2a2a2a; }
  .sub-tabs { background: #2a2a2a; }
  .sub-tab.active { background: #222; color: #f0f0f0; }
  .checkbox { background: #222; }
  .upload-btn, .photo-add-btn { background: #2a2a2a; }
  .tag { background: #2a2a2a; color: #aaa; }
  .user-chip { background: #2a2a2a; color: #f0f0f0; }
  .ann-pinned { background: #3a2518; }
  .info-box { background: #1a2a3a; color: #7ab4f5; }
  .proj-name { color: #f0f0f0; }
  .ann-title { color: #f0f0f0; }
  .ann-text { color: #ddd; }
  .summary-text { color: #ddd; }
  .entry-text { color: #ddd; }
}
