import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE suppliers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        supplier_name TEXT NOT NULL,
        supplier_code TEXT,
        primary_email TEXT,
        cc_emails TEXT[],
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE import_batches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        row_count INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE blog_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
        supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
        blog_post_url TEXT NOT NULL,
        title TEXT,
        source_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        import_batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        started_at TIMESTAMP WITH TIME ZONE,
        finished_at TIMESTAMP WITH TIME ZONE,
        total_blog_posts INT DEFAULT 0,
        total_links INT DEFAULT 0,
        total_flight_searches INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE blog_post_checks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        original_url TEXT NOT NULL,
        final_url TEXT,
        http_status INT,
        status_category TEXT NOT NULL,
        response_time_ms INT,
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        error_message TEXT
      );

      CREATE TABLE extracted_links (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        blog_post_check_id UUID NOT NULL REFERENCES blog_post_checks(id) ON DELETE CASCADE,
        anchor_text TEXT,
        link_url TEXT NOT NULL,
        final_url TEXT,
        http_status INT,
        status_category TEXT NOT NULL DEFAULT 'pending',
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        error_message TEXT
      );

      CREATE TABLE landing_page_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        extracted_link_id UUID NOT NULL REFERENCES extracted_links(id) ON DELETE CASCADE,
        started_at TIMESTAMP WITH TIME ZONE NOT NULL,
        finished_at TIMESTAMP WITH TIME ZONE,
        browse_duration_seconds INT DEFAULT 0,
        proxy_session_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT
      );

      CREATE TABLE flight_search_results (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
        blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        extracted_link_id UUID NOT NULL REFERENCES extracted_links(id) ON DELETE CASCADE,
        landing_page_url TEXT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        depart_date DATE NOT NULL,
        return_date DATE NOT NULL,
        trip_length_days INT DEFAULT 5,
        price_amount NUMERIC(12,2),
        currency TEXT,
        provider_name TEXT,
        result_rank INT,
        captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT
      );

      CREATE TABLE reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
        report_type TEXT NOT NULL,
        report_scope TEXT NOT NULL,
        file_path TEXT,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE email_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        template_name TEXT NOT NULL,
        scope TEXT NOT NULL,
        subject_template TEXT NOT NULL,
        body_template TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE email_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
        recipients TEXT[] NOT NULL,
        cc_recipients TEXT[],
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT
      );

      -- Indexes
      CREATE INDEX idx_blog_posts_supplier ON blog_posts(supplier_id);
      CREATE INDEX idx_blog_posts_import_batch ON blog_posts(import_batch_id);
      CREATE INDEX idx_blog_post_checks_job ON blog_post_checks(job_id);
      CREATE INDEX idx_blog_post_checks_blog_post ON blog_post_checks(blog_post_id);
      CREATE INDEX idx_extracted_links_check ON extracted_links(blog_post_check_id);
      CREATE INDEX idx_landing_page_sessions_link ON landing_page_sessions(extracted_link_id);
      CREATE INDEX idx_flight_search_results_job ON flight_search_results(job_id);
      CREATE INDEX idx_flight_search_results_supplier ON flight_search_results(supplier_id);
      CREATE INDEX idx_flight_search_results_blog_post ON flight_search_results(blog_post_id);
      CREATE INDEX idx_flight_search_results_captured ON flight_search_results(captured_at);
      CREATE INDEX idx_reports_job ON reports(job_id);
      CREATE INDEX idx_reports_supplier ON reports(supplier_id);
      CREATE INDEX idx_email_logs_report ON email_logs(report_id);
      CREATE INDEX idx_email_logs_supplier ON email_logs(supplier_id);

      -- Seed default email templates
      INSERT INTO email_templates (template_name, scope, subject_template, body_template) VALUES
      ('Leverandørrapport', 'supplier', 'Bloggpost-rapport for {{supplierName}} - {{reportDate}}',
       'Hei,\n\nVedlagt finner du rapporten for {{supplierName}}.\n\nAktive URL-er: {{activeCount}}\nFeil: {{errorCount}}\n404: {{notFoundCount}}\nLaveste pris: {{lowestPrice}}\nHøyeste pris: {{highestPrice}}\n\nMvh\nBloggpost Monitor'),
      ('Internrapport', 'internal', 'Intern rapport - {{reportDate}}',
       'Intern statusrapport generert {{reportDate}}.\n\nSe vedlagt PDF for detaljer.');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS email_logs CASCADE;
      DROP TABLE IF EXISTS email_templates CASCADE;
      DROP TABLE IF EXISTS reports CASCADE;
      DROP TABLE IF EXISTS flight_search_results CASCADE;
      DROP TABLE IF EXISTS landing_page_sessions CASCADE;
      DROP TABLE IF EXISTS extracted_links CASCADE;
      DROP TABLE IF EXISTS blog_post_checks CASCADE;
      DROP TABLE IF EXISTS jobs CASCADE;
      DROP TABLE IF EXISTS blog_posts CASCADE;
      DROP TABLE IF EXISTS import_batches CASCADE;
      DROP TABLE IF EXISTS suppliers CASCADE;
    `);
  }
}
