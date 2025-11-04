// Updated types to match backend API schema

// Frontend FileItem interface (converted from backend)
export interface FileItem {
  id: string // UUID from backend
  name: string
  size: number // size_bytes from backend
  type: string // derived from mime_type
  modified: Date // converted from uploaded_at
  owner: string
  shared: boolean
  parentId?: string | null // folder UUID from backend
  tags?: string[] // For smart categorization (frontend feature)
  version?: number // For version control (frontend feature)
  encrypted?: boolean // For security features (frontend feature)
  thumbnail?: string // For preview functionality (frontend feature)
  sharedWith: ShareInfo[] // Frontend sharing info
  // Backend fields
  mime_type: string
  extension: string
  size_human: string
  folder_name: string | null
  folder_path: string | null
  is_favorite: boolean
  uploaded_at: string
  created_at: string
  updated_at: string
}

// Frontend FolderItem interface (converted from backend)
export interface FolderItem {
  id: string // UUID from backend
  name: string
  parentId: string | null // parent UUID from backend
  full_path: string
  is_shared: boolean
  file_count: number
  subfolder_count: number
  created_at: string
  updated_at: string
  modified: Date // converted from updated_at
  owner: string
  shared: boolean
}

export interface ShareInfo {
  userId: number
  permission: 'view' | 'download' | 'edit' | 'fullAccess'
  sharedAt?: Date
  expiresAt?: Date
}

export interface UploadingFile {
  id: number | string
  name: string
  size: number
  progress: number
  file: File
  parentId?: string | null // UUID for backend compatibility
  error?: string
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role?: string
  department?: string
  first_name?: string
  last_name?: string
  full_name?: string
}

export interface FilterTab {
  key: string
  label: string
  icon: string
  count?: number
}

// New interfaces for creative features
export interface FileVersion {
  id: number
  fileId: number
  version: number
  name: string
  size: number
  modified: Date
  modifiedBy: string
  changes: string
}

export interface FileComment {
  id: number
  fileId: number
  userId: number
  content: string
  timestamp: Date
  resolved: boolean
  parentId?: number // For reply comments
}

export interface AIAnalysis {
  fileId: number
  contentType: string
  summary: string
  keywords: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  securityLevel: 'public' | 'internal' | 'confidential' | 'classified'
  recommendations: string[]
}

export interface DuplicateGroup {
  original: FileItem
  duplicates: FileItem[]
  similarity: number
}

export interface AccessLog {
  id: number
  fileId: number
  userId: number
  action: 'view' | 'download' | 'edit' | 'share' | 'delete'
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface SecurityAlert {
  id: number
  type: 'unauthorized_access' | 'suspicious_download' | 'data_breach' | 'malware_detected'
  severity: 'low' | 'medium' | 'high' | 'critical'
  fileId?: number
  userId?: number
  timestamp: Date
  resolved: boolean
  description: string
}
