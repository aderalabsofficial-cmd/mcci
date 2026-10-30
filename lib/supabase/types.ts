
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "api": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "ai_extraction_begin":
{ Args: { "p_application": string,"p_doc_key": string }; Returns: string
                           },
"ai_extraction_finish":
{ Args: { "p_extraction": string,"p_fields": Json,"p_model": string,"p_ok": boolean }; Returns: undefined
                           },
"app_blacklist":
{ Args: { "p_app": string,"p_note": string,"p_on": boolean }; Returns: undefined
                           },
"app_check":
{ Args: { "p_app": string,"p_item": string,"p_on": boolean }; Returns: undefined
                           },
"app_create":
{ Args: { "p_company": string }; Returns: {
              "id": string,"token": string
            }[]
                           },
"app_doc_remove":
{ Args: { "p_document": string }; Returns: undefined
                           },
"app_edit_field":
{ Args: { "p_app": string,"p_field": string,"p_reason": string,"p_value": string }; Returns: undefined
                           },
"app_endorsements":
{ Args: { "p_app": string }; Returns: {
              "company": string,"decided_at": string,"decline_reason": string,"expires_at": string,"id": string,"last_reminded_at": string,"member_no": string,"message": string,"ref": string,"reminders": number,"rep": string,"requested_at": string,"role": string,"signature_path": string,"status": string
            }[]
                           },
"app_forward":
{ Args: { "p_app": string,"p_member_no": string }; Returns: string
                           },
"app_missing":
{ Args: { "p_app": string }; Returns: (string)[]
                           },
"app_open":
{ Args: { "p_app": string }; Returns: string
                           },
"app_reject":
{ Args: { "p_app": string,"p_reason": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"to_email": string,"token": string
            }[]
                           },
"app_resubmit":
{ Args: { "p_app": string }; Returns: undefined
                           },
"app_return":
{ Args: { "p_app": string,"p_note": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"to_email": string,"token": string
            }[]
                           },
"app_set_class":
{ Args: { "p_app": string,"p_class": Database["public"]['Enums']["member_class"],"p_reason": string }; Returns: undefined
                           },
"app_start":
{ Args: Record<PropertyKey, never>; Returns: {
              "company_id": string,"id": string,"token": string
            }[]
                           },
"app_submit":
{ Args: { "p_app": string }; Returns: string
                           },
"app_verify":
{ Args: { "p_app": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"stage": string,"to_email": string,"token": string
            }[]
                           },
"app_withdraw":
{ Args: { "p_app": string,"p_reason"?: string }; Returns: undefined
                           },
"audit_export":
{ Args: { "p_days"?: number,"p_q"?: string }; Returns: {
              "action": string,"at": string,"new_value": Json,"object": string,"object_id": string,"old_value": Json,"reason": string,"result": string,"user_name": string
            }[]
                           },
"biz_consent_record":
{ Args: { "p_company": string,"p_evidence": string,"p_method": string,"p_status": string }; Returns: undefined
                           },
"biz_contact_save":
{ Args: { "p_company": string,"p_name": string,"p_phone": string }; Returns: undefined
                           },
"biz_count":
{ Args: { "p_def": Json,"p_q": string }; Returns: Json
                           },
"biz_duplicates":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"biz_export":
{ Args: { "p_def": Json,"p_excluded": (string)[],"p_fields": (string)[],"p_format": string,"p_ids": (string)[],"p_log": boolean,"p_q": string,"p_reason": string }; Returns: Json
                           },
"biz_facets":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"biz_meta_save":
{ Args: { "p_city": string,"p_company": string,"p_district": string,"p_notes": string }; Returns: undefined
                           },
"biz_profile":
{ Args: { "p_member": string }; Returns: Json
                           },
"biz_search":
{ Args: { "p_def": Json,"p_dir": string,"p_page": number,"p_q": string,"p_size": number,"p_sort": string }; Returns: Json
                           },
"biz_suppress":
{ Args: { "p_company": string,"p_reason": string }; Returns: undefined
                           },
"biz_tag_create":
{ Args: { "p_name": string }; Returns: string
                           },
"biz_tag_set":
{ Args: { "p_company": string,"p_on": boolean,"p_tag": string }; Returns: undefined
                           },
"biz_unsuppress":
{ Args: { "p_company": string,"p_reason": string }; Returns: undefined
                           },
"cert_file":
{ Args: { "p_code": string }; Returns: {
              "member_no": string,"path": string,"status": string
            }[]
                           },
"cert_scan_confirm":
{ Args: { "p_id": string,"p_member": string,"p_note"?: string,"p_override"?: boolean }; Returns: {
              "code": string,"member_no": string
            }[]
                           },
"cert_scan_extracted":
{ Args: { "p_data": Json,"p_id": string }; Returns: {
              "conflicts": (string)[],"member_id": string,"status": string
            }[]
                           },
"cert_scan_register":
{ Args: { "p_file_name": string,"p_id": string,"p_path": string,"p_sha256": string }; Returns: string
                           },
"cert_scan_reject":
{ Args: { "p_id": string,"p_note": string }; Returns: undefined
                           },
"cert_scan_stamped":
{ Args: { "p_id": string,"p_path": string,"p_placement": Json }; Returns: undefined
                           },
"cert_view":
{ Args: { "p_code": string }; Returns: {
              "class": string,"code": string,"company": string,"expires_at": string,"extended": boolean,"issued_at": string,"kind": string,"member_no": string,"status": string,"temp_status": string,"title": string,"valid_to": string,"voucher_no": string,"women": boolean
            }[]
                           },
"cmt_approve_all":
{ Args: { "p_meeting": string }; Returns: {
              "amount": number,"application_id": string,"decision": string,"due_at": string,"email_id": number,"lang": string,"member_no": string,"name": string,"next_meeting": string,"to_email": string,"token": string,"voucher_no": string
            }[]
                           },
"cmt_assign_decide":
{ Args: { "p_approve": boolean,"p_id": string,"p_note"?: string }; Returns: undefined
                           },
"cmt_assign_propose":
{ Args: { "p_convener": string,"p_members": (string)[],"p_note"?: string }; Returns: string
                           },
"cmt_committee":
{ Args: Record<PropertyKey, never>; Returns: {
              "convener": string,"convener_name": string,"decided_at": string,"decided_by_name": string,"decision_note": string,"id": string,"me_convener": boolean,"me_member": boolean,"members": Json,"note": string,"proposed_at": string,"proposed_by_name": string,"status": string
            }[]
                           },
"cmt_decide":
{ Args: { "p_app": string,"p_decision": string,"p_meeting": string,"p_note"?: string }; Returns: {
              "amount": number,"application_id": string,"decision": string,"due_at": string,"email_id": number,"lang": string,"member_no": string,"name": string,"next_meeting": string,"to_email": string,"token": string,"voucher_no": string
            }[]
                           },
"cmt_decide_direct":
{ Args: { "p_app": string,"p_decision": string,"p_note"?: string }; Returns: {
              "amount": number,"application_id": string,"decision": string,"due_at": string,"email_id": number,"lang": string,"member_no": string,"name": string,"to_email": string,"token": string,"voucher_no": string
            }[]
                           },
"cmt_meeting_create":
{ Args: { "p_committee": string,"p_held_on": string,"p_name": string }; Returns: {
              "meeting_id": string,"placed": number
            }[]
                           },
"cmt_minutes":
{ Args: { "p_meeting": string,"p_minutes": string }; Returns: undefined
                           },
"cmt_note":
{ Args: { "p_app": string,"p_note": string }; Returns: undefined
                           },
"company_people":
{ Args: { "p_company": string }; Returns: {
              "created_at": string,"email": string,"full_name": string,"role": Database["public"]['Enums']["company_role"],"user_id": string
            }[]
                           },
"company_user_update":
{ Args: { "p_active": boolean,"p_company": string,"p_role": Database["public"]['Enums']["company_role"],"p_user": string }; Returns: undefined
                           },
"demo_add":
{ Args: { "p_class": Database["public"]['Enums']["member_class"],"p_company": string,"p_days"?: number,"p_kind": string,"p_owner_email": string,"p_owner_name": string,"p_rep": string }; Returns: {
              "company_id": string,"invitation_id": string,"member_no": string,"token": string
            }[]
                           },
"demo_clear":
{ Args: Record<PropertyKey, never>; Returns: {
              "id": string,"kind": string
            }[]
                           },
"demo_mark":
{ Args: { "p_company": string,"p_days"?: number }; Returns: string
                           },
"demo_markable":
{ Args: Record<PropertyKey, never>; Returns: {
              "company": string,"company_id": string,"created_at": string,"owner_email": string,"stage": Database["public"]['Enums']["app_stage"],"token": string
            }[]
                           },
"demo_purge":
{ Args: { "p_apply"?: boolean,"p_companies": (string)[] }; Returns: {
              "item": string,"kind": string,"n": number
            }[]
                           },
"doc_review":
{ Args: { "p_document": string,"p_ok": boolean,"p_reason"?: string }; Returns: undefined
                           },
"doc_verify":
{ Args: { "p_code": string }; Returns: {
              "code": string,"company": string,"issued": string,"kind": string,"member_no": string,"status": string,"superseded_by": string,"title": string,"valid_to": string
            }[]
                           },
"email_mark":
{ Args: { "p_email": number,"p_error"?: string,"p_ok": boolean,"p_provider_id"?: string }; Returns: undefined
                           },
"end_approve":
{ Args: { "p_endorsement": string,"p_ip"?: string,"p_user_agent"?: string }; Returns: string
                           },
"end_candidates":
{ Args: { "p_app": string,"p_query"?: string,"p_role": Database["public"]['Enums']["endorse_role"] }; Returns: {
              "class": string,"company": string,"member_id": string,"member_no": string,"rep": string,"same_sector": boolean,"sector": string,"why": string,"year_count": number
            }[]
                           },
"end_code_issue":
{ Args: { "p_endorsement": string,"p_user": string }; Returns: {
              "code": string,"email": string
            }[]
                           },
"end_decline":
{ Args: { "p_endorsement": string,"p_reason": string }; Returns: undefined
                           },
"end_inbox":
{ Args: Record<PropertyKey, never>; Returns: {
              "address": string,"applicant": string,"biz": string,"business": string,"class": string,"decided_at": string,"decline_reason": string,"est": string,"expires_at": string,"id": string,"manufacturing": boolean,"member_no": string,"message": string,"my_company": string,"nature": string,"partners": (string)[],"ref": string,"requested_at": string,"role": string,"status": string,"token": string
            }[]
                           },
"end_jobs":
{ Args: Record<PropertyKey, never>; Returns: {
              "business": string,"email": string,"full_name": string,"kind": string,"lang": string,"role": string,"token": string
            }[]
                           },
