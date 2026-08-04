-- Seed amenities + demo properties (run after migration)
-- Bootstrap an admin AFTER signup:
--   update public.profiles set role = 'admin' where id = '<user-uuid>';

insert into public.amenities (id, label, icon, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'High-Speed Wi-Fi', 'solar:wi-fi-router-bold', 1),
  ('11111111-1111-1111-1111-111111111102', 'Private Bathroom', 'solar:bath-bold', 2),
  ('11111111-1111-1111-1111-111111111103', 'Fully Equipped Kitchen', 'solar:chef-hat-bold', 3),
  ('11111111-1111-1111-1111-111111111104', 'Central Air Conditioning', 'solar:snowflake-bold', 4),
  ('11111111-1111-1111-1111-111111111105', 'Smart TV with Netflix', 'solar:tv-bold', 5),
  ('11111111-1111-1111-1111-111111111106', 'In-unit Washer & Dryer', 'solar:washing-machine-bold', 6),
  ('11111111-1111-1111-1111-111111111107', 'Secure Parking', 'solar:parking-bold', 7),
  ('11111111-1111-1111-1111-111111111108', '24/7 Security', 'solar:shield-keyhole-bold', 8)
on conflict (label) do nothing;

insert into public.properties (
  id, slug, title, type, status, booking_mode, city, area, description,
  bedrooms, bathrooms, max_guests, size_sqm, rating, review_count, is_featured,
  house_rules, policies
) values
(
  '22222222-2222-2222-2222-222222222201',
  'mojo-luxury-suite',
  'MOJO Luxury Suite',
  'Suite',
  'published',
  'instant',
  'Accra',
  'Cantonments',
  'A refined two-bedroom retreat in the heart of Cantonments.',
  2, 2, 4, 120, 4.95, 128, true,
  '["Quiet hours observed from 10:00 PM to 7:00 AM","Maximum 4 overnight guests","No parties or events without prior approval","Valid government ID required at check-in"]'::jsonb,
  '[{"title":"Check-in","detail":"From 3:00 PM","icon":"solar:login-3-linear"},{"title":"Check-out","detail":"Before 11:00 AM","icon":"solar:logout-3-linear"},{"title":"No Smoking","detail":"Inside the residence","icon":"solar:smoking-linear"},{"title":"Pet Friendly","detail":"Small pets welcome","icon":"solar:dog-linear"}]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222202',
  'royal-heights-residence',
  'Royal Heights Residence',
  'Apartment',
  'published',
  'request',
  'Accra',
  'Cantonments',
  'Premium apartment living in Cantonments.',
  2, 2, 4, 120, 4.9, 48, true,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222203',
  'ashanti-garden-suites',
  'Ashanti Garden Suites',
  'Apartment',
  'published',
  'request',
  'Kumasi',
  null,
  'Garden-facing suites in Kumasi.',
  2, 1, 3, 95, 4.8, 32, true,
  '[]'::jsonb,
  '[]'::jsonb
)
on conflict (slug) do nothing;

insert into public.property_pricing (property_id, nightly_rate, original_nightly_rate, cleaning_fee, service_fee_rate, discount_label)
values
  ('22222222-2222-2222-2222-222222222201', 2400, 3000, 300, 0.046875, '-20% This Week'),
  ('22222222-2222-2222-2222-222222222202', 1850, null, 250, 0.046875, null),
  ('22222222-2222-2222-2222-222222222203', 1200, null, 200, 0.046875, null)
on conflict (property_id) do nothing;

insert into public.property_media (property_id, url, sort_order, is_cover) values
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1200&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', 1, false),
  ('22222222-2222-2222-2222-222222222202', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222203', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', 0, true);

insert into public.property_amenities (property_id, amenity_id)
select p.id, a.id
from public.properties p
cross join public.amenities a
where p.slug in ('mojo-luxury-suite', 'royal-heights-residence', 'ashanti-garden-suites')
on conflict do nothing;
