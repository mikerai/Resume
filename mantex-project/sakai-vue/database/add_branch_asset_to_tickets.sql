-- Add branch_id and asset_id to tickets table
-- This enables linking tickets to specific branches and assets

-- 1. Add branch_id column
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.client_branches(id) ON DELETE SET NULL;

-- 2. Add asset_id column
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.client_assets(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_branch_id ON public.tickets(branch_id);
CREATE INDEX IF NOT EXISTS idx_tickets_asset_id ON public.tickets(asset_id);

-- 4. Reload schema cache to make relationships visible to PostgREST
NOTIFY pgrst, 'reload config';

SELECT '✅ Successfully added branch_id and asset_id to tickets table' as status;