"end_remind":
{ Args: { "p_endorsement": string }; Returns: {
              "applicant": string,"business": string,"email": string,"full_name": string,"lang": string,"role": string,"token": string
            }[]
                           },
"end_request":
{ Args: { "p_app": string,"p_member": string,"p_message": string,"p_role": Database["public"]['Enums']["endorse_role"] }; Returns: {
              "applicant": string,"business": string,"email": string,"endorsement_id": string,"full_name": string,"lang": string,"token": string
            }[]
                           },
"end_sign":
{ Args: { "p_code": string,"p_declaration": string,"p_doc_hash": string,"p_endorsement": string,"p_ip": string,"p_signature_path": string,"p_user_agent": string }; Returns: string
                           },
"end_withdraw":
{ Args: { "p_endorsement": string }; Returns: undefined
                           },
"ev_save":
{ Args: { "p_body": string,"p_body_ur": string,"p_id": string,"p_published": boolean,"p_seats": number,"p_starts_at": string,"p_title": string,"p_title_ur": string,"p_type": string,"p_venue": string }; Returns: string
                           },
"event_register":
{ Args: { "p_company": string,"p_event": string }; Returns: {
              "email_id": number,"name": string,"starts_at": string,"ticket_code": string,"title": string,"to_email": string,"venue": string
            }[]
                           },
"file_access":
{ Args: { "p_bucket": string,"p_mode": string,"p_path": string }; Returns: boolean
                           },
"import_commit":
{ Args: { "p_confirm": string,"p_import": string }; Returns: {
              "created": number,"failed": number,"skipped": number,"updated": number
            }[]
                           },
"import_decide":
{ Args: { "p_decision": string,"p_import": string,"p_row": number }; Returns: undefined
                           },
"import_discard":
{ Args: { "p_import": string }; Returns: undefined
                           },
"import_invite_mark":
{ Args: { "p_import": string,"p_ok": boolean,"p_row": number }; Returns: undefined
                           },
"import_invite_next":
{ Args: { "p_import": string,"p_limit"?: number,"p_retry"?: boolean }; Returns: {
              "company": string,"email": string,"full_name": string,"row_no": number,"token": string
            }[]
                           },
"import_rollback":
{ Args: { "p_import": string }; Returns: {
              "kept": number,"removed": number
            }[]
                           },
"import_stage":
{ Args: { "p_ai": boolean,"p_file_name": string,"p_file_path": string,"p_rows": Json,"p_source": string }; Returns: {
              "import_id": string,"rows_error": number,"rows_exists": number,"rows_new": number,"rows_possible": number,"rows_total": number
            }[]
                           },
"invite_accept":
{ Args: { "p_token": string,"p_user": string }; Returns: {
              "company_id": string,"kind": string
            }[]
                           },
"invite_company_user":
{ Args: { "p_company": string,"p_email": string,"p_full_name": string,"p_role": Database["public"]['Enums']["company_role"] }; Returns: {
              "id": string,"token": string
            }[]
                           },
"invite_lookup":
{ Args: { "p_token": string }; Returns: {
              "company_name": string,"company_role": Database["public"]['Enums']["company_role"],"designation": string,"email": string,"expires_at": string,"full_name": string,"id": string,"kind": string,"status": Database["public"]['Enums']["invite_status"]
            }[]
                           },
"invite_resend":
{ Args: { "p_id": string }; Returns: string
                           },
"invite_revoke":
{ Args: { "p_id": string }; Returns: undefined
                           },
"invite_staff":
{ Args: { "p_designation": string,"p_email": string,"p_full_name": string }; Returns: {
              "id": string,"token": string
            }[]
                           },
"member_add":
{ Args: { "p_biz": Database["public"]['Enums']["biz_type"],"p_class": Database["public"]['Enums']["member_class"],"p_company": string,"p_member_no": string,"p_owner_email": string,"p_owner_name": string,"p_rep": string,"p_sector": string,"p_since": string,"p_valid_to": string,"p_women": boolean }; Returns: {
              "company_id": string,"invitation_id": string,"member_id": string,"member_no": string,"token": string
            }[]
                           },
"member_blacklist":
{ Args: { "p_member": string,"p_note": string,"p_on": boolean }; Returns: undefined
                           },
"member_renew_start":
{ Args: { "p_member": string }; Returns: string
                           },
"member_restore":
{ Args: { "p_member": string,"p_reason": string }; Returns: string
                           },
"my_access":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"note_read":
{ Args: { "p_note": string }; Returns: undefined
                           },
"note_read_all":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"opp_close":
{ Args: { "p_id": string }; Returns: undefined
                           },
"opp_decide":
{ Args: { "p_id": string,"p_publish": boolean,"p_reason": string }; Returns: undefined
                           },
"opp_interest":
{ Args: { "p_body": string,"p_company": string,"p_id": string }; Returns: undefined
                           },
"opp_post":
{ Args: { "p_body": string,"p_company": string,"p_days": number,"p_market": string,"p_sector": string,"p_title": string }; Returns: string
                           },
"opp_share":
{ Args: { "p_body": string,"p_days": number,"p_market": string,"p_sector": string,"p_title": string }; Returns: string
                           },
"opp_withdraw_interest":
{ Args: { "p_company": string,"p_id": string }; Returns: undefined
                           },
"opp_withdraw_post":
{ Args: { "p_id": string }; Returns: undefined
                           },
"pay_counter":
{ Args: { "p_note"?: string,"p_ref": string,"p_voucher": string }; Returns: {
              "amount": number,"app_id": string,"email_id": number,"expires_at": string,"lang": string,"member_no": string,"name": string,"ref_type": string,"temp_code": string,"to_email": string,"voucher_no": string
            }[]
                           },
"pay_reject":
{ Args: { "p_reason": string,"p_voucher": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"to_email": string,"voucher_no": string
            }[]
                           },
"pay_upload":
{ Args: { "p_bank_ref"?: string,"p_path": string,"p_sha256"?: string,"p_voucher": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"to_email": string,"voucher_no": string
            }[]
                           },
"pay_verify":
{ Args: { "p_voucher": string }; Returns: {
              "amount": number,"app_id": string,"email_id": number,"expires_at": string,"lang": string,"member_no": string,"name": string,"ref_type": string,"temp_code": string,"to_email": string,"voucher_no": string
            }[]
                           },
"post_save":
{ Args: { "p_body": string,"p_body_ur": string,"p_category": string,"p_id": string,"p_status": string,"p_title": string,"p_title_ur": string }; Returns: string
                           },
"public_verify_code":
{ Args: { "p_channel": string,"p_client": string,"p_code": string }; Returns: {
              "business_name": string,"category": string,"certificate_ref": string,"certificate_status": string,"checked_on": string,"class": string,"member_no": string,"member_since": string,"member_status": string,"replaced_by": string,"valid_to": string
            }[]
                           },
"public_verify_log":
{ Args: { "p_channel": string,"p_client": string,"p_outcome": string }; Returns: undefined
                           },
"public_verify_member":
{ Args: { "p_client": string,"p_no": string }; Returns: {
              "business_name": string,"category": string,"certificate_ref": string,"certificate_status": string,"checked_on": string,"class": string,"member_no": string,"member_since": string,"member_status": string,"replaced_by": string,"valid_to": string
            }[]
                           },
"qr_revoke":
{ Args: { "p_code": string,"p_reason": string }; Returns: undefined
                           },
