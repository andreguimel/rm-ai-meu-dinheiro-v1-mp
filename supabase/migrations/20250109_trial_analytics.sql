-- Trial Analytics and Monitoring Migration
-- This migration adds comprehensive analytics tracking for trial functionality

-- Create trial_events table for tracking all trial-related events
CREATE TABLE IF NOT EXISTS trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'trial_created',
    'trial_accessed',
    'trial_expired',
    'trial_converted',
    'trial_error'
  )),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trial_events_user_id ON trial_events (user_id);
CREATE INDEX IF NOT EXISTS idx_trial_events_type ON trial_events (event_type);
CREATE INDEX IF NOT EXISTS idx_trial_events_created_at ON trial_events (created_at);

-- Create trial_analytics_summary table for aggregated data
CREATE TABLE IF NOT EXISTS trial_analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  trials_created INTEGER DEFAULT 0,
  trials_accessed INTEGER DEFAULT 0,
  trials_expired INTEGER DEFAULT 0,
  trials_converted INTEGER DEFAULT 0,
  trial_errors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per date
  UNIQUE(date)
);

-- Function to log trial events
CREATE OR REPLACE FUNCTION log_trial_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  -- Insert the event
  INSERT INTO trial_events (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data)
  RETURNING id INTO event_id;
  
  -- Update daily summary
  INSERT INTO trial_analytics_summary (date, trials_created, trials_accessed, trials_expired, trials_converted, trial_errors)
  VALUES (
    CURRENT_DATE,
    CASE WHEN p_event_type = 'trial_created' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'trial_accessed' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'trial_expired' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'trial_converted' THEN 1 ELSE 0 END,
    CASE WHEN p_event_type = 'trial_error' THEN 1 ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    trials_created = trial_analytics_summary.trials_created + 
      CASE WHEN p_event_type = 'trial_created' THEN 1 ELSE 0 END,
    trials_accessed = trial_analytics_summary.trials_accessed + 
      CASE WHEN p_event_type = 'trial_accessed' THEN 1 ELSE 0 END,
    trials_expired = trial_analytics_summary.trials_expired + 
      CASE WHEN p_event_type = 'trial_expired' THEN 1 ELSE 0 END,
    trials_converted = trial_analytics_summary.trials_converted + 
      CASE WHEN p_event_type = 'trial_converted' THEN 1 ELSE 0 END,
    trial_errors = trial_analytics_summary.trial_errors + 
      CASE WHEN p_event_type = 'trial_error' THEN 1 ELSE 0 END,
    updated_at = NOW();
    
  RETURN event_id;
END;
$$;

-- Function to get trial analytics for a date range
CREATE OR REPLACE FUNCTION get_trial_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  trials_created INTEGER,
  trials_accessed INTEGER,
  trials_expired INTEGER,
  trials_converted INTEGER,
  trial_errors INTEGER,
  conversion_rate NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.date,
    s.trials_created,
    s.trials_accessed,
    s.trials_expired,
    s.trials_converted,
    s.trial_errors,
    CASE 
      WHEN s.trials_created > 0 THEN 
        ROUND((s.trials_converted::NUMERIC / s.trials_created::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM trial_analytics_summary s
  WHERE s.date BETWEEN start_date AND end_date
  ORDER BY s.date DESC;
END;
$$;

-- Function to get user trial journey
CREATE OR REPLACE FUNCTION get_user_trial_journey(p_user_id UUID)
RETURNS TABLE (
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.event_type,
    te.event_data,
    te.created_at
  FROM trial_events te
  WHERE te.user_id = p_user_id
  ORDER BY te.created_at ASC;
END;
$$;

-- Function to get trial conversion funnel
CREATE OR REPLACE FUNCTION get_trial_conversion_funnel(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_trials_created INTEGER,
  total_trials_accessed INTEGER,
  total_trials_converted INTEGER,
  access_rate NUMERIC,
  conversion_rate NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(s.trials_created)::INTEGER as total_trials_created,
    SUM(s.trials_accessed)::INTEGER as total_trials_accessed,
    SUM(s.trials_converted)::INTEGER as total_trials_converted,
    CASE 
      WHEN SUM(s.trials_created) > 0 THEN 
        ROUND((SUM(s.trials_accessed)::NUMERIC / SUM(s.trials_created)::NUMERIC) * 100, 2)
      ELSE 0
    END as access_rate,
    CASE 
      WHEN SUM(s.trials_created) > 0 THEN 
        ROUND((SUM(s.trials_converted)::NUMERIC / SUM(s.trials_created)::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM trial_analytics_summary s
  WHERE s.date BETWEEN start_date AND end_date;
END;
$$;

-- Enable RLS on analytics tables
ALTER TABLE trial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics tables (admin access only)
CREATE POLICY "Admin can view all trial events" ON trial_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscribers s 
      WHERE s.user_id = auth.uid() 
      AND s.subscription_tier = 'Admin'
    )
  );

CREATE POLICY "Admin can view trial analytics summary" ON trial_analytics_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscribers s 
      WHERE s.user_id = auth.uid() 
      AND s.subscription_tier = 'Admin'
    )
  );

-- Grant execute permissions on analytics functions to authenticated users
GRANT EXECUTE ON FUNCTION log_trial_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_trial_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_trial_journey TO authenticated;
GRANT EXECUTE ON FUNCTION get_trial_conversion_funnel TO authenticated;