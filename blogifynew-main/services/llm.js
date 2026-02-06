const { chat } = require('./litellm');

// Prompt templates as simple strings
const DRAFT_PROMPT = `You are an expert blog writer and content strategist with 10+ years of experience creating viral, engaging content. Your task is to write a comprehensive, SEO-optimized blog post about the following topic.

Topic: {topic}

CONTENT REQUIREMENTS:
1. **Title**: Create a compelling, click-worthy headline (under 60 characters) that includes power words and addresses reader pain points
2. **Introduction**: Hook the reader in the first 100 words with a relatable problem, surprising statistic, or compelling question
3. **Main Content**: Structure with 4-6 H2 subheadings, each covering a key aspect of the topic
4. **Body**: Include practical examples, data/statistics, expert quotes, and actionable takeaways
5. **Conclusion**: End with a strong call-to-action and key takeaways
6. **Word Count**: 800-1200 words total

FORMATTING REQUIREMENTS:
- Use proper markdown formatting
- Include bullet points and numbered lists where appropriate
- Add emphasis with **bold** and *italics* strategically
- Include relevant internal/external links (use [text](url) format)

SEO OPTIMIZATION:
- Naturally incorporate long-tail keywords
- Use conversational tone that ranks well
- Include questions readers might search for
- Optimize for featured snippets

Write as if you're speaking directly to the reader, using "you" and creating emotional connection. Make the content valuable, shareable, and authoritative.`;

const SEO_PROMPT = `You are a senior SEO strategist with expertise in technical SEO, content optimization, and search engine algorithms. Analyze this blog post and create comprehensive SEO metadata.

Title: {title}
Content: {content}

DELIVERABLES:
1. **SEO Title**: Optimized headline (45-55 characters) with primary keyword, compelling, and click-worthy
2. **URL Slug**: Clean, descriptive URL (50-60 characters) using hyphens, lowercase, no special characters
3. **Meta Description**: Compelling 150-155 character summary that includes primary keyword and call-to-action
4. **Focus Keyword**: Primary target keyword with high search volume potential
5. **Secondary Keywords**: 4-6 related keywords for internal linking and content expansion
6. **Search Intent**: Specify if this targets informational, commercial, transactional, or navigational intent
7. **Content Score**: Rate content quality (1-10) and suggest improvements

FORMAT: Return as JSON with fields: title, slug, description, focusKeyword, secondaryKeywords (array), searchIntent, contentScore, suggestions (array)

Ensure all keywords have realistic search volume and the title/description will perform well in SERPs.`;

const CALENDAR_PROMPT = `You are a content marketing strategist specializing in blog growth and audience engagement. Create a strategic 4-week content calendar based on the user's existing blog posts and current trends.

User's Recent Content: {topic}

CONTENT CALENDAR REQUIREMENTS:
Generate 12 content ideas (3 per week for 4 weeks) that will:
- Build on the user's existing content themes
- Address trending topics in their niche
- Include a mix of different content types (how-to, listicles, case studies, opinion pieces)
- Have varying levels of complexity and time investment

For each content idea include:
1. **Title**: SEO-optimized, compelling headline
2. **Content Type**: How-to guide, list article, case study, opinion, etc.
3. **Target Keywords**: Primary + 2 secondary keywords
4. **Traffic Potential**: High/Medium/Low based on keyword difficulty and search volume
5. **Publishing Day**: Strategic day of week for optimal engagement
6. **Word Count Estimate**: Realistic length for the content type
7. **Content Angle**: Unique hook or perspective that sets it apart
8. **Internal Linking Opportunities**: How this connects to existing content

FORMAT: Return as JSON array with objects containing: title, type, primaryKeyword, secondaryKeywords (array), trafficPotential, publishDay, wordCount, angle, linkingOpportunities

Ensure the calendar creates a logical content journey and includes calls-to-action for email capture and social sharing.`;

/**
 * Format a prompt template with variables
 * @param {string} template - Template string with {variables}
 * @param {Object} variables - Key-value pairs to replace in template
 * @returns {string} Formatted prompt
 */

function formatPrompt(template, variables) {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}

/**
 * Generate text using LiteLLM
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} variables - Variables to interpolate into the prompt
 * @param {string} model - Model to use (default: groq/llama-3.1-8b)
 * @returns {Promise<string>} Generated text
 */
async function generateText(prompt, variables = {}, model = 'llama-3.1-8b-instant') {
  try {
    // Format the prompt with variables
    const formattedPrompt = formatPrompt(prompt, variables);
    
    // Create messages array for chat completion
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: formattedPrompt }
    ];
    
    // Call LiteLLM
    const response = await chat(messages, model);
    return response;
  } catch (error) {
    console.error('Error in generateText:', error);
    throw new Error('Failed to generate text: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Stream text response (for future implementation if needed)
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} variables - Variables to interpolate into the prompt
 * @param {string} model - Model to use
 * @returns {AsyncGenerator<string>} Stream of text chunks
 */
async function* streamText(prompt, variables = {}, model = 'llama-3.1-8b-instant') {
  try {
    const formattedPrompt = formatPrompt(prompt, variables);
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      { role: 'user', content: formattedPrompt }
    ];
    
    // For now, just return the full response as a single chunk
    // In a real implementation, this would stream the response
    const response = await chat(messages, model);
    yield response;
  } catch (error) {
    console.error('Error in streamText:', error);
    throw new Error('Failed to stream text: ' + (error.message || 'Unknown error'));
  }
}

module.exports = {
  // Prompt templates
  DRAFT_PROMPT,
  SEO_PROMPT,

  CALENDAR_PROMPT,
  
  // Functions
  generateText,
  streamText,
  
  // Aliases for backward compatibility
  draftPromptTemplate: DRAFT_PROMPT,
  seoPromptTemplate: SEO_PROMPT,

  
  // Helper function for external use if needed
  formatPrompt
};
