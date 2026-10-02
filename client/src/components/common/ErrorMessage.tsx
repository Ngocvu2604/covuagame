interface ErrorMessageProps {
  message: string | null
}

/** Hiển thị thông báo lỗi dạng text (ẩn khi message = null) */
export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-danger">
      {message}
    </p>
  )
}
