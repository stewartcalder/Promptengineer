export class TokenCounter {
  
  /**
   * Estimate token count for text content
   * Using a simple approximation: ~1 token per 4 characters for English text
   * This is a rough estimate - in production, you'd use a proper tokenizer like tiktoken
   */
  static estimateTokens(content: any): number {
    const text = this.extractTextFromContent(content);
    
    // Simple token estimation: average of ~4 characters per token
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Use a more sophisticated estimation considering both chars and words
    const charBasedEstimate = Math.ceil(charCount / 4);
    const wordBasedEstimate = Math.ceil(wordCount * 1.3); // ~1.3 tokens per word on average
    
    // Return the average of both methods for better accuracy
    return Math.round((charBasedEstimate + wordBasedEstimate) / 2);
  }
  
  /**
   * Extract text content from processed JSON for token counting
   */
  private static extractTextFromContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    
    if (Array.isArray(content)) {
      return content.map(item => this.extractTextFromContent(item)).join(' ');
    }
    
    if (typeof content === 'object' && content !== null) {
      const textParts: string[] = [];
      
      for (const [key, value] of Object.entries(content)) {
        // Include key names in token count as they're part of the JSON structure
        textParts.push(key);
        textParts.push(this.extractTextFromContent(value));
      }
      
      return textParts.join(' ');
    }
    
    return String(content);
  }
  
  /**
   * Estimate cost based on token count
   * Using approximate pricing for GPT-4 level models
   */
  static estimateCost(tokenCount: number): number {
    // Approximate cost per 1K tokens ($0.03 for input tokens)
    const costPer1KTokens = 0.03;
    return (tokenCount / 1000) * costPer1KTokens;
  }
  
  /**
   * Calculate what percentage of a typical context window this represents
   */
  static calculateContextPercentage(tokenCount: number, contextWindow: number = 128000): number {
    return (tokenCount / contextWindow) * 100;
  }
}
