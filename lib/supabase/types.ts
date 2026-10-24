
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
"app_create":
{ Args: { "p_company": string }; Returns: {
              "id": string,"token": string
            }[]
                           },
"company_user_update":
{ Args: { "p_active": boolean,"p_company": string,"p_role": Database["public"]['Enums']["company_role"],"p_user": string }; Returns: undefined
                           },
"doc_review":
{ Args: { "p_document": string,"p_ok": boolean,"p_reason"?: string }; Returns: undefined
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
"my_access":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"rate_limit_take":
{ Args: { "p_bucket": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"settings_for_server":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"staff_update":
{ Args: { "p_active": boolean,"p_designation": string,"p_user": string }; Returns: undefined
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
                    "application_id": string,"cnic": string | null,"extra_card": boolean,"id": string,"mobile": string | null,"name": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"cnic"?: string | null,"extra_card"?: boolean,"id"?: string,"mobile"?: string | null,"name": string,"position": number
                  }
                  Update: {
                    "application_id"?: string,"cnic"?: string | null,"extra_card"?: boolean,"id"?: string,"mobile"?: string | null,"name"?: string,"position"?: number
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
                    "address_matches_ntn": boolean | null,"class": Database["public"]['Enums']["member_class"] | null,"company_id": string,"created_at": string,"created_by": string,"decided_at": string | null,"decl1": boolean,"decl2": boolean,"field_confidence": NonNullable<Json>,"form": NonNullable<Json>,"id": string,"jurisdiction_ok": boolean | null,"kind": string,"member_id": string | null,"photo_path": string | null,"reject_note": string | null,"return_note": string | null,"review": NonNullable<Json>,"sign_path": string | null,"stage": Database["public"]['Enums']["app_stage"],"stamp_path": string | null,"submitted_at": string | null,"token": string,"updated_at": string,"women": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "address_matches_ntn"?: boolean | null,"class"?: Database["public"]['Enums']["member_class"] | null,"company_id": string,"created_at"?: string,"created_by": string,"decided_at"?: string | null,"decl1"?: boolean,"decl2"?: boolean,"field_confidence"?: NonNullable<Json>,"form"?: NonNullable<Json>,"id"?: string,"jurisdiction_ok"?: boolean | null,"kind"?: string,"member_id"?: string | null,"photo_path"?: string | null,"reject_note"?: string | null,"return_note"?: string | null,"review"?: NonNullable<Json>,"sign_path"?: string | null,"stage"?: Database["public"]['Enums']["app_stage"],"stamp_path"?: string | null,"submitted_at"?: string | null,"token"?: string,"updated_at"?: string,"women"?: boolean
                  }
                  Update: {
                    "address_matches_ntn"?: boolean | null,"class"?: Database["public"]['Enums']["member_class"] | null,"company_id"?: string,"created_at"?: string,"created_by"?: string,"decided_at"?: string | null,"decl1"?: boolean,"decl2"?: boolean,"field_confidence"?: NonNullable<Json>,"form"?: NonNullable<Json>,"id"?: string,"jurisdiction_ok"?: boolean | null,"kind"?: string,"member_id"?: string | null,"photo_path"?: string | null,"reject_note"?: string | null,"return_note"?: string | null,"review"?: NonNullable<Json>,"sign_path"?: string | null,"stage"?: Database["public"]['Enums']["app_stage"],"stamp_path"?: string | null,"submitted_at"?: string | null,"token"?: string,"updated_at"?: string,"women"?: boolean
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
                    "address": string | null,"biz_type": Database["public"]['Enums']["biz_type"],"created_at": string,"email": string | null,"established": string | null,"fax": string | null,"gst": string | null,"id": string,"manufacturing": boolean,"name": string,"nature_items": (string)[] | null,"nature_sector": string | null,"ntn": string | null,"particulars": string | null,"sales_tax": boolean,"sector": string | null,"tel": string | null,"turnover_50m": boolean,"web": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"biz_type": Database["public"]['Enums']["biz_type"],"created_at"?: string,"email"?: string | null,"established"?: string | null,"fax"?: string | null,"gst"?: string | null,"id"?: string,"manufacturing"?: boolean,"name": string,"nature_items"?: (string)[] | null,"nature_sector"?: string | null,"ntn"?: string | null,"particulars"?: string | null,"sales_tax"?: boolean,"sector"?: string | null,"tel"?: string | null,"turnover_50m"?: boolean,"web"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"biz_type"?: Database["public"]['Enums']["biz_type"],"created_at"?: string,"email"?: string | null,"established"?: string | null,"fax"?: string | null,"gst"?: string | null,"id"?: string,"manufacturing"?: boolean,"name"?: string,"nature_items"?: (string)[] | null,"nature_sector"?: string | null,"ntn"?: string | null,"particulars"?: string | null,"sales_tax"?: boolean,"sector"?: string | null,"tel"?: string | null,"turnover_50m"?: boolean,"web"?: string | null
                  }
                  Relationships: [
                    
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
                    "at": string,"id": number,"provider_id": string | null,"status": string | null,"template_key": string | null,"to_email": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"id"?: never,"provider_id"?: string | null,"status"?: string | null,"template_key"?: string | null,"to_email"?: string | null
                  }
                  Update: {
                    "at"?: string,"id"?: never,"provider_id"?: string | null,"status"?: string | null,"template_key"?: string | null,"to_email"?: string | null
                  }
                  Relationships: [
                    
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
                },"imports": {
                  Row: {
                    "at": string,"by_user": string | null,"file_path": string | null,"id": string,"report": Json | null,"rows_error": number | null,"rows_ok": number | null,"rows_total": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "at"?: string,"by_user"?: string | null,"file_path"?: string | null,"id"?: string,"report"?: Json | null,"rows_error"?: number | null,"rows_ok"?: number | null,"rows_total"?: number | null
                  }
                  Update: {
                    "at"?: string,"by_user"?: string | null,"file_path"?: string | null,"id"?: string,"report"?: Json | null,"rows_error"?: number | null,"rows_ok"?: number | null,"rows_total"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "imports_by_user_fkey"
      columns: ["by_user"]
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
                    "committee": string,"created_at": string,"held_on": string | null,"id": string,"minutes_path": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "committee": string,"created_at"?: string,"held_on"?: string | null,"id": string,"minutes_path"?: string | null,"status"?: string
                  }
                  Update: {
                    "committee"?: string,"created_at"?: string,"held_on"?: string | null,"id"?: string,"minutes_path"?: string | null,"status"?: string
                  }
                  Relationships: [
                    
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
                    "class": Database["public"]['Enums']["member_class"],"company_id": string,"created_at": string,"id": string,"imported": boolean,"member_no": string,"public_listing": boolean,"rep_name": string,"serial": string | null,"since": string,"status": Database["public"]['Enums']["member_status"],"suspended_reason": string | null,"valid_to": string,"women": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "class": Database["public"]['Enums']["member_class"],"company_id": string,"created_at"?: string,"id"?: string,"imported"?: boolean,"member_no": string,"public_listing"?: boolean,"rep_name": string,"serial"?: string | null,"since": string,"status": Database["public"]['Enums']["member_status"],"suspended_reason"?: string | null,"valid_to": string,"women"?: boolean
                  }
                  Update: {
                    "class"?: Database["public"]['Enums']["member_class"],"company_id"?: string,"created_at"?: string,"id"?: string,"imported"?: boolean,"member_no"?: string,"public_listing"?: boolean,"rep_name"?: string,"serial"?: string | null,"since"?: string,"status"?: Database["public"]['Enums']["member_status"],"suspended_reason"?: string | null,"valid_to"?: string,"women"?: boolean
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
                },"notifications": {
                  Row: {
                    "area": string | null,"body": string,"channel": string,"company_id": string | null,"created_at": string,"id": string,"link": string | null,"read_at": string | null,"title": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "area"?: string | null,"body": string,"channel"?: string,"company_id"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"title": string,"user_id"?: string | null
                  }
                  Update: {
                    "area"?: string | null,"body"?: string,"channel"?: string,"company_id"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"read_at"?: string | null,"title"?: string,"user_id"?: string | null
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
                    "body": string,"company_id": string | null,"created_at": string,"created_by": string | null,"id": string,"kind": string,"sector": string | null,"status": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"kind": string,"sector"?: string | null,"status"?: string,"title": string
                  }
                  Update: {
                    "body"?: string,"company_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"kind"?: string,"sector"?: string | null,"status"?: string,"title"?: string
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
    }
                  ]
                },"opportunity_replies": {
                  Row: {
                    "body": string,"company_id": string,"created_at": string,"created_by": string | null,"id": string,"opportunity_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"company_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"opportunity_id": string
                  }
                  Update: {
                    "body"?: string,"company_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"opportunity_id"?: string
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
                },"payment_receipts": {
                  Row: {
                    "bank_ref": string | null,"company_id": string,"decided_at": string | null,"decided_by": string | null,"id": string,"path": string,"reason": string | null,"sha256": string | null,"status": Database["public"]['Enums']["receipt_status"],"uploaded_at": string,"uploaded_by": string | null,"voucher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bank_ref"?: string | null,"company_id": string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"path": string,"reason"?: string | null,"sha256"?: string | null,"status"?: Database["public"]['Enums']["receipt_status"],"uploaded_at"?: string,"uploaded_by"?: string | null,"voucher_id": string
                  }
                  Update: {
                    "bank_ref"?: string | null,"company_id"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"path"?: string,"reason"?: string | null,"sha256"?: string | null,"status"?: Database["public"]['Enums']["receipt_status"],"uploaded_at"?: string,"uploaded_by"?: string | null,"voucher_id"?: string
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
                    "assigned_to": string | null,"company_id": string,"created_by": string | null,"data": NonNullable<Json>,"id": string,"issued_doc": string | null,"return_note": string | null,"service_key": string,"sla_due_at": string,"status": Database["public"]['Enums']["svc_status"],"submitted_at": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"company_id": string,"created_by"?: string | null,"data"?: NonNullable<Json>,"id"?: string,"issued_doc"?: string | null,"return_note"?: string | null,"service_key": string,"sla_due_at": string,"status"?: Database["public"]['Enums']["svc_status"],"submitted_at"?: string,"token"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"company_id"?: string,"created_by"?: string | null,"data"?: NonNullable<Json>,"id"?: string,"issued_doc"?: string | null,"return_note"?: string | null,"service_key"?: string,"sla_due_at"?: string,"status"?: Database["public"]['Enums']["svc_status"],"submitted_at"?: string,"token"?: string
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
            "app_stage": "draft"|"submitted"|"review"|"returned"|"proposer"|"committee"|"payment"|"temp"|"permanent"|"rejected"|"withdrawn","batch_status": "Draft"|"Sent to printer"|"Printing"|"Received"|"Closed","biz_type": "prop"|"aop"|"pvt"|"mnc"|"public","company_role": "Owner"|"Manager"|"Services"|"Accounts"|"Viewer","deletion_status": "Requested"|"Approved"|"Completed"|"Rejected","doc_kind": "temp_certificate"|"certificate"|"letter"|"voucher"|"form"|"receipt","doc_status": "pending"|"ok"|"rejected","endorse_role": "proposer"|"seconder","endorse_status": "Pending"|"Approved"|"Declined"|"Expired"|"Withdrawn","invite_status": "Invited"|"Active"|"Expired"|"Revoked","member_class": "Corporate"|"Associate","member_status": "Temporary"|"Permanent"|"Expired"|"Suspended"|"Revoked"|"TempExpired","print_status": "none"|"queued"|"sent"|"printing"|"received"|"converted","qr_status": "Valid"|"Temporary"|"Superseded"|"Expired"|"Revoked","receipt_status": "Submitted"|"Accepted"|"Rejected","svc_status": "Submitted"|"In review"|"Returned"|"Ready to sign"|"Issued"|"Rejected"|"Cancelled","temp_status": "active"|"expired"|"converted"|"revoked","ticket_status": "Open"|"In progress"|"Resolved"|"Closed","voucher_status": "Unpaid"|"Receipt uploaded"|"Paid"|"Rejected"|"Cancelled"|"Expired"|"Refund due"|"Refunded"
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
            "app_stage": ["draft", "submitted", "review", "returned", "proposer", "committee", "payment", "temp", "permanent", "rejected", "withdrawn"],"batch_status": ["Draft", "Sent to printer", "Printing", "Received", "Closed"],"biz_type": ["prop", "aop", "pvt", "mnc", "public"],"company_role": ["Owner", "Manager", "Services", "Accounts", "Viewer"],"deletion_status": ["Requested", "Approved", "Completed", "Rejected"],"doc_kind": ["temp_certificate", "certificate", "letter", "voucher", "form", "receipt"],"doc_status": ["pending", "ok", "rejected"],"endorse_role": ["proposer", "seconder"],"endorse_status": ["Pending", "Approved", "Declined", "Expired", "Withdrawn"],"invite_status": ["Invited", "Active", "Expired", "Revoked"],"member_class": ["Corporate", "Associate"],"member_status": ["Temporary", "Permanent", "Expired", "Suspended", "Revoked", "TempExpired"],"print_status": ["none", "queued", "sent", "printing", "received", "converted"],"qr_status": ["Valid", "Temporary", "Superseded", "Expired", "Revoked"],"receipt_status": ["Submitted", "Accepted", "Rejected"],"svc_status": ["Submitted", "In review", "Returned", "Ready to sign", "Issued", "Rejected", "Cancelled"],"temp_status": ["active", "expired", "converted", "revoked"],"ticket_status": ["Open", "In progress", "Resolved", "Closed"],"voucher_status": ["Unpaid", "Receipt uploaded", "Paid", "Rejected", "Cancelled", "Expired", "Refund due", "Refunded"]
          }
        }
} as const
