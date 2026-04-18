-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES ENUM
CREATE TYPE user_role_enum AS ENUM ('subscriber', 'admin');

-- SUBSCRIPTION ENUMS
CREATE TYPE plan_type_enum AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'inactive', 'cancelled', 'lapsed');

-- DRAW ENUMS
CREATE TYPE draw_type_enum AS ENUM ('random', 'algorithmic');
CREATE TYPE draw_status_enum AS ENUM ('pending', 'simulated', 'published');

-- PRIZES ENUMS
CREATE TYPE match_type_enum AS ENUM ('5_match', '4_match', '3_match');
CREATE TYPE payout_status_enum AS ENUM ('pending', 'proof_submitted', 'approved', 'rejected', 'paid');

-- DONATIONS ENUMS
CREATE TYPE donation_status_enum AS ENUM ('pending', 'completed', 'failed');


-- PROFILES (Auth extended)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL DEFAULT 'subscriber'
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type plan_type_enum NOT NULL,
  status subscription_status_enum NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCORES
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_value INT NOT NULL CHECK (score_value >= 1 AND score_value <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, score_date)
);

-- DRAWS
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month DATE NOT NULL,
  draw_type draw_type_enum NOT NULL,
  status draw_status_enum NOT NULL DEFAULT 'pending',
  drawn_numbers INT[] DEFAULT ARRAY[]::INT[],
  jackpot_rollover BOOL DEFAULT FALSE,
  total_pool_amount NUMERIC DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAW ENTRIES
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scores_snapshot INT[] DEFAULT ARRAY[]::INT[],
  match_count INT DEFAULT 0,
  is_winner BOOL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRIZE POOLS
CREATE TABLE IF NOT EXISTS public.prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  match_type match_type_enum NOT NULL,
  pool_percentage NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  per_winner_amount NUMERIC NOT NULL DEFAULT 0,
  rolled_over BOOL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WINNER PAYOUTS
CREATE TABLE IF NOT EXISTS public.winner_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_type match_type_enum NOT NULL,
  amount NUMERIC NOT NULL,
  status payout_status_enum NOT NULL DEFAULT 'pending',
  proof_url TEXT,
  admin_notes TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHARITIES
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  website_url TEXT,
  is_featured BOOL DEFAULT FALSE,
  is_active BOOL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHARITY EVENTS
CREATE TABLE IF NOT EXISTS public.charity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER CHARITY CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS public.user_charity_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  contribution_percentage NUMERIC DEFAULT 10 CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  is_active BOOL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEPENDENT DONATIONS
CREATE TABLE IF NOT EXISTS public.independent_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  charity_id UUID NOT NULL REFERENCES public.charities(id),
  amount NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  status donation_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.independent_donations ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view their own profile, admins can view all.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());

-- User Roles: Users can view their own role, admins can view all.
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Subscriptions: Users can view their own, admins manage all.
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update subscriptions" ON public.subscriptions FOR UPDATE USING (public.is_admin());

-- Scores: Users can view/create own, admins manage all.
CREATE POLICY "Users can view own scores" ON public.scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON public.scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON public.scores FOR ALL USING (public.is_admin());

-- Draws: Public can view published draws, admins manage all.
CREATE POLICY "Anyone can view published draws" ON public.draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage draws" ON public.draws FOR ALL USING (public.is_admin());

-- Draw Entries: Users view own entries, admins view all.
CREATE POLICY "Users can view own entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON public.draw_entries FOR SELECT USING (public.is_admin());

-- Prize Pools: Public can view published prize pools.
CREATE POLICY "Anyone can view prize pools" ON public.prize_pools FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.draws WHERE draws.id = prize_pools.draw_id AND status = 'published')
);
CREATE POLICY "Admins can manage prize pools" ON public.prize_pools FOR ALL USING (public.is_admin());

-- Winner Payouts: Users view own and update own (e.g. proof submit), admins manage all.
CREATE POLICY "Users can view own payouts" ON public.winner_payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own payout proofs" ON public.winner_payouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payouts" ON public.winner_payouts FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all payouts" ON public.winner_payouts FOR UPDATE USING (public.is_admin());

-- Charities: Public can view active charities, admins manage all.
CREATE POLICY "Anyone can view charities" ON public.charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can view all charities" ON public.charities FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage charities" ON public.charities FOR ALL USING (public.is_admin());

-- Charity Events: Public can view, admins manage all.
CREATE POLICY "Anyone can view charity events" ON public.charity_events FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage charity events" ON public.charity_events FOR ALL USING (public.is_admin());

-- User Charity Contributions: Users manage own, admins view all.
CREATE POLICY "Users can manage own contributions" ON public.user_charity_contributions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contributions" ON public.user_charity_contributions FOR SELECT USING (public.is_admin());

-- Independent Donations: Users view own, admins view all.
CREATE POLICY "Users can view own donations" ON public.independent_donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own donations" ON public.independent_donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all donations" ON public.independent_donations FOR SELECT USING (public.is_admin());

-- Functions and Triggers
-- Insert into public.profiles after auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to avoid errors on run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Maintain 5 scores maximum: delete oldest score on 6th insert for a user
CREATE OR REPLACE FUNCTION public.enforce_five_scores_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.scores WHERE user_id = NEW.user_id) > 5 THEN
    DELETE FROM public.scores
    WHERE id = (
      SELECT id FROM public.scores
      WHERE user_id = NEW.user_id
      ORDER BY score_date ASC
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_score_inserted ON public.scores;
CREATE TRIGGER on_score_inserted
  AFTER INSERT ON public.scores
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_five_scores_limit();

-- Create storage buckets
-- Note: Assuming storage is standard supabase schema
INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('charity-images', 'charity-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true) ON CONFLICT DO NOTHING;

-- Storage RLS setup helper since storage API is complex - we'll keep it simple for pure SQL
CREATE POLICY "Winner proofs: accessible to owner" ON storage.objects FOR SELECT USING (bucket_id = 'winner-proofs' AND auth.uid() = owner);
CREATE POLICY "Winner proofs: inserts by owner" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'winner-proofs' AND auth.uid() = owner);
CREATE POLICY "Winner proofs: admins read all" ON storage.objects FOR SELECT USING (bucket_id = 'winner-proofs' AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')));

CREATE POLICY "Charity images: public read" ON storage.objects FOR SELECT USING (bucket_id = 'charity-images');
CREATE POLICY "Charity images: admins manage" ON storage.objects FOR ALL USING (bucket_id = 'charity-images' AND (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')));

CREATE POLICY "User avatars: public read" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "User avatars: insert by owner" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.uid() = owner);
CREATE POLICY "User avatars: delete by owner" ON storage.objects FOR DELETE USING (bucket_id = 'user-avatars' AND auth.uid() = owner);
