-- 0009_invalidita_civile.sql
-- Migration for Invalidità Civile module with enhanced medical certificates and RLS policies for doctors

-- ============================================
-- INVALIDITY DETAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invalidity_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    -- Disability information
    disability_type TEXT NOT NULL, -- e.g., 'motoria', 'visiva', 'uditiva', 'intellettiva', 'psichica', 'viscerale'
    disability_percentage INTEGER NOT NULL CHECK (disability_percentage >= 0 AND disability_percentage <= 100),
    disability_details TEXT, -- Additional details about the disability
    -- INPS visit information
    inps_visit_date DATE,
    inps_visit_result TEXT, -- e.g., 'accolta', 'respinta', 'in_istruttoria'
    inps_protocol_number TEXT,
    -- Certification dates
    certification_date DATE, -- Date of medical certification
    certification_expiry_date DATE, -- Expiry date of certification
    -- Benefits information
    benefits_requested TEXT[], -- Array of requested benefits: 'pensione', 'indennita', 'accompanied', 'legen'
    benefits_approved TEXT[], -- Array of approved benefits
    -- Status tracking
    assessment_status TEXT DEFAULT 'in_corso' CHECK (assessment_status IN ('in_corso', 'presentata', 'in_istruttoria', 'approvata', 'respinta')),
    -- AP70 specific
    ap70_filed BOOLEAN DEFAULT FALSE,
    ap70_filing_date DATE,
    ap70_protocol_number TEXT,
    -- Medical examiner
    medical_examiner_id UUID REFERENCES auth.users(id), -- The doctor assigned to this case
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure one-to-one relationship with cases
    UNIQUE(case_id)
);

-- Trigger for updated_at
CREATE TRIGGER update_invalidity_details_updated_at 
BEFORE UPDATE ON invalidity_details 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- ENHANCED MEDICAL CERTIFICATES TABLE
-- ============================================
-- First, drop existing medical_certificates table and recreate with enhanced schema
DROP TABLE IF EXISTS medical_certificates CASCADE;

CREATE TABLE IF NOT EXISTS medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    -- Certificate identification
    certificate_type TEXT NOT NULL CHECK (certificate_type IN ('hinch_60', 'hinch_65', '剖_70', '剖_104', 'altro')),
    certificate_number TEXT,
    certificate_series TEXT,
    -- Issuing physician
    doctor_name TEXT NOT NULL,
    doctor_tax_code TEXT,
    doctor_phone TEXT,
    doctor_email TEXT,
    doctor_address TEXT,
    doctor_structure TEXT, -- Medical structure where the doctor practices
    asl_code TEXT, -- ASL code
    -- Certificate content
    diagnosis TEXT NOT NULL,
    icd_code TEXT, -- ICD-10 diagnosis code
    clinical_findings TEXT,
    functional_limitations TEXT,
    prognosis TEXT,
    therapy_prescribed TEXT,
    -- Dates
    issue_date DATE NOT NULL,
    expiry_date DATE,
    visit_date DATE, -- Date of actual examination
    -- Attachments
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    attachment_path TEXT, -- Path to any attached file
    -- Signatures
    digital_signature_present BOOLEAN DEFAULT FALSE,
    signature_date DATE,
    -- Status
    is_valid BOOLEAN DEFAULT TRUE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verification_notes TEXT,
    -- Organization (for RLS)
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_medical_certificates_updated_at 
BEFORE UPDATE ON medical_certificates 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to set organization_id automatically
CREATE TRIGGER set_medical_certificates_organization_id
BEFORE INSERT ON medical_certificates
FOR EACH ROW EXECUTE PROCEDURE set_current_user_organization_id();

-- ============================================
-- ENUM TYPES
-- ============================================
DO $$ BEGIN
    CREATE TYPE disability_category AS ENUM ('motoria', 'visiva', 'uditiva', 'intellettiva', 'psichica', 'viscerale', 'multipla', 'altra');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_result AS ENUM ('accettata', 'respinta', 'in_istruttoria', 'annullata', 'ricorso');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================
-- Add doctor_id to cases table if not exists
ALTER TABLE cases ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES auth.users(id);

-- Add invalidity_details_id reference to cases for easy lookup
ALTER TABLE cases ADD COLUMN IF NOT EXISTS invalidity_details_id UUID REFERENCES invalidity_details(id);

-- ============================================
-- RLS POLICIES FOR INVALIDITY DETAILS
-- ============================================
ALTER TABLE invalidity_details ENABLE ROW LEVEL SECURITY;

-- Admin and Operator: full access within organization
CREATE POLICY "Admin and operator can manage invalidity_details" ON invalidity_details
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'operator')
        )
    );

-- Doctor: can only see cases assigned to them
CREATE POLICY "Doctor can view assigned invalidity_details" ON invalidity_details
    FOR SELECT
    USING (
        medical_examiner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = invalidity_details.case_id 
            AND cases.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctor can update assigned invalidity_details" ON invalidity_details
    FOR UPDATE
    USING (
        medical_examiner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = invalidity_details.case_id 
            AND cases.doctor_id = auth.uid()
        )
    );

-- Collaborator: can view cases they're assigned to
CREATE POLICY "Collaborator can view invalidity_details" ON invalidity_details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = invalidity_details.case_id 
            AND cases.assigned_to = auth.uid()
        )
    );

-- ============================================
-- RLS POLICIES FOR MEDICAL CERTIFICATES
-- ============================================
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;

-- Admin and Operator: full access within organization
CREATE POLICY "Admin and operator can manage medical_certificates" ON medical_certificates
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'operator')
        )
    );

