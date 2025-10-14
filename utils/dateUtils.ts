// Format date to Vietnamese timezone (GMT+7)
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  const parsedDate = new Date(date);
  
  // Check if date is invalid
  if (isNaN(parsedDate.getTime())) {
    return 'N/A';
  }
  
  return parsedDate.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  const parsedDate = new Date(date);
  
  // Check if date is invalid
  if (isNaN(parsedDate.getTime())) {
    return 'N/A';
  }
  
  return parsedDate.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  
  const parsedDate = new Date(date);
  
  // Check if date is invalid
  if (isNaN(parsedDate.getTime())) {
    return 'N/A';
  }
  
  return parsedDate.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

