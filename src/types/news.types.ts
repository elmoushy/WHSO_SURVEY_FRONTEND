// News and Newsletter Types

export type NewsType = 'SLIDER' | 'NORMAL' | 'ACHIEVEMENT'

export interface NewsImage {
  id: number
  original_filename: string
  file_size: number
  mime_type: string
  is_main: boolean
  display_order: number
  uploaded_at: string
  download_url: string
  thumbnail_url: string
}

export interface Newsletter {
  id: number
  news_type: NewsType
  title: string
  details: string
  author: number
  author_name: string
  position: number
  created_at: string
  updated_at: string
  images: NewsImage[]
  main_image: NewsImage | null
}

export interface PaginatedNewsResponse {
  status: string
  message: string
  data: {
    count: number
    total_pages: number
    current_page: number
    page_size: number
    next: string | null
    previous: string | null
    results: Newsletter[]
  }
}

export interface NewsDetailResponse {
  status: string
  message: string
  data: Newsletter
}

export interface CreateNewsRequest {
  news_type: NewsType
  title: string
  details: string
  position?: number
}

export interface UpdateNewsRequest {
  title?: string
  details?: string
  position?: number
}

export interface ImageUploadResponse {
  status: string
  message: string
  data: NewsImage
}

export interface NewsListParams {
  page?: number
  page_size?: number
}
