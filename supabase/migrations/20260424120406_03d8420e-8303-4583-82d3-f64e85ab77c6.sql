-- Add support for multiple images on products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';

-- Create public storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin')
);