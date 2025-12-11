-- CreateTable
CREATE TABLE "agreement_rate_cards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreement_id" UUID NOT NULL,
    "vehicle_type" VARCHAR(50) NOT NULL,
    "base_rate" DECIMAL(10,2),
    "per_km_rate" DECIMAL(10,2),
    "per_hour_rate" DECIMAL(10,2),
    "night_charges" DECIMAL(10,2),
    "holiday_charges" DECIMAL(10,2),
    "waiting_charges_per_hour" DECIMAL(10,2),
    "minimum_charge" DECIMAL(10,2),
    "cancellation_charge" DECIMAL(10,2),
    "currency" VARCHAR(10),
    "effective_from" DATE,
    "effective_to" DATE,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "agreement_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "user_name" VARCHAR(255),
    "user_email" VARCHAR(255),
    "user_role" VARCHAR(100),
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" UUID,
    "entity_name" VARCHAR(255),
    "old_value" JSONB,
    "new_value" JSONB,
    "changes" JSONB,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "request_method" VARCHAR(10),
    "request_url" VARCHAR(500),
    "status" VARCHAR(50),
    "error_message" TEXT,
    "session_id" VARCHAR(255),
    "request_id" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "head_id" UUID,
    "status" VARCHAR(20) DEFAULT 'Active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cab_agreements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cab_service_id" UUID NOT NULL,
    "agreement_number" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100),
    "status" VARCHAR(50) DEFAULT 'Draft',
    "priority" VARCHAR(20),
    "client_company_name" VARCHAR(255),
    "client_contact_person" VARCHAR(255),
    "client_email" VARCHAR(255),
    "client_phone" VARCHAR(20),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "auto_renewal" BOOLEAN DEFAULT false,
    "renewal_period" VARCHAR(50),
    "notice_period_days" INTEGER,
    "contract_value" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "payment_terms" TEXT,
    "payment_schedule" VARCHAR(50),
    "security_deposit" DECIMAL(15,2),
    "insurance_required" BOOLEAN DEFAULT false,
    "insurance_amount" DECIMAL(15,2),
    "insurance_provider" VARCHAR(255),
    "insurance_policy_number" VARCHAR(100),
    "insurance_expiry_date" DATE,
    "sla_response_time" INTEGER,
    "sla_availability_percentage" DECIMAL(5,2),
    "sla_on_time_performance" DECIMAL(5,2),
    "termination_clause" TEXT,
    "penalty_clause" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "cab_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cab_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50),
    "status" VARCHAR(20) DEFAULT 'Active',
    "description" TEXT,
    "registration_number" VARCHAR(100),
    "tax_id" VARCHAR(100),
    "primary_contact_name" VARCHAR(255),
    "primary_contact_position" VARCHAR(100),
    "primary_contact_email" VARCHAR(255),
    "primary_contact_phone" VARCHAR(20),
    "address_street" VARCHAR(255),
    "address_city" VARCHAR(100),
    "website" VARCHAR(255),
    "service_areas" TEXT[],
    "is_24x7" BOOLEAN DEFAULT false,
    "operating_hours_weekdays" VARCHAR(100),
    "operating_hours_weekends" VARCHAR(100),
    "operating_hours_holidays" VARCHAR(100),
    "completed_trips" INTEGER DEFAULT 0,
    "cancelled_trips" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "cab_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_unit_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(100),
    "status" VARCHAR(20) DEFAULT 'Active',
    "head_id" UUID,
    "budget_allocated" DECIMAL(15,2),
    "budget_utilized" DECIMAL(15,2),
    "budget_currency" VARCHAR(10),
    "fiscal_year" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "document_type" VARCHAR(100) NOT NULL,
    "document_number" VARCHAR(100),
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT,
    "mime_type" VARCHAR(100),
    "issue_date" DATE,
    "expiry_date" DATE,
    "issuing_authority" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'Valid',
    "verification_status" VARCHAR(50),
    "verified_by" UUID,
    "verified_at" TIMESTAMP(6),
    "version" VARCHAR(20) DEFAULT '1.0',
    "is_current" BOOLEAN DEFAULT true,
    "replaces_document_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "license_number" VARCHAR(100) NOT NULL,
    "license_type" VARCHAR(50),
    "license_issue_date" DATE,
    "license_expiry_date" DATE,
    "license_issuing_authority" VARCHAR(255),
    "license_state" VARCHAR(100),
    "medical_certificate_number" VARCHAR(100),
    "medical_certificate_expiry" DATE,
    "background_check_status" VARCHAR(50),
    "background_check_date" DATE,
    "background_check_valid_until" DATE,
    "driver_status" VARCHAR(50) DEFAULT 'Available',
    "years_of_experience" INTEGER,
    "previous_employer" VARCHAR(255),
    "training_completed" BOOLEAN DEFAULT false,
    "training_completion_date" DATE,
    "training_expiry_date" DATE,
    "total_trips_completed" INTEGER DEFAULT 0,
    "total_distance_driven" DECIMAL(12,2) DEFAULT 0,
    "violations_count" INTEGER DEFAULT 0,
    "accidents_count" INTEGER DEFAULT 0,
    "current_vehicle_id" UUID,
    "assigned_to_vehicle_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_code" VARCHAR(100) NOT NULL,
    "template_name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT,
    "category" VARCHAR(100),
    "variables" JSONB,
    "status" VARCHAR(20) DEFAULT 'Active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "relationship" VARCHAR(100),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "is_primary" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expiry_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "entity_name" VARCHAR(255),
    "document_id" UUID,
    "document_name" VARCHAR(255),
    "document_number" VARCHAR(100),
    "issue_date" DATE,
    "expiry_date" DATE NOT NULL,
    "days_to_expiry" INTEGER,
    "status" VARCHAR(50) DEFAULT 'Active',
    "priority" VARCHAR(20),
    "department" VARCHAR(255),
    "assigned_to" UUID,
    "reminders_sent" INTEGER DEFAULT 0,
    "last_reminder_date" TIMESTAMP(6),
    "renewal_process_started" BOOLEAN DEFAULT false,
    "renewal_documents_submitted" BOOLEAN DEFAULT false,
    "renewal_payment_made" BOOLEAN DEFAULT false,
    "new_expiry_date" DATE,
    "renewal_reference" VARCHAR(100),
    "renewal_cost" DECIMAL(15,2),
    "renewal_vendor" VARCHAR(255),
    "notes" TEXT,
    "resolved_at" TIMESTAMP(6),
    "resolved_by" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expiry_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50),
    "center_latitude" DECIMAL(10,8),
    "center_longitude" DECIMAL(11,8),
    "radius_meters" DECIMAL(10,2),
    "polygon_coordinates" JSONB,
    "status" VARCHAR(20) DEFAULT 'Active',
    "alert_on_entry" BOOLEAN DEFAULT false,
    "alert_on_exit" BOOLEAN DEFAULT true,
    "alert_recipients" TEXT[],
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" VARCHAR(100) NOT NULL,
    "imei" VARCHAR(50) NOT NULL,
    "vehicle_id" UUID,
    "device_model" VARCHAR(100),
    "manufacturer" VARCHAR(100),
    "firmware_version" VARCHAR(50),
    "installation_date" DATE,
    "last_maintenance_date" DATE,
    "next_maintenance_date" DATE,
    "status" VARCHAR(50) DEFAULT 'Active',
    "battery_backup_hours" INTEGER,
    "sim_number" VARCHAR(50),
    "network_provider" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "gps_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID,
    "trip_assignment_id" UUID,
    "device_id" VARCHAR(100),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "altitude" DECIMAL(8,2),
    "accuracy" DECIMAL(8,2),
    "address" VARCHAR(500),
    "speed" DECIMAL(6,2),
    "heading" DECIMAL(5,2),
    "ignition_status" VARCHAR(10),
    "mileage" DECIMAL(10,2),
    "battery_level" DECIMAL(5,2),
    "signal_strength" DECIMAL(5,2),
    "network_provider" VARCHAR(100),
    "geofence_status" VARCHAR(50),
    "speed_limit" DECIMAL(6,2),
    "is_speed_violation" BOOLEAN DEFAULT false,
    "violation_count" INTEGER DEFAULT 0,
    "panic_button" BOOLEAN DEFAULT false,
    "device_timestamp" TIMESTAMP(6) NOT NULL,
    "server_timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "holiday_date" DATE NOT NULL,
    "holiday_name" VARCHAR(255) NOT NULL,
    "holiday_type" VARCHAR(50),
    "is_working_day" BOOLEAN DEFAULT false,
    "region" VARCHAR(100),
    "country" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "policy_number" VARCHAR(100) NOT NULL,
    "policy_type" VARCHAR(100),
    "coverage" VARCHAR(500),
    "premium_amount" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "payment_frequency" VARCHAR(50),
    "start_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'Active',
    "idv_amount" DECIMAL(15,2),
    "deductible" DECIMAL(15,2),
    "agent_name" VARCHAR(255),
    "agent_contact" VARCHAR(255),
    "claims_filed" INTEGER DEFAULT 0,
    "ncb_percentage" DECIMAL(5,2),
    "document_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "login_timestamp" TIMESTAMP(6) NOT NULL,
    "logout_timestamp" TIMESTAMP(6),
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "device" VARCHAR(255),
    "browser" VARCHAR(100),
    "operating_system" VARCHAR(100),
    "location_city" VARCHAR(100),
    "location_country" VARCHAR(100),
    "location_coordinates" VARCHAR(100),
    "login_status" VARCHAR(50),
    "failure_reason" VARCHAR(255),
    "two_factor_used" BOOLEAN DEFAULT false,
    "session_id" VARCHAR(255),
    "session_duration" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "maintenance_type" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100),
    "priority" VARCHAR(20),
    "description" TEXT NOT NULL,
    "symptoms" TEXT,
    "root_cause" TEXT,
    "scheduled_date" DATE,
    "actual_date" DATE NOT NULL,
    "duration_hours" DECIMAL(6,2),
    "based_on" VARCHAR(50),
    "mileage_at_maintenance" DECIMAL(10,2),
    "service_provider_type" VARCHAR(50),
    "service_provider_name" VARCHAR(255),
    "service_location" VARCHAR(500),
    "service_advisor" VARCHAR(255),
    "labor_cost" DECIMAL(15,2) DEFAULT 0,
    "parts_cost" DECIMAL(15,2) DEFAULT 0,
    "other_charges" DECIMAL(15,2) DEFAULT 0,
    "tax_amount" DECIMAL(15,2) DEFAULT 0,
    "discount" DECIMAL(15,2) DEFAULT 0,
    "total_cost" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "payment_status" VARCHAR(50),
    "payment_method" VARCHAR(50),
    "invoice_number" VARCHAR(100),
    "invoice_date" DATE,
    "status" VARCHAR(50) DEFAULT 'Scheduled',
    "completion_date" DATE,
    "quality_rating" DECIMAL(3,2),
    "next_maintenance_date" DATE,
    "next_maintenance_mileage" DECIMAL(10,2),
    "next_maintenance_type" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_parts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "maintenance_log_id" UUID NOT NULL,
    "part_number" VARCHAR(100),
    "part_name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(15,2),
    "total_cost" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "warranty_duration" INTEGER,
    "warranty_unit" VARCHAR(20),
    "warranty_expiry_date" DATE,
    "supplier" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50),
    "category" VARCHAR(100),
    "severity" VARCHAR(20),
    "recipient_user_id" UUID,
    "recipient_role" VARCHAR(100),
    "is_read" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMP(6),
    "sent_via_email" BOOLEAN DEFAULT false,
    "sent_via_sms" BOOLEAN DEFAULT false,
    "sent_via_push" BOOLEAN DEFAULT false,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "action_url" VARCHAR(500),
    "action_label" VARCHAR(100),
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "assigned_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "level" INTEGER DEFAULT 0,
    "status" VARCHAR(20) DEFAULT 'Active',
    "scope" VARCHAR(50),
    "parent_role_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_code" VARCHAR(100) NOT NULL,
    "alert_type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20),
    "source_type" VARCHAR(50),
    "source_id" UUID,
    "source_name" VARCHAR(255),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "location_address" VARCHAR(500),
    "status" VARCHAR(50) DEFAULT 'Active',
    "acknowledged_at" TIMESTAMP(6),
    "acknowledged_by" UUID,
    "resolved_at" TIMESTAMP(6),
    "resolved_by" UUID,
    "resolution_notes" TEXT,
    "escalated" BOOLEAN DEFAULT false,
    "escalated_at" TIMESTAMP(6),
    "escalated_to" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "setting_key" VARCHAR(255) NOT NULL,
    "setting_value" TEXT,
    "setting_type" VARCHAR(50),
    "category" VARCHAR(100),
    "description" TEXT,
    "is_encrypted" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_request_id" UUID NOT NULL,
    "approval_level" INTEGER NOT NULL,
    "approver_role" VARCHAR(100),
    "approver_user_id" UUID,
    "approver_department" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'Pending',
    "approved_at" TIMESTAMP(6),
    "comments" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_request_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "assignment_status" VARCHAR(50) DEFAULT 'Assigned',
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "actual_departure_time" TIMESTAMP(6),
    "actual_arrival_time" TIMESTAMP(6),
    "actual_distance" DECIMAL(10,2),
    "actual_duration" INTEGER,
    "current_status" VARCHAR(50),
    "current_location_latitude" DECIMAL(10,8),
    "current_location_longitude" DECIMAL(11,8),
    "last_location_update" TIMESTAMP(6),
    "passenger_rating" DECIMAL(3,2),
    "passenger_feedback" TEXT,
    "driver_rating" DECIMAL(3,2),
    "driver_feedback" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_assignment_id" UUID NOT NULL,
    "base_fare" DECIMAL(15,2) DEFAULT 0,
    "distance_charges" DECIMAL(15,2) DEFAULT 0,
    "time_charges" DECIMAL(15,2) DEFAULT 0,
    "fuel_cost" DECIMAL(15,2) DEFAULT 0,
    "toll_charges" DECIMAL(15,2) DEFAULT 0,
    "parking_charges" DECIMAL(15,2) DEFAULT 0,
    "waiting_charges" DECIMAL(15,2) DEFAULT 0,
    "night_surcharge" DECIMAL(15,2) DEFAULT 0,
    "holiday_surcharge" DECIMAL(15,2) DEFAULT 0,
    "driver_allowance" DECIMAL(15,2) DEFAULT 0,
    "other_charges" DECIMAL(15,2) DEFAULT 0,
    "tax_percentage" DECIMAL(5,2),
    "tax_amount" DECIMAL(15,2) DEFAULT 0,
    "sub_total" DECIMAL(15,2),
    "discount" DECIMAL(15,2) DEFAULT 0,
    "total_cost" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "payment_status" VARCHAR(50) DEFAULT 'Pending',
    "payment_method" VARCHAR(50),
    "paid_at" TIMESTAMP(6),
    "invoice_number" VARCHAR(100),
    "invoice_date" DATE,
    "cost_breakdown_details" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "trip_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_request_id" UUID,
    "trip_assignment_id" UUID,
    "trip_number" VARCHAR(100) NOT NULL,
    "trip_date" DATE NOT NULL,
    "trip_status" VARCHAR(50),
    "passenger_name" VARCHAR(255),
    "passenger_department" VARCHAR(255),
    "driver_name" VARCHAR(255),
    "vehicle_registration" VARCHAR(50),
    "from_location" VARCHAR(500),
    "to_location" VARCHAR(500),
    "planned_distance" DECIMAL(10,2),
    "actual_distance" DECIMAL(10,2),
    "planned_departure" TIMESTAMP(6),
    "actual_departure" TIMESTAMP(6),
    "planned_arrival" TIMESTAMP(6),
    "actual_arrival" TIMESTAMP(6),
    "total_duration" INTEGER,
    "on_time" BOOLEAN,
    "total_cost" DECIMAL(15,2),
    "fuel_cost" DECIMAL(15,2),
    "toll_charges" DECIMAL(15,2),
    "parking_charges" DECIMAL(15,2),
    "other_charges" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "overall_rating" DECIMAL(3,2),
    "punctuality_rating" DECIMAL(3,2),
    "driver_behavior_rating" DECIMAL(3,2),
    "vehicle_condition_rating" DECIMAL(3,2),
    "comments" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_passengers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_request_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "employee_id" VARCHAR(100),
    "department" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "request_number" VARCHAR(50) NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "requested_for_user_id" UUID,
    "from_location_address" VARCHAR(500) NOT NULL,
    "from_location_latitude" DECIMAL(10,8),
    "from_location_longitude" DECIMAL(11,8),
    "from_location_landmark" VARCHAR(255),
    "to_location_address" VARCHAR(500) NOT NULL,
    "to_location_latitude" DECIMAL(10,8),
    "to_location_longitude" DECIMAL(11,8),
    "to_location_landmark" VARCHAR(255),
    "departure_date" DATE NOT NULL,
    "departure_time" TIME(6) NOT NULL,
    "return_date" DATE,
    "return_time" TIME(6),
    "is_round_trip" BOOLEAN DEFAULT false,
    "estimated_distance" DECIMAL(10,2),
    "estimated_duration" INTEGER,
    "trip_type" VARCHAR(100),
    "purpose_category" VARCHAR(100) NOT NULL,
    "purpose_description" TEXT NOT NULL,
    "project_code" VARCHAR(100),
    "cost_center" VARCHAR(100),
    "business_justification" TEXT,
    "vehicle_type_required" VARCHAR(50),
    "passenger_count" INTEGER DEFAULT 1,
    "ac_required" BOOLEAN DEFAULT true,
    "luggage_type" VARCHAR(50),
    "luggage_requirements" TEXT,
    "wheelchair_accessible" BOOLEAN DEFAULT false,
    "driver_required" BOOLEAN DEFAULT true,
    "special_instructions" TEXT,
    "priority" VARCHAR(20) DEFAULT 'Medium',
    "status" VARCHAR(50) DEFAULT 'Pending',
    "estimated_cost" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "approval_required" BOOLEAN DEFAULT true,
    "approval_level_required" INTEGER DEFAULT 1,
    "billing_type" VARCHAR(50),
    "bill_to_department_id" UUID,
    "budget_code" VARCHAR(100),
    "cancelled_at" TIMESTAMP(6),
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "status" VARCHAR(20) DEFAULT 'Active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "profile_picture" TEXT,
    "address_street" VARCHAR(255),
    "address_city" VARCHAR(100),
    "address_state" VARCHAR(100),
    "address_zip_code" VARCHAR(20),
    "address_country" VARCHAR(100),
    "department_id" UUID,
    "business_unit_id" UUID,
    "position" VARCHAR(100),
    "manager_id" UUID,
    "hire_date" DATE,
    "employment_type" VARCHAR(50),
    "work_location" VARCHAR(255),
    "salary_amount" DECIMAL(15,2),
    "salary_currency" VARCHAR(10),
    "salary_frequency" VARCHAR(20),
    "status" VARCHAR(20) DEFAULT 'Active',
    "two_factor_enabled" BOOLEAN DEFAULT false,
    "last_login" TIMESTAMP(6),
    "login_count" INTEGER DEFAULT 0,
    "password_last_changed" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_leases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicle_id" UUID NOT NULL,
    "lessor_name" VARCHAR(255) NOT NULL,
    "lessor_contact" VARCHAR(500),
    "lease_start_date" DATE NOT NULL,
    "lease_end_date" DATE NOT NULL,
    "monthly_payment" DECIMAL(15,2),
    "total_lease_amount" DECIMAL(15,2),
    "currency" VARCHAR(10),
    "payment_status" VARCHAR(50),
    "next_payment_date" DATE,
    "terms_and_conditions" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "vehicle_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "registration_number" VARCHAR(50) NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "color" VARCHAR(50),
    "chassis_number" VARCHAR(100),
    "engine_number" VARCHAR(100),
    "vehicle_type" VARCHAR(50),
    "fuel_type" VARCHAR(50),
    "transmission" VARCHAR(20),
    "seating_capacity" INTEGER,
    "operational_status" VARCHAR(50) DEFAULT 'Active',
    "availability_status" VARCHAR(50) DEFAULT 'Available',
    "condition_status" VARCHAR(50),
    "current_location" VARCHAR(255),
    "home_base" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "location_updated_at" TIMESTAMP(6),
    "current_driver_id" UUID,
    "assigned_department_id" UUID,
    "driver_assigned_date" TIMESTAMP(6),
    "engine_displacement" VARCHAR(50),
    "engine_power" VARCHAR(50),
    "engine_torque" VARCHAR(50),
    "fuel_capacity" DECIMAL(8,2),
    "mileage_city" DECIMAL(6,2),
    "mileage_highway" DECIMAL(6,2),
    "mileage_combined" DECIMAL(6,2),
    "length_mm" INTEGER,
    "width_mm" INTEGER,
    "height_mm" INTEGER,
    "wheelbase_mm" INTEGER,
    "kerb_weight_kg" INTEGER,
    "gross_weight_kg" INTEGER,
    "ownership_type" VARCHAR(50),
    "purchase_date" DATE,
    "purchase_price" DECIMAL(15,2),
    "current_value" DECIMAL(15,2),
    "total_kilometers" DECIMAL(10,2) DEFAULT 0,
    "total_trips" INTEGER DEFAULT 0,
    "cab_service_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_module" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_code_key" ON "business_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cab_agreements_agreement_number_key" ON "cab_agreements"("agreement_number");