"rate_limit_take":
{ Args: { "p_bucket": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"reauth_mark":
{ Args: { "p_user": string }; Returns: undefined
                           },
"register_export":
{ Args: Record<PropertyKey, never>; Returns: {
              "address": string,"blacklisted": boolean,"class": string,"company": string,"email": string,"gst": string,"member_no": string,"ntn": string,"rep_name": string,"sector": string,"since": string,"status": string,"tel": string,"valid_to": string,"women": boolean
            }[]
                           },
"role_permission_set":
{ Args: { "p_designation": string,"p_level": number,"p_module": string }; Returns: undefined
                           },
"role_permissions_reset":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"role_permissions_save":
{ Args: { "p_designation": string,"p_levels": Json }; Returns: number
                           },
"seg_delete":
{ Args: { "p_id": string }; Returns: undefined
                           },
"seg_save":
{ Args: { "p_def": Json,"p_description": string,"p_id": string,"p_name": string }; Returns: string
                           },
"settings_bank":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"settings_bank_save":
{ Args: { "p_bank": string,"p_branch": string,"p_confirmed": boolean,"p_iban": string,"p_title": string }; Returns: undefined
                           },
"settings_editable":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"settings_for_server":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"settings_save":
{ Args: { "p_key": string,"p_reason"?: string,"p_value": Json }; Returns: Json
                           },
"site_contact":
{ Args: { "p_body": string,"p_category": string,"p_contact": string,"p_kind": string,"p_name": string,"p_ref": string,"p_subject": string }; Returns: {
              "public_ref": string,"ticket": string
            }[]
                           },
"site_feed":
{ Args: { "p_limit"?: number }; Returns: {
              "at": string,"kind": string,"status": string,"token": string
            }[]
                           },
"site_stats":
{ Args: Record<PropertyKey, never>; Returns: {
              "applications_open": number,"associate": number,"corporate": number,"members": number,"services_issued": number,"services_open": number
            }[]
                           },
"site_track":
{ Args: { "p_token": string }; Returns: {
              "decided_at": string,"due_at": string,"kind": string,"printing": boolean,"status": string,"submitted_at": string,"token": string
            }[]
                           },
"staff_directory":
{ Args: Record<PropertyKey, never>; Returns: {
              "active": boolean,"created_at": string,"designation": string,"email": string,"full_name": string,"last_sign_in_at": string,"seniority": number,"totp": boolean,"user_id": string
            }[]
                           },
"staff_mfa_reset":
{ Args: { "p_user": string }; Returns: undefined
                           },
"staff_update":
{ Args: { "p_active": boolean,"p_designation": string,"p_user": string }; Returns: undefined
                           },
"svc_approve":
{ Args: { "p_request": string }; Returns: undefined
                           },
"svc_can":
{ Args: { "p_company": string }; Returns: boolean
                           },
"svc_cancel":
{ Args: { "p_request": string }; Returns: undefined
                           },
"svc_new":
{ Args: { "p_company": string,"p_service": string }; Returns: {
              "id": string,"token": string
            }[]
                           },
"svc_reject":
{ Args: { "p_reason": string,"p_request": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"service": string,"to_email": string,"token": string
            }[]
                           },
"svc_resubmit":
{ Args: { "p_note"?: string,"p_request": string }; Returns: {
              "token": string
            }[]
                           },
"svc_return":
{ Args: { "p_note": string,"p_request": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"service": string,"to_email": string,"token": string
            }[]
                           },
"svc_save":
{ Args: { "p_data": Json,"p_request": string }; Returns: undefined
                           },
"svc_sign":
{ Args: { "p_request": string }; Returns: {
              "code": string,"email_id": number,"lang": string,"name": string,"service": string,"to_email": string,"token": string
            }[]
                           },
"svc_sign_all":
{ Args: Record<PropertyKey, never>; Returns: {
              "code": string,"email_id": number,"lang": string,"name": string,"service": string,"to_email": string,"token": string
            }[]
                           },
"svc_start":
{ Args: { "p_request": string }; Returns: undefined
                           },
"svc_submit":
{ Args: { "p_request": string }; Returns: {
              "email_id": number,"lang": string,"name": string,"service": string,"to_email": string,"token": string,"voucher_no": string
            }[]
                           },
"svcset_save":
{ Args: { "p_active": boolean,"p_docs": Json,"p_fee": number,"p_fields": Json,"p_key": string,"p_sla_hours": number }; Returns: undefined
                           },
"temp_extend":
{ Args: { "p_reason": string,"p_temp": string }; Returns: {
              "email_id": number,"expires_at": string,"lang": string,"name": string,"to_email": string
            }[]
                           },
"temp_issue":
{ Args: { "p_app": string }; Returns: {
              "code": string,"email_id": number,"expires_at": string,"lang": string,"member_id": string,"member_no": string,"name": string,"to_email": string
            }[]
                           },
"temp_jobs":
{ Args: Record<PropertyKey, never>; Returns: {
              "company_id": string,"email": string,"expires_at": string,"full_name": string,"kind": string,"lang": string,"member_no": string
            }[]
                           },
"temp_policy":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"temp_revoke":
{ Args: { "p_reason": string,"p_temp": string }; Returns: undefined
                           },
"ticket_assign":
{ Args: { "p_staff": string,"p_ticket": string }; Returns: undefined
                           },
"ticket_new":
{ Args: { "p_body": string,"p_company": string,"p_subject": string }; Returns: string
                           },
"ticket_reply":
{ Args: { "p_body": string,"p_ticket": string }; Returns: {
              "email_id": number,"name": string,"staff": boolean,"ticket": string,"to_email": string
            }[]
                           },
"ticket_resolve":
{ Args: { "p_note": string,"p_ticket": string }; Returns: {
              "email_id": number,"name": string,"ticket": string,"to_email": string
            }[]
                           },
"voucher_cancel":
{ Args: { "p_reason": string,"p_voucher": string }; Returns: undefined
                           },
"voucher_jobs":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"voucher_reissue":
{ Args: { "p_voucher": string }; Returns: string
                           },
"voucher_view":
{ Args: { "p_voucher": string }; Returns: {
              "amount": number,"bank": Json,"company": string,"created_at": string,"due_at": string,"lines": Json,"member_no": string,"ref_type": string,"status": string,"token": string,"voucher_no": string
            }[]
                           },
"wa_audience_preview":
{ Args: { "p_category": string,"p_def": Json,"p_excluded": (string)[],"p_ids": (string)[],"p_kind": string,"p_q": string,"p_template": string }; Returns: Json
                           },
"wa_campaign_control":
{ Args: { "p_action": string,"p_id": string }; Returns: undefined
                           },
"wa_campaign_create":
{ Args: { "p_attachment": string,"p_body": string,"p_category": string,"p_def": Json,"p_excluded": (string)[],"p_ids": (string)[],"p_kind": string,"p_mode": string,"p_name": string,"p_purpose": string,"p_q": string,"p_segment": string,"p_template": string }; Returns: string
                           },
"wa_campaign_decide":
{ Args: { "p_approve": boolean,"p_id": string,"p_reason": string }; Returns: undefined
                           },
"wa_campaign_options":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"wa_campaign_start":
{ Args: { "p_at": string,"p_confirm": number,"p_id": string }; Returns: undefined
                           },
"wa_campaign_stats":
{ Args: { "p_id": string }; Returns: Json
                           },
"wa_campaign_submit":
{ Args: { "p_id": string }; Returns: string
                           },
"wa_claim":
{ Args: { "p_limit": number }; Returns: Json
                           },
"wa_consent_overview":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"wa_consent_record":
{ Args: { "p_categories": (string)[],"p_company": string,"p_evidence": string,"p_method": string,"p_status": string }; Returns: undefined
                           },
"wa_contact_language":
{ Args: { "p_company": string,"p_language": string }; Returns: undefined
                           },
"wa_conversation_link":
{ Args: { "p_company": string,"p_id": string }; Returns: undefined
                           },
"wa_conversation_update":
{ Args: { "p_assigned": string,"p_id": string,"p_status": string }; Returns: undefined
                           },
"wa_dashboard":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"wa_health_mark":
{ Args: { "p_error": string,"p_status": string,"p_steps": Json }; Returns: undefined
                           },
"wa_member_consent":
{ Args: { "p_categories": (string)[],"p_company": string,"p_grant": boolean,"p_name": string,"p_phone": string }; Returns: undefined
                           },
"wa_my_consent":
{ Args: { "p_company": string }; Returns: Json
                           },
"wa_note_add":
{ Args: { "p_body": string,"p_id": string }; Returns: undefined
                           },
"wa_reconcile":
{ Args: { "p_code": string,"p_detail": string,"p_id": string,"p_state": string,"p_wa_id": string }; Returns: undefined
                           },
"wa_reconcile_list":
{ Args: { "p_limit": number }; Returns: Json
                           },
"wa_result":
{ Args: { "p_code": string,"p_detail": string,"p_id": string,"p_outcome": string,"p_provider_id": string,"p_wa_id": string }; Returns: undefined
                           },
"wa_send_prepare":
{ Args: { "p_attachment": string,"p_body": string,"p_category": string,"p_company": string,"p_kind": string,"p_template": string }; Returns: string
                           },
"wa_settings_read":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"wa_settings_save":
{ Args: { "p_values": Json }; Returns: undefined
                           },
"wa_template_save":
{ Args: { "p_body": string,"p_footer": string,"p_header": string,"p_header_type": string,"p_id": string,"p_var_map": Json }; Returns: undefined
                           },
"wa_templates_sync":
{ Args: { "p_rows": Json }; Returns: number
                           },
"wa_webhook":
{ Args: { "p_data": Json,"p_event_id": string,"p_type": string }; Returns: string
                           },
"wa_webhook_reject":
{ Args: { "p_reason": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "account_deletion_requests": {
                  Row: {
                    "created_at": string,"decided_at": string | null,"decided_by": string | null,"id": string,"reason": string | null,"status": Database["public"]['Enums']["deletion_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"reason"?: string | null,"status"?: Database["public"]['Enums']["deletion_status"],"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"reason"?: string | null,"status"?: Database["public"]['Enums']["deletion_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "account_deletion_requests_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "account_deletion_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"ai_conversations": {
                  Row: {
                    "created_at": string,"id": string,"messages": NonNullable<Json>,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"messages"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"messages"?: NonNullable<Json>,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_conversations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"ai_extractions": {
                  Row: {
                    "application_id": string | null,"company_id": string,"created_at": string,"created_by": string | null,"doc_key": string,"fields": Json | null,"id": string,"model": string | null,"service_request_id": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"company_id": string,"created_at"?: string,"created_by"?: string | null,"doc_key": string,"fields"?: Json | null,"id"?: string,"model"?: string | null,"service_request_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "application_id"?: string | null,"company_id"?: string,"created_at"?: string,"created_by"?: string | null,"doc_key"?: string,"fields"?: Json | null,"id"?: string,"model"?: string | null,"service_request_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_extractions_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_extractions_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_extractions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_extractions_service_request_id_fkey"
      columns: ["service_request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"application_document_versions": {
                  Row: {
                    "application_id": string,"document_id": string,"file_name": string | null,"id": number,"key": string,"mime": string | null,"path": string,"sha256": string | null,"size_bytes": number | null,"uploaded_at": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"document_id": string,"file_name"?: string | null,"id"?: never,"key": string,"mime"?: string | null,"path": string,"sha256"?: string | null,"size_bytes"?: number | null,"uploaded_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "application_id"?: string,"document_id"?: string,"file_name"?: string | null,"id"?: never,"key"?: string,"mime"?: string | null,"path"?: string,"sha256"?: string | null,"size_bytes"?: number | null,"uploaded_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_document_versions_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_document_versions_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "application_documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_document_versions_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"application_documents": {
                  Row: {
                    "ai_extract": Json | null,"application_id": string,"created_at": string,"file_name": string | null,"id": string,"key": string,"mime": string | null,"path": string,"reject_reason": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"size_bytes": number | null,"status": Database["public"]['Enums']["doc_status"],"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_extract"?: Json | null,"application_id": string,"created_at"?: string,"file_name"?: string | null,"id"?: string,"key": string,"mime"?: string | null,"path": string,"reject_reason"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"size_bytes"?: number | null,"status"?: Database["public"]['Enums']["doc_status"],"uploaded_by"?: string | null
                  }
                  Update: {
                    "ai_extract"?: Json | null,"application_id"?: string,"created_at"?: string,"file_name"?: string | null,"id"?: string,"key"?: string,"mime"?: string | null,"path"?: string,"reject_reason"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"size_bytes"?: number | null,"status"?: Database["public"]['Enums']["doc_status"],"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_documents_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_documents_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_documents_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"application_form_snapshots": {
                  Row: {
                    "application_id": string,"created_at": string,"id": string,"pdf_path": string,"reason": string,"sha256": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"created_at"?: string,"id"?: string,"pdf_path": string,"reason": string,"sha256": string
                  }
                  Update: {
                    "application_id"?: string,"created_at"?: string,"id"?: string,"pdf_path"?: string,"reason"?: string,"sha256"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_form_snapshots_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    }
                  ]
                },"application_history": {
                  Row: {
                    "application_id": string,"at": string,"by_name": string | null,"by_user": string | null,"id": number,"note": string | null,"step": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"at"?: string,"by_name"?: string | null,"by_user"?: string | null,"id"?: never,"note"?: string | null,"step": string
                  }
                  Update: {
                    "application_id"?: string,"at"?: string,"by_name"?: string | null,"by_user"?: string | null,"id"?: never,"note"?: string | null,"step"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_history_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "application_history_by_user_fkey"
      columns: ["by_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"application_partners": {
                  Row: {
                    "address": string | null,"application_id": string,"cnic": string | null,"email": string | null,"extra_card": boolean,"id": string,"mobile": string | null,"name": string,"photo_path": string | null,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"application_id": string,"cnic"?: string | null,"email"?: string | null,"extra_card"?: boolean,"id"?: string,"mobile"?: string | null,"name": string,"photo_path"?: string | null,"position": number
                  }
                  Update: {
                    "address"?: string | null,"application_id"?: string,"cnic"?: string | null,"email"?: string | null,"extra_card"?: boolean,"id"?: string,"mobile"?: string | null,"name"?: string,"photo_path"?: string | null,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "application_partners_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    }
                  ]
                },"applications": {
                  Row: {
                    "address_matches_ntn": boolean | null,"blacklist_note": string | null,"blacklisted": boolean,"class": Database["public"]['Enums']["member_class"] | null,"company_id": string,"created_at": string,"created_by": string,"decided_at": string | null,"decl1": boolean,"decl2": boolean,"field_confidence": NonNullable<Json>,"form": NonNullable<Json>,"id": string,"jurisdiction_ok": boolean | null,"kind": string,"member_id": string | null,"member_no": string | null,"photo_path": string | null,"reject_note": string | null,"return_note": string | null,"review": NonNullable<Json>,"sign_path": string | null,"stage": Database["public"]['Enums']["app_stage"],"stamp_path": string | null,"submitted_at": string | null,"token": string,"updated_at": string,"women": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "address_matches_ntn"?: boolean | null,"blacklist_note"?: string | null,"blacklisted"?: boolean,"class"?: Database["public"]['Enums']["member_class"] | null,"company_id": string,"created_at"?: string,"created_by": string,"decided_at"?: string | null,"decl1"?: boolean,"decl2"?: boolean,"field_confidence"?: NonNullable<Json>,"form"?: NonNullable<Json>,"id"?: string,"jurisdiction_ok"?: boolean | null,"kind"?: string,"member_id"?: string | null,"member_no"?: string | null,"photo_path"?: string | null,"reject_note"?: string | null,"return_note"?: string | null,"review"?: NonNullable<Json>,"sign_path"?: string | null,"stage"?: Database["public"]['Enums']["app_stage"],"stamp_path"?: string | null,"submitted_at"?: string | null,"token"?: string,"updated_at"?: string,"women"?: boolean
                  }
                  Update: {
                    "address_matches_ntn"?: boolean | null,"blacklist_note"?: string | null,"blacklisted"?: boolean,"class"?: Database["public"]['Enums']["member_class"] | null,"company_id"?: string,"created_at"?: string,"created_by"?: string,"decided_at"?: string | null,"decl1"?: boolean,"decl2"?: boolean,"field_confidence"?: NonNullable<Json>,"form"?: NonNullable<Json>,"id"?: string,"jurisdiction_ok"?: boolean | null,"kind"?: string,"member_id"?: string | null,"member_no"?: string | null,"photo_path"?: string | null,"reject_note"?: string | null,"return_note"?: string | null,"review"?: NonNullable<Json>,"sign_path"?: string | null,"stage"?: Database["public"]['Enums']["app_stage"],"stamp_path"?: string | null,"submitted_at"?: string | null,"token"?: string,"updated_at"?: string,"women"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "applications_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "applications_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_role": string | null,"at": string,"id": number,"ip": unknown,"new_value": Json | null,"object": string | null,"object_id": string | null,"old_value": Json | null,"reason": string | null,"request_id": string | null,"result": string,"user_id": string | null,"user_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_role"?: string | null,"at"?: string,"id"?: never,"ip"?: unknown,"new_value"?: Json | null,"object"?: string | null,"object_id"?: string | null,"old_value"?: Json | null,"reason"?: string | null,"request_id"?: string | null,"result"?: string,"user_id"?: string | null,"user_name"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_role"?: string | null,"at"?: string,"id"?: never,"ip"?: unknown,"new_value"?: Json | null,"object"?: string | null,"object_id"?: string | null,"old_value"?: Json | null,"reason"?: string | null,"request_id"?: string | null,"result"?: string,"user_id"?: string | null,"user_name"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"certificate_scans": {
                  Row: {
                    "conflicts": (string)[],"document_id": string | null,"extracted": NonNullable<Json>,"file_name": string | null,"id": string,"log": NonNullable<Json>,"match_member": string | null,"path": string,"qr_placement": Json | null,"review_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"sha256": string,"stamped_path": string | null,"status": string,"uploaded_at": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "conflicts"?: (string)[],"document_id"?: string | null,"extracted"?: NonNullable<Json>,"file_name"?: string | null,"id"?: string,"log"?: NonNullable<Json>,"match_member"?: string | null,"path": string,"qr_placement"?: Json | null,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sha256": string,"stamped_path"?: string | null,"status"?: string,"uploaded_at"?: string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "conflicts"?: (string)[],"document_id"?: string | null,"extracted"?: NonNullable<Json>,"file_name"?: string | null,"id"?: string,"log"?: NonNullable<Json>,"match_member"?: string | null,"path"?: string,"qr_placement"?: Json | null,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sha256"?: string,"stamped_path"?: string | null,"status"?: string,"uploaded_at"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificate_scans_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificate_scans_match_member_fkey"
      columns: ["match_member"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificate_scans_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificate_scans_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"change_requests": {
                  Row: {
                    "company_id": string,"created_at": string,"decided_at": string | null,"decided_by": string | null,"field": string,"id": string,"new_value": string,"old_value": string | null,"reason": string | null,"requested_by": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"field": string,"id"?: string,"new_value": string,"old_value"?: string | null,"reason"?: string | null,"requested_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"field"?: string,"id"?: string,"new_value"?: string,"old_value"?: string | null,"reason"?: string | null,"requested_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "change_requests_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "change_requests_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "change_requests_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"committee_assignments": {
                  Row: {
                    "committee": string,"convener": string,"decided_at": string | null,"decided_by": string | null,"decision_note": string | null,"id": string,"members": (string)[],"note": string | null,"proposed_at": string,"proposed_by": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "committee"?: string,"convener": string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"id"?: string,"members"?: (string)[],"note"?: string | null,"proposed_at"?: string,"proposed_by": string,"status"?: string
                  }
                  Update: {
                    "committee"?: string,"convener"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"id"?: string,"members"?: (string)[],"note"?: string | null,"proposed_at"?: string,"proposed_by"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "committee_assignments_convener_fkey"
      columns: ["convener"]
isOneToOne: false
      referencedRelation: "staff"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "committee_assignments_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "committee_assignments_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"committee_items": {
                  Row: {
                    "application_id": string,"decided_at": string | null,"decided_by": string | null,"decision": string | null,"item_no": number | null,"meeting_id": string,"note": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"decided_at"?: string | null,"decided_by"?: string | null,"decision"?: string | null,"item_no"?: number | null,"meeting_id": string,"note"?: string | null
                  }
                  Update: {
                    "application_id"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision"?: string | null,"item_no"?: number | null,"meeting_id"?: string,"note"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "committee_items_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "committee_items_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "committee_items_meeting_id_fkey"
      columns: ["meeting_id"]
isOneToOne: false
      referencedRelation: "meetings"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "address": string | null,"biz_type": Database["public"]['Enums']["biz_type"],"created_at": string,"demo": boolean,"demo_expires_at": string | null,"email": string | null,"established": string | null,"fax": string | null,"gst": string | null,"id": string,"manufacturing": boolean,"name": string,"nature_items": (string)[] | null,"nature_sector": string | null,"ntn": string | null,"particulars": string | null,"sales_tax": boolean,"sector": string | null,"tel": string | null,"turnover_50m": boolean,"web": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"biz_type": Database["public"]['Enums']["biz_type"],"created_at"?: string,"demo"?: boolean,"demo_expires_at"?: string | null,"email"?: string | null,"established"?: string | null,"fax"?: string | null,"gst"?: string | null,"id"?: string,"manufacturing"?: boolean,"name": string,"nature_items"?: (string)[] | null,"nature_sector"?: string | null,"ntn"?: string | null,"particulars"?: string | null,"sales_tax"?: boolean,"sector"?: string | null,"tel"?: string | null,"turnover_50m"?: boolean,"web"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"biz_type"?: Database["public"]['Enums']["biz_type"],"created_at"?: string,"demo"?: boolean,"demo_expires_at"?: string | null,"email"?: string | null,"established"?: string | null,"fax"?: string | null,"gst"?: string | null,"id"?: string,"manufacturing"?: boolean,"name"?: string,"nature_items"?: (string)[] | null,"nature_sector"?: string | null,"ntn"?: string | null,"particulars"?: string | null,"sales_tax"?: boolean,"sector"?: string | null,"tel"?: string | null,"turnover_50m"?: boolean,"web"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"company_tags": {
                  Row: {
                    "added_at": string,"added_by": string | null,"company_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"added_by"?: string | null,"company_id": string,"tag_id": string
                  }
                  Update: {
                    "added_at"?: string,"added_by"?: string | null,"company_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_tags_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_tags_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "outreach_tags"
      referencedColumns: ["id"]
    }
                  ]
                },"company_users": {
                  Row: {
                    "company_id": string,"created_at": string,"role": Database["public"]['Enums']["company_role"],"status": Database["public"]['Enums']["invite_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"role": Database["public"]['Enums']["company_role"],"status"?: Database["public"]['Enums']["invite_status"],"user_id": string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["company_role"],"status"?: Database["public"]['Enums']["invite_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "company_users_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "company_users_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "accepted_at": string,"document": string,"user_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string,"document": string,"user_id"?: string,"version": string
                  }
                  Update: {
                    "accepted_at"?: string,"document"?: string,"user_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"designations": {
                  Row: {
                    "name": string,"seniority": number
                  }
                  ComputedFields: never
                  Insert: {
                    "name": string,"seniority": number
                  }
                  Update: {
                    "name"?: string,"seniority"?: number
                  }
                  Relationships: [
                    
                  ]
                },"device_tokens": {
                  Row: {
                    "app_version": string | null,"created_at": string,"lang": string | null,"last_seen_at": string,"platform": string,"token": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version"?: string | null,"created_at"?: string,"lang"?: string | null,"last_seen_at"?: string,"platform"?: string,"token": string,"user_id"?: string
                  }
                  Update: {
                    "app_version"?: string | null,"created_at"?: string,"lang"?: string | null,"last_seen_at"?: string,"platform"?: string,"token"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "device_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"document_requirements": {
                  Row: {
                    "biz_type": Database["public"]['Enums']["biz_type"],"key": string,"label_en": string,"label_ur": string | null,"required": boolean,"short_en": string | null,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "biz_type": Database["public"]['Enums']["biz_type"],"key": string,"label_en": string,"label_ur"?: string | null,"required"?: boolean,"short_en"?: string | null,"sort": number
                  }
                  Update: {
                    "biz_type"?: Database["public"]['Enums']["biz_type"],"key"?: string,"label_en"?: string,"label_ur"?: string | null,"required"?: boolean,"short_en"?: string | null,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"documents": {
                  Row: {
                    "code": string,"company_id": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["doc_kind"],"member_id": string | null,"path": string | null,"revoked_reason": string | null,"scans": number,"status": Database["public"]['Enums']["qr_status"],"superseded_by": string | null,"title": string,"valid_to": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code"?: string,"company_id"?: string | null,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["doc_kind"],"member_id"?: string | null,"path"?: string | null,"revoked_reason"?: string | null,"scans"?: number,"status"?: Database["public"]['Enums']["qr_status"],"superseded_by"?: string | null,"title": string,"valid_to"?: string | null
                  }
                  Update: {
                    "code"?: string,"company_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["doc_kind"],"member_id"?: string | null,"path"?: string | null,"revoked_reason"?: string | null,"scans"?: number,"status"?: Database["public"]['Enums']["qr_status"],"superseded_by"?: string | null,"title"?: string,"valid_to"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_superseded_by_fkey"
      columns: ["superseded_by"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    }
                  ]
                },"email_log": {
                  Row: {
                    "application_id": string | null,"at": string,"created_by": string | null,"error": string | null,"id": number,"provider_id": string | null,"status": string | null,"template_key": string | null,"to_email": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id"?: string | null,"at"?: string,"created_by"?: string | null,"error"?: string | null,"id"?: never,"provider_id"?: string | null,"status"?: string | null,"template_key"?: string | null,"to_email"?: string | null
                  }
                  Update: {
                    "application_id"?: string | null,"at"?: string,"created_by"?: string | null,"error"?: string | null,"id"?: never,"provider_id"?: string | null,"status"?: string | null,"template_key"?: string | null,"to_email"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_log_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_log_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"email_templates": {
                  Row: {
                    "active": boolean,"body_en": string,"body_ur": string | null,"event": string,"key": string,"subject_en": string,"subject_ur": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"body_en": string,"body_ur"?: string | null,"event": string,"key": string,"subject_en": string,"subject_ur"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"body_en"?: string,"body_ur"?: string | null,"event"?: string,"key"?: string,"subject_en"?: string,"subject_ur"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"endorsements": {
                  Row: {
                    "application_id": string,"decided_at": string | null,"decided_by": string | null,"declaration_text": string | null,"decline_reason": string | null,"doc_hash": string | null,"endorser_member_id": string,"expires_at": string,"id": string,"ip": unknown,"last_reminded_at": string | null,"message": string | null,"otp_verified_at": string | null,"ref": string | null,"reminders": number,"requested_at": string,"role": Database["public"]['Enums']["endorse_role"],"signature_path": string | null,"status": Database["public"]['Enums']["endorse_status"],"user_agent": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"decided_at"?: string | null,"decided_by"?: string | null,"declaration_text"?: string | null,"decline_reason"?: string | null,"doc_hash"?: string | null,"endorser_member_id": string,"expires_at": string,"id"?: string,"ip"?: unknown,"last_reminded_at"?: string | null,"message"?: string | null,"otp_verified_at"?: string | null,"ref"?: string | null,"reminders"?: number,"requested_at"?: string,"role": Database["public"]['Enums']["endorse_role"],"signature_path"?: string | null,"status"?: Database["public"]['Enums']["endorse_status"],"user_agent"?: string | null
                  }
                  Update: {
                    "application_id"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"declaration_text"?: string | null,"decline_reason"?: string | null,"doc_hash"?: string | null,"endorser_member_id"?: string,"expires_at"?: string,"id"?: string,"ip"?: unknown,"last_reminded_at"?: string | null,"message"?: string | null,"otp_verified_at"?: string | null,"ref"?: string | null,"reminders"?: number,"requested_at"?: string,"role"?: Database["public"]['Enums']["endorse_role"],"signature_path"?: string | null,"status"?: Database["public"]['Enums']["endorse_status"],"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "endorsements_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "endorsements_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "endorsements_endorser_member_id_fkey"
      columns: ["endorser_member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registrations": {
                  Row: {
                    "at": string,"checked_in_at": string | null,"checked_in_by": string | null,"company_id": string,"event_id": string,"ticket_code": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"checked_in_at"?: string | null,"checked_in_by"?: string | null,"company_id": string,"event_id": string,"ticket_code"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "at"?: string,"checked_in_at"?: string | null,"checked_in_by"?: string | null,"company_id"?: string,"event_id"?: string,"ticket_code"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_checked_in_by_fkey"
      columns: ["checked_in_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "body": string | null,"body_ur": string | null,"id": string,"published": boolean,"seats": number | null,"starts_at": string,"title": string,"title_ur": string | null,"type": string | null,"venue": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"body_ur"?: string | null,"id"?: string,"published"?: boolean,"seats"?: number | null,"starts_at": string,"title": string,"title_ur"?: string | null,"type"?: string | null,"venue"?: string | null
                  }
                  Update: {
                    "body"?: string | null,"body_ur"?: string | null,"id"?: string,"published"?: boolean,"seats"?: number | null,"starts_at"?: string,"title"?: string,"title_ur"?: string | null,"type"?: string | null,"venue"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"export_log": {
                  Row: {
                    "at": string,"fields": (string)[],"filters": NonNullable<Json>,"format": string,"id": number,"reason": string | null,"record_count": number,"sensitive": boolean,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"fields": (string)[],"filters": NonNullable<Json>,"format": string,"id"?: never,"reason"?: string | null,"record_count": number,"sensitive": boolean,"user_id"?: string | null
                  }
                  Update: {
                    "at"?: string,"fields"?: (string)[],"filters"?: NonNullable<Json>,"format"?: string,"id"?: never,"reason"?: string | null,"record_count"?: number,"sensitive"?: boolean,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "export_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"file_access_log": {
                  Row: {
                    "allowed": boolean,"at": string,"bucket": string,"designation": string | null,"id": number,"mode": string,"path": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "allowed": boolean,"at"?: string,"bucket": string,"designation"?: string | null,"id"?: never,"mode": string,"path": string,"user_id"?: string | null
                  }
                  Update: {
                    "allowed"?: boolean,"at"?: string,"bucket"?: string,"designation"?: string | null,"id"?: never,"mode"?: string,"path"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "file_access_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"import_rows": {
                  Row: {
                    "confidence": number | null,"created_member": string | null,"data": NonNullable<Json>,"decision": string,"import_id": string,"invitation_id": string | null,"invite_status": string | null,"invited_at": string | null,"issues": NonNullable<Json>,"match": string,"match_member": string | null,"raw": Json | null,"result": string | null,"row_no": number
                  }
                  ComputedFields: never
                  Insert: {
                    "confidence"?: number | null,"created_member"?: string | null,"data": NonNullable<Json>,"decision": string,"import_id": string,"invitation_id"?: string | null,"invite_status"?: string | null,"invited_at"?: string | null,"issues"?: NonNullable<Json>,"match": string,"match_member"?: string | null,"raw"?: Json | null,"result"?: string | null,"row_no": number
                  }
                  Update: {
                    "confidence"?: number | null,"created_member"?: string | null,"data"?: NonNullable<Json>,"decision"?: string,"import_id"?: string,"invitation_id"?: string | null,"invite_status"?: string | null,"invited_at"?: string | null,"issues"?: NonNullable<Json>,"match"?: string,"match_member"?: string | null,"raw"?: Json | null,"result"?: string | null,"row_no"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "import_rows_created_member_fkey"
      columns: ["created_member"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "import_rows_import_id_fkey"
      columns: ["import_id"]
isOneToOne: false
      referencedRelation: "imports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "import_rows_invitation_id_fkey"
      columns: ["invitation_id"]
isOneToOne: false
      referencedRelation: "invitations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "import_rows_match_member_fkey"
      columns: ["match_member"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"imports": {
                  Row: {
                    "ai": boolean,"at": string,"by_user": string | null,"committed_at": string | null,"committed_by": string | null,"file_name": string | null,"file_path": string | null,"id": string,"report": Json | null,"rows_error": number | null,"rows_ok": number | null,"rows_total": number | null,"source": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai"?: boolean,"at"?: string,"by_user"?: string | null,"committed_at"?: string | null,"committed_by"?: string | null,"file_name"?: string | null,"file_path"?: string | null,"id"?: string,"report"?: Json | null,"rows_error"?: number | null,"rows_ok"?: number | null,"rows_total"?: number | null,"source"?: string | null,"status"?: string
                  }
                  Update: {
                    "ai"?: boolean,"at"?: string,"by_user"?: string | null,"committed_at"?: string | null,"committed_by"?: string | null,"file_name"?: string | null,"file_path"?: string | null,"id"?: string,"report"?: Json | null,"rows_error"?: number | null,"rows_ok"?: number | null,"rows_total"?: number | null,"source"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "imports_by_user_fkey"
      columns: ["by_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "imports_committed_by_fkey"
      columns: ["committed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"company_id": string | null,"company_role": Database["public"]['Enums']["company_role"] | null,"created_at": string,"designation": string | null,"email": string,"expires_at": string,"full_name": string | null,"id": string,"invited_by": string | null,"kind": string,"revoked_by": string | null,"status": Database["public"]['Enums']["invite_status"],"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"company_id"?: string | null,"company_role"?: Database["public"]['Enums']["company_role"] | null,"created_at"?: string,"designation"?: string | null,"email": string,"expires_at"?: string,"full_name"?: string | null,"id"?: string,"invited_by"?: string | null,"kind": string,"revoked_by"?: string | null,"status"?: Database["public"]['Enums']["invite_status"],"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"company_id"?: string | null,"company_role"?: Database["public"]['Enums']["company_role"] | null,"created_at"?: string,"designation"?: string | null,"email"?: string,"expires_at"?: string,"full_name"?: string | null,"id"?: string,"invited_by"?: string | null,"kind"?: string,"revoked_by"?: string | null,"status"?: Database["public"]['Enums']["invite_status"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_company_fk"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_designation_fkey"
      columns: ["designation"]
isOneToOne: false
      referencedRelation: "designations"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "invitations_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"job_runs": {
                  Row: {
                    "finished_at": string | null,"id": number,"job": string,"result": string | null,"started_at": string,"summary": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "finished_at"?: string | null,"id"?: never,"job": string,"result"?: string | null,"started_at"?: string,"summary"?: Json | null
                  }
                  Update: {
                    "finished_at"?: string | null,"id"?: never,"job"?: string,"result"?: string | null,"started_at"?: string,"summary"?: Json | null
                  }
                  Relationships: [
                    
                  ]
                },"meetings": {
                  Row: {
                    "committee": string,"created_at": string,"created_by": string | null,"held_on": string | null,"id": string,"minutes": string | null,"minutes_path": string | null,"name": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "committee": string,"created_at"?: string,"created_by"?: string | null,"held_on"?: string | null,"id": string,"minutes"?: string | null,"minutes_path"?: string | null,"name"?: string | null,"status"?: string
                  }
                  Update: {
                    "committee"?: string,"created_at"?: string,"created_by"?: string | null,"held_on"?: string | null,"id"?: string,"minutes"?: string | null,"minutes_path"?: string | null,"name"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meetings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"member_cards": {
                  Row: {
                    "company_id": string,"created_at": string,"document_id": string | null,"holder_name": string,"id": string,"kind": string,"member_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"document_id"?: string | null,"holder_name": string,"id"?: string,"kind": string,"member_id": string,"status"?: string
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"document_id"?: string | null,"holder_name"?: string,"id"?: string,"kind"?: string,"member_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_cards_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_cards_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_cards_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"members": {
                  Row: {
                    "blacklist_note": string | null,"blacklisted": boolean,"blacklisted_at": string | null,"class": Database["public"]['Enums']["member_class"],"company_id": string,"created_at": string,"id": string,"imported": boolean,"member_no": string,"public_listing": boolean,"rep_name": string,"restored_at": string | null,"serial": string | null,"since": string,"status": Database["public"]['Enums']["member_status"],"suspended_reason": string | null,"valid_to": string,"whitelist_note": string | null,"whitelisted_at": string | null,"women": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "blacklist_note"?: string | null,"blacklisted"?: boolean,"blacklisted_at"?: string | null,"class": Database["public"]['Enums']["member_class"],"company_id": string,"created_at"?: string,"id"?: string,"imported"?: boolean,"member_no": string,"public_listing"?: boolean,"rep_name": string,"restored_at"?: string | null,"serial"?: string | null,"since": string,"status": Database["public"]['Enums']["member_status"],"suspended_reason"?: string | null,"valid_to": string,"whitelist_note"?: string | null,"whitelisted_at"?: string | null,"women"?: boolean
                  }
                  Update: {
                    "blacklist_note"?: string | null,"blacklisted"?: boolean,"blacklisted_at"?: string | null,"class"?: Database["public"]['Enums']["member_class"],"company_id"?: string,"created_at"?: string,"id"?: string,"imported"?: boolean,"member_no"?: string,"public_listing"?: boolean,"rep_name"?: string,"restored_at"?: string | null,"serial"?: string | null,"since"?: string,"status"?: Database["public"]['Enums']["member_status"],"suspended_reason"?: string | null,"valid_to"?: string,"whitelist_note"?: string | null,"whitelisted_at"?: string | null,"women"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "members_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"notification_reads": {
                  Row: {
                    "notification_id": string,"read_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "notification_id": string,"read_at"?: string,"user_id": string
                  }
                  Update: {
                    "notification_id"?: string,"read_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_reads_notification_id_fkey"
      columns: ["notification_id"]
isOneToOne: false
      referencedRelation: "notifications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notification_reads_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "area": string | null,"body": string,"channel": string,"company_id": string | null,"created_at": string,"id": string,"link": string | null,"read_at": string | null,"template": string | null,"title": string,"user_id": string | null,"vars": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "area"?: string | null,"body": string,"channel"?: string,"company_id"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"template"?: string | null,"title": string,"user_id"?: string | null,"vars"?: NonNullable<Json>
                  }
                  Update: {
                    "area"?: string | null,"body"?: string,"channel"?: string,"company_id"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"template"?: string | null,"title"?: string,"user_id"?: string | null,"vars"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "body": string,"company_id": string | null,"created_at": string,"created_by": string | null,"decided_at": string | null,"decided_by": string | null,"expires_at": string,"id": string,"kind": string,"market": string | null,"reject_reason": string | null,"sector": string | null,"status": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"decided_at"?: string | null,"decided_by"?: string | null,"expires_at"?: string,"id"?: string,"kind": string,"market"?: string | null,"reject_reason"?: string | null,"sector"?: string | null,"status"?: string,"title": string
                  }
                  Update: {
                    "body"?: string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"decided_at"?: string | null,"decided_by"?: string | null,"expires_at"?: string,"id"?: string,"kind"?: string,"market"?: string | null,"reject_reason"?: string | null,"sector"?: string | null,"status"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunity_replies": {
                  Row: {
                    "body": string,"company_id": string,"created_at": string,"created_by": string | null,"id": string,"opportunity_id": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"company_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"opportunity_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"company_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"opportunity_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunity_replies_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_replies_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_replies_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    }
                  ]
                },"outreach_consents": {
                  Row: {
                    "categories": (string)[],"company_id": string,"evidence": string | null,"id": number,"method": string,"phone": string,"recorded_at": string,"recorded_by": string | null,"status": string,"wording_version": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "categories"?: (string)[],"company_id": string,"evidence"?: string | null,"id"?: never,"method": string,"phone": string,"recorded_at"?: string,"recorded_by"?: string | null,"status": string,"wording_version"?: string | null
                  }
                  Update: {
                    "categories"?: (string)[],"company_id"?: string,"evidence"?: string | null,"id"?: never,"method"?: string,"phone"?: string,"recorded_at"?: string,"recorded_by"?: string | null,"status"?: string,"wording_version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "outreach_consents_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outreach_consents_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"outreach_contacts": {
                  Row: {
                    "company_id": string,"language": string | null,"name": string | null,"phone": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"language"?: string | null,"name"?: string | null,"phone": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"language"?: string | null,"name"?: string | null,"phone"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "outreach_contacts_company_id_fkey"
      columns: ["company_id"]
isOneToOne: true
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outreach_contacts_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"outreach_profiles": {
                  Row: {
                    "city": string | null,"company_id": string,"district": string | null,"notes": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"company_id": string,"district"?: string | null,"notes"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "city"?: string | null,"company_id"?: string,"district"?: string | null,"notes"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "outreach_profiles_company_id_fkey"
      columns: ["company_id"]
isOneToOne: true
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outreach_profiles_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"outreach_suppressions": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"id": string,"lifted_at": string | null,"lifted_by": string | null,"lifted_reason": string | null,"phone": string,"reason": string,"source": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lifted_at"?: string | null,"lifted_by"?: string | null,"lifted_reason"?: string | null,"phone": string,"reason": string,"source": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"id"?: string,"lifted_at"?: string | null,"lifted_by"?: string | null,"lifted_reason"?: string | null,"phone"?: string,"reason"?: string,"source"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outreach_suppressions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "outreach_suppressions_lifted_by_fkey"
      columns: ["lifted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"outreach_tags": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "outreach_tags_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_receipts": {
                  Row: {
                    "bank_ref": string | null,"company_id": string,"decided_at": string | null,"decided_by": string | null,"id": string,"method": string,"path": string | null,"reason": string | null,"sha256": string | null,"status": Database["public"]['Enums']["receipt_status"],"uploaded_at": string,"uploaded_by": string | null,"voucher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bank_ref"?: string | null,"company_id": string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"method"?: string,"path"?: string | null,"reason"?: string | null,"sha256"?: string | null,"status"?: Database["public"]['Enums']["receipt_status"],"uploaded_at"?: string,"uploaded_by"?: string | null,"voucher_id": string
                  }
                  Update: {
                    "bank_ref"?: string | null,"company_id"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"method"?: string,"path"?: string | null,"reason"?: string | null,"sha256"?: string | null,"status"?: Database["public"]['Enums']["receipt_status"],"uploaded_at"?: string,"uploaded_by"?: string | null,"voucher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_receipts_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_receipts_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_receipts_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_receipts_voucher_id_fkey"
      columns: ["voucher_id"]
isOneToOne: false
      referencedRelation: "payment_vouchers"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_vouchers": {
                  Row: {
                    "amount": number,"company_id": string,"created_at": string,"due_at": string,"id": string,"lines": NonNullable<Json>,"paid_at": string | null,"provider": string,"ref_id": string,"ref_type": string,"reject_reason": string | null,"status": Database["public"]['Enums']["voucher_status"],"verified_by": string | null,"voucher_no": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"company_id": string,"created_at"?: string,"due_at": string,"id"?: string,"lines": NonNullable<Json>,"paid_at"?: string | null,"provider"?: string,"ref_id": string,"ref_type": string,"reject_reason"?: string | null,"status"?: Database["public"]['Enums']["voucher_status"],"verified_by"?: string | null,"voucher_no"?: string
                  }
                  Update: {
                    "amount"?: number,"company_id"?: string,"created_at"?: string,"due_at"?: string,"id"?: string,"lines"?: NonNullable<Json>,"paid_at"?: string | null,"provider"?: string,"ref_id"?: string,"ref_type"?: string,"reject_reason"?: string | null,"status"?: Database["public"]['Enums']["voucher_status"],"verified_by"?: string | null,"voucher_no"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_vouchers_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_vouchers_verified_by_fkey"
      columns: ["verified_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "body": string,"body_ur": string | null,"category": string | null,"id": string,"published_at": string | null,"slug": string | null,"status": string,"title": string,"title_ur": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"body_ur"?: string | null,"category"?: string | null,"id"?: string,"published_at"?: string | null,"slug"?: string | null,"status"?: string,"title": string,"title_ur"?: string | null
                  }
                  Update: {
                    "body"?: string,"body_ur"?: string | null,"category"?: string | null,"id"?: string,"published_at"?: string | null,"slug"?: string | null,"status"?: string,"title"?: string,"title_ur"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"print_batches": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"printer": string,"received_at": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["batch_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id": string,"printer": string,"received_at"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["batch_status"]
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"printer"?: string,"received_at"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["batch_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "print_batches_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"print_items": {
                  Row: {
                    "batch_id": string | null,"converted_at": string | null,"courier": string | null,"created_at": string,"delivery_mode": string | null,"id": string,"member_id": string,"reason": string,"received_at": string | null,"scan_path": string | null,"serial": string | null,"status": Database["public"]['Enums']["print_status"],"tracking": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id"?: string | null,"converted_at"?: string | null,"courier"?: string | null,"created_at"?: string,"delivery_mode"?: string | null,"id"?: string,"member_id": string,"reason"?: string,"received_at"?: string | null,"scan_path"?: string | null,"serial"?: string | null,"status"?: Database["public"]['Enums']["print_status"],"tracking"?: string | null
                  }
                  Update: {
                    "batch_id"?: string | null,"converted_at"?: string | null,"courier"?: string | null,"created_at"?: string,"delivery_mode"?: string | null,"id"?: string,"member_id"?: string,"reason"?: string,"received_at"?: string | null,"scan_path"?: string | null,"serial"?: string | null,"status"?: Database["public"]['Enums']["print_status"],"tracking"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "print_items_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "print_batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "print_items_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "cnic": string | null,"created_at": string,"email": string,"full_name": string,"id": string,"lang": string,"mobile": string | null,"prefs": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cnic"?: string | null,"created_at"?: string,"email": string,"full_name": string,"id": string,"lang"?: string,"mobile"?: string | null,"prefs"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "cnic"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"lang"?: string,"mobile"?: string | null,"prefs"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_log": {
                  Row: {
                    "at": string,"category": string | null,"id": number,"status": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"category"?: string | null,"id"?: never,"status"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "at"?: string,"category"?: string | null,"id"?: never,"status"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reminders": {
                  Row: {
                    "company_id": string | null,"id": string,"kind": string,"member_id": string | null,"sent_at": string,"sent_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string | null,"id"?: string,"kind": string,"member_id"?: string | null,"sent_at"?: string,"sent_by"?: string | null
                  }
                  Update: {
                    "company_id"?: string | null,"id"?: string,"kind"?: string,"member_id"?: string | null,"sent_at"?: string,"sent_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reminders_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminders_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reminders_sent_by_fkey"
      columns: ["sent_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "designation": string,"level": number,"module": string
                  }
                  ComputedFields: never
                  Insert: {
                    "designation": string,"level": number,"module": string
                  }
                  Update: {
                    "designation"?: string,"level"?: number,"module"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_designation_fkey"
      columns: ["designation"]
isOneToOne: false
      referencedRelation: "designations"
      referencedColumns: ["name"]
    }
                  ]
                },"segments": {
                  Row: {
                    "created_at": string,"created_by": string | null,"definition": NonNullable<Json>,"description": string | null,"id": string,"kind": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"definition": NonNullable<Json>,"description"?: string | null,"id"?: string,"kind"?: string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"definition"?: NonNullable<Json>,"description"?: string | null,"id"?: string,"kind"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "segments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"serial_spoilage": {
                  Row: {
                    "at": string,"by_user": string | null,"reason": string,"serial": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"by_user"?: string | null,"reason": string,"serial": string
                  }
                  Update: {
                    "at"?: string,"by_user"?: string | null,"reason"?: string,"serial"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "serial_spoilage_by_user_fkey"
      columns: ["by_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"service_documents": {
                  Row: {
                    "created_at": string,"file_name": string | null,"id": string,"key": string,"path": string,"request_id": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"file_name"?: string | null,"id"?: string,"key": string,"path": string,"request_id": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"file_name"?: string | null,"id"?: string,"key"?: string,"path"?: string,"request_id"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_documents_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_documents_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"service_history": {
                  Row: {
                    "at": string,"by_name": string | null,"by_user": string | null,"id": number,"note": string | null,"request_id": string,"step": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"by_name"?: string | null,"by_user"?: string | null,"id"?: never,"note"?: string | null,"request_id": string,"step": string
                  }
                  Update: {
                    "at"?: string,"by_name"?: string | null,"by_user"?: string | null,"id"?: never,"note"?: string | null,"request_id"?: string,"step"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_history_by_user_fkey"
      columns: ["by_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_history_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"service_messages": {
                  Row: {
                    "at": string,"body": string,"by_user": string,"id": number,"request_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"body": string,"by_user"?: string,"id"?: never,"request_id": string
                  }
                  Update: {
                    "at"?: string,"body"?: string,"by_user"?: string,"id"?: never,"request_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_messages_by_user_fkey"
      columns: ["by_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_messages_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "service_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"service_requests": {
                  Row: {
                    "approved_at": string | null,"assigned_to": string | null,"company_id": string,"created_by": string | null,"data": NonNullable<Json>,"draft": boolean,"id": string,"issued_at": string | null,"issued_doc": string | null,"reject_reason": string | null,"return_note": string | null,"service_key": string,"signed_by": string | null,"sla_due_at": string,"started_at": string | null,"status": Database["public"]['Enums']["svc_status"],"submitted_at": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"assigned_to"?: string | null,"company_id": string,"created_by"?: string | null,"data"?: NonNullable<Json>,"draft"?: boolean,"id"?: string,"issued_at"?: string | null,"issued_doc"?: string | null,"reject_reason"?: string | null,"return_note"?: string | null,"service_key": string,"signed_by"?: string | null,"sla_due_at": string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["svc_status"],"submitted_at"?: string,"token"?: string
                  }
                  Update: {
                    "approved_at"?: string | null,"assigned_to"?: string | null,"company_id"?: string,"created_by"?: string | null,"data"?: NonNullable<Json>,"draft"?: boolean,"id"?: string,"issued_at"?: string | null,"issued_doc"?: string | null,"reject_reason"?: string | null,"return_note"?: string | null,"service_key"?: string,"signed_by"?: string | null,"sla_due_at"?: string,"started_at"?: string | null,"status"?: Database["public"]['Enums']["svc_status"],"submitted_at"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_requests_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_issued_doc_fkey"
      columns: ["issued_doc"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "service_requests_service_key_fkey"
      columns: ["service_key"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "service_requests_signed_by_fkey"
      columns: ["signed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"service_types": {
                  Row: {
                    "active": boolean,"docs": NonNullable<Json>,"fee": number,"fields": NonNullable<Json>,"full_name_en": string | null,"key": string,"name_en": string,"name_ur": string | null,"sla_hours": number,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"docs": NonNullable<Json>,"fee"?: number,"fields": NonNullable<Json>,"full_name_en"?: string | null,"key": string,"name_en": string,"name_ur"?: string | null,"sla_hours"?: number,"sort"?: number
                  }
                  Update: {
                    "active"?: boolean,"docs"?: NonNullable<Json>,"fee"?: number,"fields"?: NonNullable<Json>,"full_name_en"?: string | null,"key"?: string,"name_en"?: string,"name_ur"?: string | null,"sla_hours"?: number,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"staff": {
                  Row: {
                    "active": boolean,"created_at": string,"deactivated_at": string | null,"deactivated_by": string | null,"designation": string,"totp_enabled": boolean,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"designation": string,"totp_enabled"?: boolean,"user_id": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"designation"?: string,"totp_enabled"?: boolean,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_deactivated_by_fkey"
      columns: ["deactivated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_designation_fkey"
      columns: ["designation"]
isOneToOne: false
      referencedRelation: "designations"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "staff_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_permission_overrides": {
                  Row: {
                    "level": number,"module": string,"reason": string,"set_at": string,"set_by": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "level": number,"module": string,"reason": string,"set_at"?: string,"set_by"?: string | null,"user_id": string
                  }
                  Update: {
                    "level"?: number,"module"?: string,"reason"?: string,"set_at"?: string,"set_by"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_permission_overrides_set_by_fkey"
      columns: ["set_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_permission_overrides_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "staff"
      referencedColumns: ["user_id"]
    }
                  ]
                },"temp_memberships": {
                  Row: {
                    "alerts_sent": (number)[],"certificate_doc": string | null,"expires_at": string,"extend_reason": string | null,"extended_days": number,"extensions": number,"id": string,"issued_at": string,"member_id": string,"status": Database["public"]['Enums']["temp_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "alerts_sent"?: (number)[],"certificate_doc"?: string | null,"expires_at": string,"extend_reason"?: string | null,"extended_days"?: number,"extensions"?: number,"id"?: string,"issued_at"?: string,"member_id": string,"status"?: Database["public"]['Enums']["temp_status"]
                  }
                  Update: {
                    "alerts_sent"?: (number)[],"certificate_doc"?: string | null,"expires_at"?: string,"extend_reason"?: string | null,"extended_days"?: number,"extensions"?: number,"id"?: string,"issued_at"?: string,"member_id"?: string,"status"?: Database["public"]['Enums']["temp_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "temp_memberships_certificate_doc_fkey"
      columns: ["certificate_doc"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "temp_memberships_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"ticket_messages": {
                  Row: {
                    "at": string,"body": string,"by_name": string | null,"by_user": string | null,"id": number,"ticket_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"body": string,"by_name"?: string | null,"by_user"?: string | null,"id"?: never,"ticket_id": string
                  }
                  Update: {
                    "at"?: string,"body"?: string,"by_name"?: string | null,"by_user"?: string | null,"id"?: never,"ticket_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ticket_messages_by_user_fkey"
      columns: ["by_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ticket_messages_ticket_id_fkey"
      columns: ["ticket_id"]
isOneToOne: false
      referencedRelation: "tickets"
      referencedColumns: ["id"]
    }
                  ]
                },"tickets": {
                  Row: {
                    "assigned_to": string | null,"body": string,"company_id": string | null,"created_at": string,"created_by": string | null,"email": string | null,"id": string,"name": string | null,"public_ref": string,"status": Database["public"]['Enums']["ticket_status"],"subject": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"body": string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"email"?: string | null,"id"?: string,"name"?: string | null,"public_ref"?: string,"status"?: Database["public"]['Enums']["ticket_status"],"subject": string
                  }
                  Update: {
                    "assigned_to"?: string | null,"body"?: string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"email"?: string | null,"id"?: string,"name"?: string | null,"public_ref"?: string,"status"?: Database["public"]['Enums']["ticket_status"],"subject"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tickets_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tickets_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tickets_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"verify_attempts": {
                  Row: {
                    "at": string,"channel": string,"client": string | null,"id": number,"outcome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"channel": string,"client"?: string | null,"id"?: never,"outcome": string
                  }
                  Update: {
                    "at"?: string,"channel"?: string,"client"?: string | null,"id"?: never,"outcome"?: string
                  }
                  Relationships: [
                    
                  ]
                },"whatsapp_attachments": {
                  Row: {
                    "bytes": number,"created_at": string,"file_name": string,"id": string,"kind": string,"mime": string,"path": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bytes": number,"created_at"?: string,"file_name": string,"id"?: string,"kind": string,"mime": string,"path": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "bytes"?: number,"created_at"?: string,"file_name"?: string,"id"?: string,"kind"?: string,"mime"?: string,"path"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_attachments_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_campaign_recipients": {
                  Row: {
                    "business_name": string,"campaign_id": string,"company_id": string | null,"id": string,"member_no": string | null,"message_id": string | null,"phone": string | null,"reason": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name": string,"campaign_id": string,"company_id"?: string | null,"id"?: string,"member_no"?: string | null,"message_id"?: string | null,"phone"?: string | null,"reason"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "business_name"?: string,"campaign_id"?: string,"company_id"?: string | null,"id"?: string,"member_no"?: string | null,"message_id"?: string | null,"phone"?: string | null,"reason"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_campaign_recipients_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "whatsapp_campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_campaign_recipients_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_campaigns": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"attachment_id": string | null,"body": string | null,"category": string,"created_at": string,"created_by": string | null,"filter": NonNullable<Json>,"finished_at": string | null,"id": string,"message_kind": string,"mode": string,"name": string,"purpose": string | null,"reject_reason": string | null,"scheduled_at": string | null,"segment_id": string | null,"started_at": string | null,"status": string,"template_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"attachment_id"?: string | null,"body"?: string | null,"category": string,"created_at"?: string,"created_by"?: string | null,"filter"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: string,"message_kind": string,"mode"?: string,"name": string,"purpose"?: string | null,"reject_reason"?: string | null,"scheduled_at"?: string | null,"segment_id"?: string | null,"started_at"?: string | null,"status"?: string,"template_id"?: string | null
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"attachment_id"?: string | null,"body"?: string | null,"category"?: string,"created_at"?: string,"created_by"?: string | null,"filter"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: string,"message_kind"?: string,"mode"?: string,"name"?: string,"purpose"?: string | null,"reject_reason"?: string | null,"scheduled_at"?: string | null,"segment_id"?: string | null,"started_at"?: string | null,"status"?: string,"template_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_campaigns_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_campaigns_attachment_id_fkey"
      columns: ["attachment_id"]
isOneToOne: false
      referencedRelation: "whatsapp_attachments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_campaigns_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_campaigns_segment_id_fkey"
      columns: ["segment_id"]
isOneToOne: false
      referencedRelation: "segments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_campaigns_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "whatsapp_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_conversations": {
                  Row: {
                    "assigned_to": string | null,"company_id": string | null,"created_at": string,"id": string,"last_inbound_at": string | null,"last_outbound_at": string | null,"phone": string,"profile_name": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"company_id"?: string | null,"created_at"?: string,"id"?: string,"last_inbound_at"?: string | null,"last_outbound_at"?: string | null,"phone": string,"profile_name"?: string | null,"status"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"company_id"?: string | null,"created_at"?: string,"id"?: string,"last_inbound_at"?: string | null,"last_outbound_at"?: string | null,"phone"?: string,"profile_name"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_conversations_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_conversations_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_health": {
                  Row: {
                    "checked_at": string | null,"id": boolean,"last_auth_failure_at": string | null,"last_error": string | null,"last_ok_at": string | null,"status": string,"steps": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_at"?: string | null,"id"?: boolean,"last_auth_failure_at"?: string | null,"last_error"?: string | null,"last_ok_at"?: string | null,"status"?: string,"steps"?: NonNullable<Json>
                  }
                  Update: {
                    "checked_at"?: string | null,"id"?: boolean,"last_auth_failure_at"?: string | null,"last_error"?: string | null,"last_ok_at"?: string | null,"status"?: string,"steps"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"whatsapp_message_events": {
                  Row: {
                    "at": string,"id": number,"message_id": string,"source": string,"state": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"id"?: never,"message_id": string,"source": string,"state": string
                  }
                  Update: {
                    "at"?: string,"id"?: never,"message_id"?: string,"source"?: string,"state"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_message_events_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "whatsapp_messages"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_messages": {
                  Row: {
                    "attachment_id": string | null,"attempts": number,"body": string | null,"campaign_id": string | null,"category": string | null,"company_id": string | null,"conversation_id": string | null,"created_at": string,"created_by": string | null,"delivered_at": string | null,"direction": string,"failure_code": string | null,"failure_detail": string | null,"id": string,"idempotency_key": string | null,"kind": string,"next_attempt_at": string | null,"phone": string,"provider_id": string | null,"read_at": string | null,"recipient_id": string | null,"sent_at": string | null,"state": string,"submitted_at": string | null,"template_id": string | null,"template_payload": Json | null,"wa_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_id"?: string | null,"attempts"?: number,"body"?: string | null,"campaign_id"?: string | null,"category"?: string | null,"company_id"?: string | null,"conversation_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivered_at"?: string | null,"direction": string,"failure_code"?: string | null,"failure_detail"?: string | null,"id"?: string,"idempotency_key"?: string | null,"kind": string,"next_attempt_at"?: string | null,"phone": string,"provider_id"?: string | null,"read_at"?: string | null,"recipient_id"?: string | null,"sent_at"?: string | null,"state": string,"submitted_at"?: string | null,"template_id"?: string | null,"template_payload"?: Json | null,"wa_id"?: string | null
                  }
                  Update: {
                    "attachment_id"?: string | null,"attempts"?: number,"body"?: string | null,"campaign_id"?: string | null,"category"?: string | null,"company_id"?: string | null,"conversation_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivered_at"?: string | null,"direction"?: string,"failure_code"?: string | null,"failure_detail"?: string | null,"id"?: string,"idempotency_key"?: string | null,"kind"?: string,"next_attempt_at"?: string | null,"phone"?: string,"provider_id"?: string | null,"read_at"?: string | null,"recipient_id"?: string | null,"sent_at"?: string | null,"state"?: string,"submitted_at"?: string | null,"template_id"?: string | null,"template_payload"?: Json | null,"wa_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_messages_attachment_id_fkey"
      columns: ["attachment_id"]
isOneToOne: false
      referencedRelation: "whatsapp_attachments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_messages_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "whatsapp_campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_messages_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "whatsapp_conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_messages_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_messages_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "whatsapp_campaign_recipients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_messages_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "whatsapp_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_notes": {
                  Row: {
                    "author": string | null,"body": string,"conversation_id": string,"created_at": string,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "author"?: string | null,"body": string,"conversation_id": string,"created_at"?: string,"id"?: never
                  }
                  Update: {
                    "author"?: string | null,"body"?: string,"conversation_id"?: string,"created_at"?: string,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_notes_author_fkey"
      columns: ["author"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "whatsapp_notes_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "whatsapp_conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_pending_status": {
                  Row: {
                    "at": string,"code": string | null,"detail": string | null,"state": string,"wa_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"code"?: string | null,"detail"?: string | null,"state": string,"wa_id": string
                  }
                  Update: {
                    "at"?: string,"code"?: string | null,"detail"?: string | null,"state"?: string,"wa_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"whatsapp_templates": {
                  Row: {
                    "body": string | null,"buttons": NonNullable<Json>,"category": string | null,"footer": string | null,"header": string | null,"header_type": string,"id": string,"language": string,"name": string,"provider_id": string | null,"status": string,"synced_at": string | null,"updated_at": string,"updated_by": string | null,"var_map": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"buttons"?: NonNullable<Json>,"category"?: string | null,"footer"?: string | null,"header"?: string | null,"header_type"?: string,"id"?: string,"language": string,"name": string,"provider_id"?: string | null,"status"?: string,"synced_at"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"var_map"?: NonNullable<Json>
                  }
                  Update: {
                    "body"?: string | null,"buttons"?: NonNullable<Json>,"category"?: string | null,"footer"?: string | null,"header"?: string | null,"header_type"?: string,"id"?: string,"language"?: string,"name"?: string,"provider_id"?: string | null,"status"?: string,"synced_at"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"var_map"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "whatsapp_templates_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"whatsapp_webhook_events": {
                  Row: {
                    "event_id": string,"outcome": string,"received_at": string,"type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "event_id": string,"outcome"?: string,"received_at"?: string,"type"?: string | null
                  }
                  Update: {
                    "event_id"?: string,"outcome"?: string,"received_at"?: string,"type"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "public_directory": {
                  Row: {
                    "class": Database["public"]['Enums']["member_class"] | null,"company": string | null,"member_no": string | null,"sector": string | null,"status": Database["public"]['Enums']["member_status"] | null,"valid_to": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"public_settings": {
                  Row: {
                    "key": string | null,"value": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                           "key"?: string | null,"value"?: Json | null
                         }
                        Update: {
                           "key"?: string | null,"value"?: Json | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "app_stage": "draft"|"submitted"|"review"|"returned"|"proposer"|"committee"|"payment"|"temp"|"permanent"|"rejected"|"withdrawn","batch_status": "Draft"|"Sent to printer"|"Printing"|"Received"|"Closed","biz_type": "prop"|"aop"|"pvt"|"mnc"|"public"|"llp","company_role": "Owner"|"Manager"|"Services"|"Accounts"|"Viewer","deletion_status": "Requested"|"Approved"|"Completed"|"Rejected","doc_kind": "temp_certificate"|"certificate"|"letter"|"voucher"|"form"|"receipt","doc_status": "pending"|"ok"|"rejected","endorse_role": "proposer"|"seconder","endorse_status": "Pending"|"Approved"|"Declined"|"Expired"|"Withdrawn","invite_status": "Invited"|"Active"|"Expired"|"Revoked","member_class": "Corporate"|"Associate","member_status": "Temporary"|"Permanent"|"Expired"|"Suspended"|"Revoked"|"TempExpired","print_status": "none"|"queued"|"sent"|"printing"|"received"|"converted","qr_status": "Valid"|"Temporary"|"Superseded"|"Expired"|"Revoked","receipt_status": "Submitted"|"Accepted"|"Rejected","svc_status": "Submitted"|"In review"|"Returned"|"Ready to sign"|"Issued"|"Rejected"|"Cancelled","temp_status": "active"|"expired"|"converted"|"revoked","ticket_status": "Open"|"In progress"|"Resolved"|"Closed","voucher_status": "Unpaid"|"Receipt uploaded"|"Paid"|"Rejected"|"Cancelled"|"Expired"|"Refund due"|"Refunded"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "api": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_stage": ["draft", "submitted", "review", "returned", "proposer", "committee", "payment", "temp", "permanent", "rejected", "withdrawn"],"batch_status": ["Draft", "Sent to printer", "Printing", "Received", "Closed"],"biz_type": ["prop", "aop", "pvt", "mnc", "public", "llp"],"company_role": ["Owner", "Manager", "Services", "Accounts", "Viewer"],"deletion_status": ["Requested", "Approved", "Completed", "Rejected"],"doc_kind": ["temp_certificate", "certificate", "letter", "voucher", "form", "receipt"],"doc_status": ["pending", "ok", "rejected"],"endorse_role": ["proposer", "seconder"],"endorse_status": ["Pending", "Approved", "Declined", "Expired", "Withdrawn"],"invite_status": ["Invited", "Active", "Expired", "Revoked"],"member_class": ["Corporate", "Associate"],"member_status": ["Temporary", "Permanent", "Expired", "Suspended", "Revoked", "TempExpired"],"print_status": ["none", "queued", "sent", "printing", "received", "converted"],"qr_status": ["Valid", "Temporary", "Superseded", "Expired", "Revoked"],"receipt_status": ["Submitted", "Accepted", "Rejected"],"svc_status": ["Submitted", "In review", "Returned", "Ready to sign", "Issued", "Rejected", "Cancelled"],"temp_status": ["active", "expired", "converted", "revoked"],"ticket_status": ["Open", "In progress", "Resolved", "Closed"],"voucher_status": ["Unpaid", "Receipt uploaded", "Paid", "Rejected", "Cancelled", "Expired", "Refund due", "Refunded"]
          }
        }
} as const
