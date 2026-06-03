CREATE POLICY usage_insert ON usage_counters FOR INSERT
  WITH CHECK (is_org_member(organization_id));

CREATE POLICY usage_update ON usage_counters FOR UPDATE
  USING (is_org_member(organization_id));

-- Service role bypasses RLS; stripe_webhook_events has no user policies (service only)
