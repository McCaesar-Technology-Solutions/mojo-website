-- Seed full launch inventory (run after migration). Idempotent on property slug/pricing.
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
  'request',
  'Accra',
  'Cantonments',
  'A refined two-bedroom retreat in the heart of Cantonments. Floor-to-ceiling windows, locally-curated art, and a private terrace overlooking the embassy gardens.',
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
  'A refined two-bedroom retreat in the heart of Cantonments.',
  2, 2, 4, 120, 4.9, 48, true,
  '["Quiet hours observed from 10:00 PM to 7:00 AM","Maximum overnight guests as listed","No parties or events without prior approval","Valid government ID required at check-in"]'::jsonb,
  '[{"title":"Check-in","detail":"From 3:00 PM","icon":"solar:login-3-linear"},{"title":"Check-out","detail":"Before 11:00 AM","icon":"solar:logout-3-linear"},{"title":"No Smoking","detail":"Inside the residence","icon":"solar:smoking-linear"},{"title":"Pet Friendly","detail":"Small pets welcome","icon":"solar:dog-linear"}]'::jsonb
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
  'Garden-facing suites with calm interiors for business and leisure travelers in Kumasi.',
  2, 1, 3, 95, 4.8, 32, true,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222204',
  'harbor-view-apartments',
  'Harbor View Apartments',
  'Hotel',
  'published',
  'request',
  'Takoradi',
  null,
  'Coastal stays with modern amenities near the waterfront.',
  1, 1, 2, 70, 4.7, 21, true,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222205',
  'port-city-lofts',
  'Port City Lofts',
  'Apartment',
  'published',
  'request',
  'Tema',
  null,
  'Bright lofts for short stays near Tema’s business corridor.',
  1, 1, 2, 65, 4.6, 18, true,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222206',
  'executive-garden-room',
  'Executive Garden Room',
  'Hotel',
  'published',
  'request',
  'Accra',
  'Airport Residential',
  'Quiet executive rooms near the airport corridor.',
  1, 1, 2, 55, 4.7, 40, false,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222207',
  'serviced-apartment-east-legon',
  'Serviced Apartment',
  'Serviced',
  'published',
  'request',
  'Accra',
  'East Legon',
  'Fully serviced apartment for extended Accra stays.',
  2, 2, 4, 110, 4.8, 27, false,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  '22222222-2222-2222-2222-222222222208',
  'corporate-suite-ridge',
  'Corporate Suite',
  'Suite',
  'published',
  'request',
  'Accra',
  'Ridge',
  'Workspace-ready suite in Ridge for corporate travelers.',
  1, 1, 2, 80, 4.85, 35, false,
  '[]'::jsonb,
  '[]'::jsonb
)
on conflict (slug) do nothing;

insert into public.property_pricing (property_id, nightly_rate, original_nightly_rate, cleaning_fee, service_fee_rate, discount_label)
values
  ('22222222-2222-2222-2222-222222222201', 2400, 3000, 300, 0.046875, '-20% This Week'),
  ('22222222-2222-2222-2222-222222222202', 1850, null, 250, 0.046875, null),
  ('22222222-2222-2222-2222-222222222203', 1200, null, 200, 0.046875, null),
  ('22222222-2222-2222-2222-222222222204', 1450, null, 220, 0.046875, null),
  ('22222222-2222-2222-2222-222222222205', 980, null, 180, 0.046875, null),
  ('22222222-2222-2222-2222-222222222206', 1800, 2100, 250, 0.046875, '-15% Weekend'),
  ('22222222-2222-2222-2222-222222222207', 1500, 1900, 250, 0.046875, '-21% Monthly'),
  ('22222222-2222-2222-2222-222222222208', 2100, 2500, 280, 0.046875, '-16% Stay 3+')
on conflict (property_id) do nothing;

insert into public.property_media (property_id, url, sort_order, is_cover) values
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1200&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222201', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg', 1, false),
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?auto=format&fit=crop&w=600&q=80', 2, false),
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=600&q=80', 3, false),
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=600&q=80', 4, false),
  ('22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', 5, false),
  ('22222222-2222-2222-2222-222222222202', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222203', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222204', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222205', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222206', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/917d6f93-fb36-439a-8c48-884b67b35381_1600w.jpg', 0, true),
  ('22222222-2222-2222-2222-222222222207', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', 0, true),
  ('22222222-2222-2222-2222-222222222208', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 0, true);

insert into public.property_amenities (property_id, amenity_id)
select p.id, a.id
from public.properties p
cross join public.amenities a
where p.id in (
  '22222222-2222-2222-2222-222222222201',
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222203',
  '22222222-2222-2222-2222-222222222204',
  '22222222-2222-2222-2222-222222222205',
  '22222222-2222-2222-2222-222222222206',
  '22222222-2222-2222-2222-222222222207',
  '22222222-2222-2222-2222-222222222208'
)
on conflict do nothing;
