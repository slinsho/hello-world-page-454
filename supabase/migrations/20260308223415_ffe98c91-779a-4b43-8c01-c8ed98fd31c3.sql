-- Revoke execute on notify_all_admins from public (blocks anon)
REVOKE EXECUTE ON FUNCTION public.notify_all_admins(text, text, text, uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.notify_all_admins(text, text, text, uuid) FROM anon;

-- Grant only to authenticated users
GRANT EXECUTE ON FUNCTION public.notify_all_admins(text, text, text, uuid) TO authenticated;