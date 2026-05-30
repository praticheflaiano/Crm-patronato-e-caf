-- Harden objects created by the 0009 invalidità foundation
-- (flagged by the Supabase security advisor): a SECURITY DEFINER view and
-- two functions with a mutable search_path.

drop view if exists public.doctor_dashboard_summary;
create view public.doctor_dashboard_summary
with (security_invoker = true) as
select
    p.id as doctor_id,
    p.full_name as doctor_name,
    count(distinct case when c.status not in ('completed','rejected') then c.id end) as active_cases,
    count(distinct case when idet.certification_expiry_date < current_date and idet.certification_expiry_date is not null then c.id end) as expired_certificates,
    count(distinct case when mc.verification_status = 'pending' then mc.id end) as pending_verifications,
    count(distinct case when idet.assessment_status = 'approvata' then c.id end) as approved_cases,
    count(distinct case when idet.assessment_status = 'respinta' then c.id end) as rejected_cases
from public.profiles p
left join public.cases c on c.doctor_id = p.id
left join public.invalidity_details idet on c.id = idet.case_id
left join public.medical_certificates mc on c.id = mc.case_id
where p.role = 'doctor'
group by p.id, p.full_name;

create or replace function public.check_certificate_expiry()
returns void language plpgsql set search_path = ''
as $$
begin
    update public.medical_certificates
    set verification_status = 'expired', updated_at = now()
    where expiry_date < current_date and verification_status = 'verified';
end;
$$;

create or replace function public.get_doctor_assigned_cases(doctor_user_id uuid)
returns table (
    case_id uuid, case_title text, case_status text, contact_name text,
    disability_type text, disability_percentage integer, certification_status text, next_action text
) language plpgsql security definer set search_path = ''
as $$
begin
    return query
    select c.id, c.title, c.status::text,
        concat(cont.first_name, ' ', cont.last_name),
        idet.disability_type, idet.disability_percentage,
        case
            when idet.assessment_status = 'approvata' then 'Approvata'
            when idet.assessment_status = 'respinta' then 'Respinta'
            when idet.assessment_status = 'in_istruttoria' then 'In Istruttoria'
            when idet.assessment_status = 'presentata' then 'Presentata'
            else 'In Corso'
        end,
        case
            when mc.id is null then 'Certificato mancante'
            when mc.verification_status = 'pending' then 'Da verificare'
            when idet.certification_expiry_date < current_date then 'Certificato scaduto'
            when idet.assessment_status = 'in_corso' then 'In attesa visita INPS'
            when idet.assessment_status = 'presentata' then 'In attesa esito'
            else 'Nessuna azione richiesta'
        end
    from public.cases c
    left join public.contacts cont on c.contact_id = cont.id
    left join public.invalidity_details idet on c.id = idet.case_id
    left join public.medical_certificates mc on c.id = mc.case_id
    where c.doctor_id = doctor_user_id or idet.medical_examiner_id = doctor_user_id
    order by
        case when idet.certification_expiry_date < current_date then 0
             when mc.verification_status = 'pending' then 1 else 2 end,
        c.updated_at desc;
end;
$$;
