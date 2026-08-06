-- Allow admins to permanently delete moderated reviews.
create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_admin());
