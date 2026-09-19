import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lấy thông tin Supabase từ environment variables (Vite) hoặc localStorage (cho phép nhập từ giao diện UI)
export const getSupabaseConfig = (): { url: string; anonKey: string } => {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL || '';
  const envAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

  let localUrl = '';
  let localAnonKey = '';
  try {
    localUrl = localStorage.getItem('badminton_supabase_url') || '';
    localAnonKey = localStorage.getItem('badminton_supabase_anon_key') || '';
  } catch {}

  return {
    url: localUrl || envUrl || '',
    anonKey: localAnonKey || envAnonKey || ''
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (e) {
      console.warn('Lỗi khởi tạo Supabase Client:', e);
      return null;
    }
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  try {
    localStorage.setItem('badminton_supabase_url', url.trim());
    localStorage.setItem('badminton_supabase_anon_key', anonKey.trim());
    supabaseInstance = null; // Reset để khởi tạo lại
  } catch (e) {
    console.error('Không thể lưu cấu hình Supabase vào localStorage:', e);
  }
};

export const clearSupabaseConfig = (): void => {
  try {
    localStorage.removeItem('badminton_supabase_url');
    localStorage.removeItem('badminton_supabase_anon_key');
    supabaseInstance = null;
  } catch (e) {
    console.error('Không thể xóa cấu hình Supabase:', e);
  }
};

// Kiểm tra kết nối Supabase Cloud thực tế
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Chưa cấu hình Supabase URL hoặc Anon Key hợp lệ!'
    };
  }

  try {
    // Thử truy vấn bảng facilities hoặc lấy thông tin hệ thống
    const { error } = await client.from('facilities').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          success: true,
          message: 'Kết nối Supabase thành công! (Chưa chạy file SQL tạo bảng, hãy bấm Chạy SQL Schema).'
        };
      }
      return {
        success: false,
        message: `Lỗi Supabase: ${error.message} (${error.code || 'UNKNOWN'})`
      };
    }

    return {
      success: true,
      message: 'Kết nối Supabase Cloud Database thành công 100%!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối: ${err?.message || 'Không thể kết nối tới Supabase'}`
    };
  }
};
