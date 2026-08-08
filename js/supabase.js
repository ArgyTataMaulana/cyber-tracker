/* ============================================================
   StudyHub v2 — Supabase Cloud Sync & Authentication Module
   ============================================================ */

// Ganti URL & ANON_KEY ini dengan kunci dari Dashboard Supabase Anda (https://supabase.com)
window.SUPABASE_URL = window.SUPABASE_URL || 'https://hbptsclibymsavehkwgl.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_YgdyNrZWtwG6QN9TtSjEFw_mIze--z2';

let supabaseClient = null;

/**
 * Inisialisasi Supabase Client jika SDK tersedia
 */
function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            if (window.SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID')) {
                console.log('[Supabase] Credential default terdeteksi. Berjalan dalam Local Fallback Mode.');
                return null;
            }
            supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            console.log('[Supabase] Client terhubung dengan sukses!');
            return supabaseClient;
        } catch (e) {
            console.warn('[Supabase] Inisialisasi gagal:', e);
            return null;
        }
    }
    return null;
}

/**
 * Memeriksa apakah Supabase sudah dikonfigurasi dengan URL & Key asli
 */
function isSupabaseConfigured() {
    return supabaseClient !== null && !window.SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID');
}

/**
 * Memunculkan login Google via Supabase OAuth
 */
async function loginWithGoogle() {
    if (!isSupabaseConfigured()) {
        showToast('Konfigurasikan SUPABASE_URL & ANON_KEY di js/supabase.js terlebih dahulu!', 'warning');
        return;
    }
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error('[Supabase Auth Error]', err);
        showToast('Login Google gagal: ' + err.message, 'error');
    }
}

/**
 * Mengirim Magic Link Login ke Email (Tanpa Password)
 */
async function loginWithEmail(email) {
    if (!isSupabaseConfigured()) {
        showToast('Konfigurasikan SUPABASE_URL & ANON_KEY di js/supabase.js terlebih dahulu!', 'warning');
        return;
    }
    try {
        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
        showToast('🚀 Magic link login telah dikirim ke ' + email + '! Cek inbox emailmu.', 'success');
    } catch (err) {
        console.error('[Supabase Auth Error]', err);
        showToast('Login Email gagal: ' + err.message, 'error');
    }
}

/**
 * Logout dari Supabase
 */
async function logoutCloud() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        showToast('Berhasil keluar dari Cloud Account.', 'info');
        setTimeout(() => window.location.reload(), 800);
    }
}

/**
 * Mendapatkan pengguna yang sedang terautentikasi
 */
async function getCloudUser() {
    if (!supabaseClient) return null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

let cloudSyncTimer = null;

/**
 * Menyinkronkan data state lokal ke Supabase dengan Debounce Queue (2.5 detik)
 * Mencegah badai HTTP Request & API Rate Limiting (429)
 */
function syncStateToCloud(state) {
    if (!isSupabaseConfigured()) return;
    updateCloudBadgeStatus('syncing');

    if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(() => {
        syncStateToCloudNow(state);
    }, 2500);
}

/**
 * Pengiriman langsung ke Cloud tanpa antrean (Instant Sync)
 */
async function syncStateToCloudNow(state) {
    if (!isSupabaseConfigured()) return;
    try {
        const user = await getCloudUser();
        if (!user) return; // Pengguna belum login

        const payload = {
            user_id: user.id,
            data: state,
            updated_at: state.updatedAt || new Date().toISOString()
        };

        const { error } = await supabaseClient
            .from('user_data')
            .upsert(payload, { onConflict: 'user_id' });

        if (error) {
            console.error('[Supabase Sync Error]', error);
            updateCloudBadgeStatus('local');
        } else {
            console.log('[Supabase Sync] Data berhasil disinkronkan ke Cloud ☁️ (Debounced Queue)');
            updateCloudBadgeStatus('synced');
        }
    } catch (err) {
        console.warn('[Supabase Sync Ex]', err);
        updateCloudBadgeStatus('local');
    }
}

/**
 * Memuat data dari Supabase dengan Resolusi Konflik Stempel Waktu LWW (Last-Write-Wins)
 */
async function fetchStateFromCloud() {
    if (!isSupabaseConfigured()) return null;
    try {
        const user = await getCloudUser();
        if (!user) return null;

        const { data, error } = await supabaseClient
            .from('user_data')
            .select('data, updated_at')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('[Supabase Fetch Error]', error);
            return null;
        }

        if (!data || !data.data) return null;

        // Last-Write-Wins Conflict Resolution
        const cloudState = data.data;
        const localState = typeof getState === 'function' ? getState() : null;

        if (localState && localState.updatedAt && cloudState.updatedAt) {
            const localTime = new Date(localState.updatedAt).getTime();
            const cloudTime = new Date(cloudState.updatedAt).getTime();

            if (localTime > cloudTime) {
                console.log('[Supabase Conflict LWW] Data lokal lebih baru dari Cloud. Mengunggah versi lokal...');
                syncStateToCloudNow(localState);
                return localState;
            }
        }

        return cloudState;
    } catch (err) {
        console.warn('[Supabase Fetch Ex]', err);
        return null;
    }
}

/**
 * Memperbarui tampilan indikator badge Cloud Sync di UI
 */
function updateCloudBadgeStatus(status) {
    const badges = document.querySelectorAll('.cloud-sync-badge');
    badges.forEach(b => {
        if (status === 'synced') {
            b.className = 'cloud-sync-badge synced';
            b.innerHTML = '☁️ Tersinkronisasi';
            b.title = 'Data tersimpan aman di Cloud';
        } else if (status === 'syncing') {
            b.className = 'cloud-sync-badge syncing';
            b.innerHTML = '🔄 Menyinkronkan...';
        } else {
            b.className = 'cloud-sync-badge local';
            b.innerHTML = '📱 Mode Lokal';
            b.title = 'Data tersimpan di perangkat ini';
        }
    });
}

// Inisialisasi awal saat script dimuat
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
