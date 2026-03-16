-- ── Tambah kolom epoch_duration ke tabel goals ────────────────────────────
--
-- FIX — Non-Custodial Epoch Duration
--
-- Masalah lama:
--   epochDuration hanya disimpan on-chain di kontrak (pos.epochDuration).
--   Backend scheduler hardcode 30 hari — tidak baca preferensi user.
--   Akibat:
--     - User mingguan (7 hari) tidak di-reset selama 3 minggu
--     - SpendLimitExceeded padahal user sudah top-up wallet
--     - User kehilangan 3 minggu saving tanpa tahu kenapa
--
-- Fix:
--   Simpan epochDuration di DB agar scheduler bisa baca dan reset
--   sesuai preferensi user (mingguan atau bulanan).
--
--   Unit: INTERVAL (PostgreSQL native) — mudah dibandingkan dengan timestamp.
--   Contoh nilai:
--     '7 days'   → user pilih saving mingguan
--     '30 days'  → user pilih saving bulanan
--
--   Default: '7 days' untuk backward compatibility dengan goal yang sudah ada.
--   Goal lama yang tidak punya epochDuration akan di-treat sebagai mingguan.

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS epoch_duration INTERVAL NOT NULL DEFAULT '7 days';

-- Index untuk query goals yang perlu epoch reset
-- Agent scheduler bisa query: WHERE epoch_start + epoch_duration <= NOW()
CREATE INDEX IF NOT EXISTS idx_goals_epoch_reset
  ON goals (epoch_start, epoch_duration)
  WHERE status IN ('active', 'action_required');

-- Komentar untuk dokumentasi
COMMENT ON COLUMN goals.epoch_duration IS
  'Durasi satu saving cycle user. 7 days = mingguan, 30 days = bulanan.
   Di-set saat registerGoal() dan bisa diupdate via setEpochDuration().
   Scheduler reset cumulativeSpent setiap epoch_duration berlalu.
   On-chain: SentinelExecutor.pos.epochDuration enforce nilai minimum ini.';
