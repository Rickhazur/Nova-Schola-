-- Add status column to student_profiles if not exists
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create remedial_programs table (program templates)
CREATE TABLE public.remedial_programs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    description TEXT,
    default_duration_weeks INTEGER NOT NULL DEFAULT 4,
    created_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_remedial_programs table (assignments)
CREATE TABLE public.student_remedial_programs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.remedial_programs(id) ON DELETE SET NULL,
    custom_title TEXT,
    goals TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_coins table
CREATE TABLE public.student_coins (
    student_id UUID NOT NULL PRIMARY KEY REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coin_transactions table
CREATE TABLE public.coin_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'adjust')),
    reason TEXT NOT NULL,
    created_by_admin_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table (Tienda Nova catalog)
CREATE TABLE public.rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cost_coins INTEGER NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.student_profiles(user_id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivered_by_admin_id UUID
);

-- Enable RLS on all tables
ALTER TABLE public.remedial_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_remedial_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS for remedial_programs (admins manage, all authenticated can view active)
CREATE POLICY "Admins can do everything on remedial_programs" 
ON public.remedial_programs FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view active programs" 
ON public.remedial_programs FOR SELECT 
USING (is_active = true);

-- RLS for student_remedial_programs
CREATE POLICY "Admins can do everything on student_remedial_programs" 
ON public.student_remedial_programs FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own remedial programs" 
ON public.student_remedial_programs FOR SELECT 
USING (auth.uid() = student_id);

-- RLS for student_coins
CREATE POLICY "Admins can do everything on student_coins" 
ON public.student_coins FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own coins" 
ON public.student_coins FOR SELECT 
USING (auth.uid() = student_id);

-- RLS for coin_transactions
CREATE POLICY "Admins can do everything on coin_transactions" 
ON public.coin_transactions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own transactions" 
ON public.coin_transactions FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert spend transactions" 
ON public.coin_transactions FOR INSERT 
WITH CHECK (auth.uid() = student_id AND type = 'spend');

-- RLS for rewards (everyone can view active, admins manage)
CREATE POLICY "Admins can do everything on rewards" 
ON public.rewards FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active rewards" 
ON public.rewards FOR SELECT 
USING (is_active = true);

-- RLS for reward_redemptions
CREATE POLICY "Admins can do everything on reward_redemptions" 
ON public.reward_redemptions FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own redemptions" 
ON public.reward_redemptions FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own redemptions" 
ON public.reward_redemptions FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Create triggers for updated_at
CREATE TRIGGER update_remedial_programs_updated_at
BEFORE UPDATE ON public.remedial_programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_remedial_programs_updated_at
BEFORE UPDATE ON public.student_remedial_programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_coins_updated_at
BEFORE UPDATE ON public.student_coins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
BEFORE UPDATE ON public.rewards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize student coins when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_student_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_coins (student_id, balance, total_earned, total_spent)
  VALUES (NEW.user_id, 0, 0, 0)
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create coins record for new students
CREATE TRIGGER on_student_profile_created
AFTER INSERT ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_student_coins();