export type JobStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type MemberRole = "owner" | "admin" | "member";
export type PlanTier = "free" | "pro" | "team";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<{
        id: string;
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
        default_org_id: string | null;
        created_at: string;
        updated_at: string;
      }, {
        id: string;
        email?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
        default_org_id?: string | null;
        created_at?: string;
        updated_at?: string;
      }>;
      organizations: TableDef<{
        id: string;
        name: string;
        slug: string;
        stripe_customer_id: string | null;
        created_at: string;
        updated_at: string;
      }, {
        id?: string;
        name: string;
        slug: string;
        stripe_customer_id?: string | null;
        created_at?: string;
        updated_at?: string;
      }>;
      organization_members: TableDef<{
        id: string;
        organization_id: string;
        user_id: string;
        role: MemberRole;
        created_at: string;
      }, {
        id?: string;
        organization_id: string;
        user_id: string;
        role?: MemberRole;
        created_at?: string;
      }>;
      organization_invites: TableDef<{
        id: string;
        organization_id: string;
        email: string;
        role: MemberRole;
        token: string;
        invited_by: string;
        expires_at: string;
        accepted_at: string | null;
        created_at: string;
      }>;
      subscriptions: TableDef<{
        id: string;
        organization_id: string;
        stripe_subscription_id: string | null;
        plan: PlanTier;
        status: SubscriptionStatus;
        seat_limit: number;
        current_period_end: string | null;
        created_at: string;
        updated_at: string;
      }>;
      usage_counters: TableDef<{
        id: string;
        organization_id: string;
        period_start: string;
        analyses_count: number;
        exports_count: number;
        optimizations_count: number;
        created_at: string;
        updated_at: string;
      }>;
      resumes: TableDef<{
        id: string;
        organization_id: string;
        user_id: string;
        title: string;
        storage_path: string | null;
        file_name: string | null;
        mime_type: string | null;
        parsed_json: Json | null;
        created_at: string;
        updated_at: string;
      }>;
      resume_versions: TableDef<{
        id: string;
        resume_id: string;
        organization_id: string;
        label: string;
        content_json: Json;
        is_primary: boolean;
        created_by: string;
        created_at: string;
      }>;
      job_applications: TableDef<{
        id: string;
        organization_id: string;
        user_id: string;
        company: string;
        title: string;
        url: string | null;
        status: JobStatus;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      optimizations: TableDef<{
        id: string;
        organization_id: string;
        user_id: string;
        resume_id: string;
        resume_version_id: string | null;
        job_application_id: string | null;
        jd_text: string;
        score: number | null;
        analysis_json: Json | null;
        created_at: string;
      }>;
      cover_letters: TableDef<{
        id: string;
        organization_id: string;
        user_id: string;
        job_application_id: string;
        title: string;
        content: string;
        version: number;
        created_at: string;
        updated_at: string;
      }>;
      stripe_webhook_events: TableDef<{
        id: string;
        event_id: string;
        processed_at: string;
      }, {
        id?: string;
        event_id: string;
        processed_at?: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      job_status: JobStatus;
      member_role: MemberRole;
      plan_tier: PlanTier;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