-- CreateIndex
CREATE UNIQUE INDEX "cab_services_code_key" ON "cab_services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "idx_documents_entity" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_documents_expiry" ON "documents"("expiry_date");

-- CreateIndex
CREATE INDEX "idx_documents_status" ON "documents"("status");

-- CreateIndex
CREATE INDEX "idx_documents_type" ON "documents"("document_type");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_template_code_key" ON "email_templates"("template_code");

-- CreateIndex
CREATE INDEX "idx_email_templates_code" ON "email_templates"("template_code");

-- CreateIndex
CREATE INDEX "idx_expiry_alerts_entity" ON "expiry_alerts"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_expiry_alerts_expiry" ON "expiry_alerts"("expiry_date");

-- CreateIndex
CREATE INDEX "idx_expiry_alerts_status" ON "expiry_alerts"("status");

-- CreateIndex
CREATE INDEX "idx_geofences_status" ON "geofences"("status");

-- CreateIndex
CREATE UNIQUE INDEX "gps_devices_device_id_key" ON "gps_devices"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "gps_devices_imei_key" ON "gps_devices"("imei");

-- CreateIndex
CREATE INDEX "idx_gps_devices_device_id" ON "gps_devices"("device_id");

-- CreateIndex
CREATE INDEX "idx_gps_devices_imei" ON "gps_devices"("imei");

