-- Migration: Add foreign key constraint for supplier_id in tickets table
-- This enables Supabase relationship detection for supplier_profiles

ALTER TABLE public.tickets
ADD CONSTRAINT tickets_supplier_id_fkey
FOREIGN KEY (supplier_id)
REFERENCES public.supplier_profiles (id)
ON DELETE SET NULL;