-- Doctor: can only see and manage certificates for their assigned cases
CREATE POLICY "Doctor can view assigned medical_certificates" ON medical_certificates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = medical_certificates.case_id 
            AND cases.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctor can insert medical_certificates for assigned cases" ON medical_certificates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = medical_certificates.case_id 
            AND cases.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctor can update medical_certificates for assigned cases" ON medical_certificates
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = medical_certificates.case_id 
            AND cases.doctor_id = auth.uid()
        )
    );

-- Collaborator: can view certificates for their assigned cases
CREATE POLICY "Collaborator can view medical_certificates" ON medical_certificates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases 
            WHERE cases.id = medical_certificates.case_id 
            AND cases.assigned_to = auth.uid()
        )
    );

-- ============================================
-- UPDATE EXISTING CASES POLICIES
-- ============================================
-- Update cases policy to include doctor_id filter
DROP POLICY IF EXISTS "Users can view organization cases" ON cases;
DROP POLICY IF EXISTS "Users can insert organization cases" ON cases;
DROP POLICY IF EXISTS "Users can update organization cases" ON cases;

CREATE POLICY "Users can view organization cases" ON cases
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
        )
        OR doctor_id = auth.uid()
    );

CREATE POLICY "Users can insert organization cases" ON cases
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update organization cases" ON cases
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
        )
        OR doctor_id = auth.uid()
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
        )
    );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invalidity_details_case_id ON invalidity_details(case_id);
CREATE INDEX IF NOT EXISTS idx_invalidity_details_medical_examiner ON invalidity_details(medical_examiner_id);
CREATE INDEX IF NOT EXISTS idx_invalidity_details_assessment_status ON invalidity_details(assessment_status);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_case_id ON medical_certificates(case_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_doctor ON medical_certificates(doctor_tax_code);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_issue_date ON medical_certificates(issue_date);
CREATE INDEX IF NOT EXISTS idx_cases_doctor_id ON cases(doctor_id);

-- ============================================
-- FUNCTION TO GET CASES FOR DOCTOR
-- ============================================
CREATE OR REPLACE FUNCTION get_doctor_assigned_cases(doctor_user_id UUID)
RETURNS TABLE (
    case_id UUID,
    case_title TEXT,
    case_status TEXT,
    contact_name TEXT,
    disability_type TEXT,
    disability_percentage INTEGER,
    certification_status TEXT,
    next_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as case_id,
        c.title as case_title,
        c.status as case_status,
        CONCAT(cont.first_name, ' ', cont.last_name) as contact_name,
        idet.disability_type,
        idet.disability_percentage,
        CASE 
            WHEN idet.assessment_status = 'approvata' THEN 'Approvata'
            WHEN idet.assessment_status = 'respinta' THEN 'Respinta'
            WHEN idet.assessment_status = 'in_istruttoria' THEN 'In Istruttoria'
            WHEN idet.assessment_status = 'presentata' THEN 'Presentata'
            ELSE 'In Corso'
        END as certification_status,
        CASE 
            WHEN mc.id IS NULL THEN 'Certificato mancante'
            WHEN mc.verification_status = 'pending' THEN 'Da verificare'
            WHEN idet.certification_expiry_date < CURRENT_DATE THEN 'Certificato scaduto'
            WHEN idet.assessment_status = 'in_corso' THEN 'In attesa visita INPS'
            WHEN idet.assessment_status = 'presentata' THEN 'In attesa esito'
            ELSE 'Nessuna azione richiesta'
        END as next_action
    FROM cases c
    LEFT JOIN contacts cont ON c.contact_id = cont.id
    LEFT JOIN invalidity_details idet ON c.id = idet.case_id
    LEFT JOIN medical_certificates mc ON c.id = mc.case_id
    WHERE c.doctor_id = doctor_user_id
       OR idet.medical_examiner_id = doctor_user_id
    ORDER BY 
        CASE 
            WHEN idet.certification_expiry_date < CURRENT_DATE THEN 0
            WHEN mc.verification_status = 'pending' THEN 1
            ELSE 2
        END,
        c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION TO CHECK CERTIFICATE EXPIRY
-- ============================================
CREATE OR REPLACE FUNCTION check_certificate_expiry()
RETURNS void AS $$
BEGIN
    -- Update verification_status to 'expired' for expired certificates
    UPDATE medical_certificates
    SET verification_status = 'expired',
        updated_at = NOW()
    WHERE expiry_date < CURRENT_DATE
      AND verification_status = 'verified';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUMMARY VIEW FOR DOCTOR DASHBOARD
-- ============================================
CREATE OR REPLACE VIEW doctor_dashboard_summary AS
SELECT 
    p.id as doctor_id,
    p.full_name as doctor_name,
    COUNT(DISTINCT CASE 
        WHEN c.status NOT IN ('completed', 'rejected') THEN c.id 
    END) as active_cases,
    COUNT(DISTINCT CASE 
        WHEN idet.certification_expiry_date < CURRENT_DATE 
             AND idet.certification_expiry_date IS NOT NULL
        THEN c.id 
    END) as expired_certificates,
    COUNT(DISTINCT CASE 
        WHEN mc.verification_status = 'pending' 
        THEN mc.id 
    END) as pending_verifications,
    COUNT(DISTINCT CASE 
        WHEN idet.assessment_status = 'approvata' 
        THEN c.id 
    END) as approved_cases,
    COUNT(DISTINCT CASE 
        WHEN idet.assessment_status = 'respinta' 
        THEN c.id 
    END) as rejected_cases
FROM profiles p
LEFT JOIN cases c ON c.doctor_id = p.id
LEFT JOIN invalidity_details idet ON c.id = idet.case_id
LEFT JOIN medical_certificates mc ON c.id = mc.case_id
WHERE p.role = 'doctor'
GROUP BY p.id, p.full_name;
