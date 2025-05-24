export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay = 500
): Promise<T> {
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) throw error;
      
      const delay = baseDelay * 2 ** attempt;
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
} 