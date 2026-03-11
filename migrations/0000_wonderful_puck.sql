CREATE TABLE "dog_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"breed" text,
	"sex" text,
	"size" text,
	"birthdate" text,
	"medical_notes" text,
	"instructions_text" text,
	"contact_phone" text,
	"contact_whatsapp" text,
	"contact_email" text,
	"show_phone" boolean DEFAULT true NOT NULL,
	"show_whatsapp" boolean DEFAULT true NOT NULL,
	"show_email" boolean DEFAULT false NOT NULL,
	"notify_on_scan" boolean DEFAULT true NOT NULL,
	"city" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dog_profiles_tag_id_unique" UNIQUE("tag_id")
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ip_hash" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(10) NOT NULL,
	"claim_code_hash" text NOT NULL,
	"owner_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"expires_at" timestamp,
	CONSTRAINT "tags_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "dog_profiles" ADD CONSTRAINT "dog_profiles_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;