-- CreateIndex
CREATE INDEX "idx_gps_devices_vehicle" ON "gps_devices"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_gps_logs_location" ON "gps_logs"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_gps_logs_timestamp" ON "gps_logs"("device_timestamp");

-- CreateIndex
CREATE INDEX "idx_gps_logs_trip" ON "gps_logs"("trip_assignment_id");

-- CreateIndex
CREATE INDEX "idx_gps_logs_vehicle" ON "gps_logs"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_holidays_date" ON "holidays"("holiday_date");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_policy_number_key" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE INDEX "idx_insurance_policies_policy" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE INDEX "idx_insurance_policies_vehicle" ON "insurance_policies"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_login_history_timestamp" ON "login_history"("login_timestamp");

-- CreateIndex
CREATE INDEX "idx_login_history_user" ON "login_history"("user_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_logs_status" ON "maintenance_logs"("status");

-- CreateIndex
CREATE INDEX "idx_maintenance_logs_type" ON "maintenance_logs"("maintenance_type");

-- CreateIndex
CREATE INDEX "idx_maintenance_logs_vehicle" ON "maintenance_logs"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_maintenance_parts_log" ON "maintenance_parts"("maintenance_log_id");

-- CreateIndex
CREATE INDEX "idx_notifications_created" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_read" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_recipient" ON "notifications"("recipient_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "system_alerts_alert_code_key" ON "system_alerts"("alert_code");

-- CreateIndex
CREATE INDEX "idx_system_alerts_code" ON "system_alerts"("alert_code");

-- CreateIndex
CREATE INDEX "idx_system_alerts_status" ON "system_alerts"("status");

-- CreateIndex
CREATE INDEX "idx_system_alerts_type" ON "system_alerts"("alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "idx_system_settings_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "idx_trip_approvals_approver" ON "trip_approvals"("approver_user_id");

-- CreateIndex
CREATE INDEX "idx_trip_approvals_request" ON "trip_approvals"("trip_request_id");

-- CreateIndex
CREATE INDEX "idx_trip_approvals_status" ON "trip_approvals"("status");

-- CreateIndex
CREATE INDEX "idx_trip_assignments_driver" ON "trip_assignments"("driver_id");

-- CreateIndex
CREATE INDEX "idx_trip_assignments_request" ON "trip_assignments"("trip_request_id");

-- CreateIndex
CREATE INDEX "idx_trip_assignments_status" ON "trip_assignments"("assignment_status");

-- CreateIndex
CREATE INDEX "idx_trip_assignments_vehicle" ON "trip_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_trip_costs_assignment" ON "trip_costs"("trip_assignment_id");

-- CreateIndex
CREATE INDEX "idx_trip_costs_payment_status" ON "trip_costs"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_logs_trip_number_key" ON "trip_logs"("trip_number");

-- CreateIndex
CREATE INDEX "idx_trip_logs_date" ON "trip_logs"("trip_date");

-- CreateIndex
CREATE INDEX "idx_trip_logs_number" ON "trip_logs"("trip_number");

-- CreateIndex
CREATE INDEX "idx_trip_logs_status" ON "trip_logs"("trip_status");

-- CreateIndex
CREATE INDEX "idx_trip_passengers_request" ON "trip_passengers"("trip_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_requests_request_number_key" ON "trip_requests"("request_number");

-- CreateIndex
CREATE INDEX "idx_trip_requests_departure" ON "trip_requests"("departure_date", "departure_time");

-- CreateIndex
CREATE INDEX "idx_trip_requests_number" ON "trip_requests"("request_number");

-- CreateIndex
CREATE INDEX "idx_trip_requests_status" ON "trip_requests"("status");

-- CreateIndex
CREATE INDEX "idx_trip_requests_user" ON "trip_requests"("requested_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registration_number_key" ON "vehicles"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassis_number_key" ON "vehicles"("chassis_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engine_number_key" ON "vehicles"("engine_number");

-- AddForeignKey
ALTER TABLE "agreement_rate_cards" ADD CONSTRAINT "agreement_rate_cards_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "cab_agreements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agreement_rate_cards" ADD CONSTRAINT "agreement_rate_cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "fk_business_units_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "fk_business_units_head" FOREIGN KEY ("head_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "fk_business_units_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cab_agreements" ADD CONSTRAINT "cab_agreements_cab_service_id_fkey" FOREIGN KEY ("cab_service_id") REFERENCES "cab_services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cab_agreements" ADD CONSTRAINT "cab_agreements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cab_agreements" ADD CONSTRAINT "cab_agreements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cab_services" ADD CONSTRAINT "cab_services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cab_services" ADD CONSTRAINT "cab_services_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_head" FOREIGN KEY ("head_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_replaces_document_id_fkey" FOREIGN KEY ("replaces_document_id") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "fk_drivers_vehicle" FOREIGN KEY ("current_vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expiry_alerts" ADD CONSTRAINT "expiry_alerts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expiry_alerts" ADD CONSTRAINT "expiry_alerts_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expiry_alerts" ADD CONSTRAINT "expiry_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gps_devices" ADD CONSTRAINT "gps_devices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gps_devices" ADD CONSTRAINT "gps_devices_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gps_devices" ADD CONSTRAINT "gps_devices_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_trip_assignment_id_fkey" FOREIGN KEY ("trip_assignment_id") REFERENCES "trip_assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gps_logs" ADD CONSTRAINT "gps_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_parts" ADD CONSTRAINT "maintenance_parts_maintenance_log_id_fkey" FOREIGN KEY ("maintenance_log_id") REFERENCES "maintenance_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_role_id_fkey" FOREIGN KEY ("parent_role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_approvals" ADD CONSTRAINT "trip_approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_approvals" ADD CONSTRAINT "trip_approvals_trip_request_id_fkey" FOREIGN KEY ("trip_request_id") REFERENCES "trip_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_assignments" ADD CONSTRAINT "trip_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_assignments" ADD CONSTRAINT "trip_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_assignments" ADD CONSTRAINT "trip_assignments_trip_request_id_fkey" FOREIGN KEY ("trip_request_id") REFERENCES "trip_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_assignments" ADD CONSTRAINT "trip_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_costs" ADD CONSTRAINT "trip_costs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_costs" ADD CONSTRAINT "trip_costs_trip_assignment_id_fkey" FOREIGN KEY ("trip_assignment_id") REFERENCES "trip_assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_costs" ADD CONSTRAINT "trip_costs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_trip_assignment_id_fkey" FOREIGN KEY ("trip_assignment_id") REFERENCES "trip_assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_trip_request_id_fkey" FOREIGN KEY ("trip_request_id") REFERENCES "trip_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_passengers" ADD CONSTRAINT "trip_passengers_trip_request_id_fkey" FOREIGN KEY ("trip_request_id") REFERENCES "trip_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_requests" ADD CONSTRAINT "trip_requests_bill_to_department_id_fkey" FOREIGN KEY ("bill_to_department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_requests" ADD CONSTRAINT "trip_requests_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_requests" ADD CONSTRAINT "trip_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_requests" ADD CONSTRAINT "trip_requests_requested_for_user_id_fkey" FOREIGN KEY ("requested_for_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_users_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_leases" ADD CONSTRAINT "vehicle_leases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_leases" ADD CONSTRAINT "vehicle_leases_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_leases" ADD CONSTRAINT "vehicle_leases_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "fk_vehicles_driver" FOREIGN KEY ("current_driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_assigned_department_id_fkey" FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_cab_service_id_fkey" FOREIGN KEY ("cab_service_id") REFERENCES "cab_services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
