// Quick Links Types

export interface QuickLink {
  id: number
  name: string
  icon_url: string | null
  redirect_url: string
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QuickLinkImage {
  id: number
  original_filename: string
  file_size: number
  mime_type: string
  download_url: string
  thumbnail_url: string
  uploaded_at: string
}

export interface PaginatedQuickLinksResponse {
  status: string
  message: string
  data: {
    count: number
    total_pages: number
    current_page: number
    page_size: number
    next: string | null
    previous: string | null
    results: QuickLink[]
  }
}

export interface QuickLinkDetailResponse {
  status: string
  message: string
  data: QuickLink
}

export interface CreateQuickLinkRequest {
  name: string
  redirect_url: string
  position?: number
  is_active?: boolean
}

export interface UpdateQuickLinkRequest {
  name?: string
  redirect_url?: string
  position?: number
  is_active?: boolean
}

export interface QuickLinksListParams {
  page?: number
  page_size?: number
  is_active?: boolean
}

export interface QuickLinkIconUploadResponse {
  status: string
  message: string
  data: {
    icon_url: string
  }
}

export interface UpdatePositionsRequest {
  positions: Array<{
    id: number
    position: number
  }>
}
