import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

export async function GET() {
  try {
    const result = {
      supabaseConfigured: isSupabaseConfigured,
      envVars: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      timestamp: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      return Response.json({
        ...result,
        error: 'Supabase not configured'
      }, { status: 500 });
    }

    // Test basic query
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    result.testQuery = { data, error };

    return Response.json(result);
  } catch (error) {
    return Response.json({
      error: error.message,
      supabaseConfigured: isSupabaseConfigured,
      envVars: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }, { status: 500 });
  }
}
