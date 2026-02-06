// services/agent.js
// AI-powered workflow functions for blog generation
const { 
  DRAFT_PROMPT, 
  SEO_PROMPT, 

  CALENDAR_PROMPT, 
  generateText 
} = require('./llm');

// Helper function to safely parse JSON responses
function safeJsonParse(jsonString) {
  try {
    // Try to parse as JSON first
    return JSON.parse(jsonString);
  } catch (e) {
    try {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = jsonString.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
    } catch (innerError) {
      console.error('Failed to parse JSON:', innerError);
      return null;
    }
  }
  return null;
}

// Draft workflow - generates blog content from topic
async function runDraftWorkflow(topic) {
  try {
    console.log(`Starting draft workflow for topic: ${topic}`);
    
    // Generate the full blog post in one go
    const markdown = await generateText(DRAFT_PROMPT, { topic });
    console.log('Generated markdown successfully');
    
    // Extract the first heading as the title
    const titleMatch = markdown.match(/^#\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;
    
    return {
      topic,
      title,
      markdown,
      error: null
    };
  } catch (error) {
    console.error('Draft workflow error:', error);
    return {
      topic,
      title: '',
      markdown: '',
      error: error.message || 'Failed to generate draft'
    };
  }
}

// SEO workflow - generates SEO metadata from content
async function runSeoWorkflow(markdown, title = '') {
  try {
    console.log('Starting SEO workflow');
    
    const content = markdown.substring(0, 2000); // Limit content size
    
    // Generate SEO metadata
    const metaText = await generateText(SEO_PROMPT, { 
      title: title || 'Blog Post',
      content 
    });
    
    // Try to parse as JSON, fallback to extracting from markdown
    let meta = safeJsonParse(metaText);
    
    // Fallback if JSON parsing fails
    if (!meta) {
      console.warn('Failed to parse SEO metadata as JSON, using fallback');
      const firstLine = markdown.split('\n')[0].replace(/^#\s*/, '');
      meta = {
        title: firstLine.substring(0, 60),
        slug: firstLine
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50),
        description: markdown
          .replace(/^#.*$/gm, '')
          .replace(/\s+/g, ' ')
          .substring(0, 160)
          .trim(),
        focusKeyword: '',
        secondaryKeywords: [],
        searchIntent: 'informational',
        contentScore: 7,
        suggestions: ['Add more specific keywords', 'Include data/statistics']
      };
    }
    
    // Ensure required fields exist with defaults
    meta.focusKeyword = meta.focusKeyword || '';
    meta.secondaryKeywords = meta.secondaryKeywords || [];
    meta.searchIntent = meta.searchIntent || 'informational';
    meta.contentScore = meta.contentScore || 7;
    meta.suggestions = meta.suggestions || [];
    
    // For backward compatibility, create keywords array from focus and secondary
    meta.keywords = [meta.focusKeyword, ...meta.secondaryKeywords].filter(k => k);
    
    console.log('Generated SEO metadata successfully');
    
    return {
      meta,
      keywords: meta.keywords,
      error: null
    };
  } catch (error) {
    console.error('SEO workflow error:', error);
    return {
      meta: {},
      keywords: [],
      error: error.message || 'Failed to generate SEO metadata'
    };
  }
}

// Calendar workflow - generates content suggestions
async function runCalendarWorkflow(userId, posts) {
  try {
    console.log('Starting calendar workflow');
    
    // Prepare recent posts text
    const postsText = posts
      .slice(0, 5) // Use more posts for better context
      .map(post => `- ${post.title || 'Untitled'}: ${(post.content || post.body || '').substring(0, 150)}...`)
      .join('\n') || 'No recent posts available - general blogging topics';
    
    // Generate calendar using the improved CALENDAR_PROMPT template
    const calendarText = await generateText(CALENDAR_PROMPT, { 
      topic: postsText
    });
    
    // Try to parse the response as JSON, fallback to default topics
    let calendar = safeJsonParse(calendarText) || [];
    
    // If parsing failed or no calendar returned, use fallback
    if (!Array.isArray(calendar) || calendar.length === 0) {
      console.warn('Using fallback calendar topics');
      const baseDate = new Date();
      calendar = [
        {
          title: "The Ultimate Guide to Getting Started",
          type: "how-to guide",
          primaryKeyword: "getting started guide",
          secondaryKeywords: ["beginners tutorial", "step by step"],
          trafficPotential: "High",
          publishDay: "Monday",
          wordCount: 1200,
          angle: "Complete beginner's roadmap with common mistakes to avoid",
          linkingOpportunities: "Link to related beginner posts"
        },
        {
          title: "10 Essential Tools You Need in 2024",
          type: "list article",
          primaryKeyword: "best tools 2024",
          secondaryKeywords: ["productivity tools", "software recommendations"],
          trafficPotential: "High",
          publishDay: "Wednesday",
          wordCount: 1000,
          angle: "Curated list with honest reviews and pricing",
          linkingOpportunities: "Link to case studies using these tools"
        },
        {
          title: "How I Grew My Audience by 300% This Year",
          type: "case study",
          primaryKeyword: "audience growth case study",
          secondaryKeywords: ["social media growth", "content marketing success"],
          trafficPotential: "Medium",
          publishDay: "Friday",
          wordCount: 800,
          angle: "Personal story with specific strategies and metrics",
          linkingOpportunities: "Link to growth-related posts"
        }
      ];
    }
    
    console.log('Generated calendar successfully');
    
    return {
      calendar,
      error: null
    };
  } catch (error) {
    console.error('Calendar workflow error:', error);
    return {
      calendar: [
        {
          title: "Getting Started Guide",
          type: "tutorial",
          primaryKeyword: "beginners guide",
          secondaryKeywords: ["tutorial", "how to"],
          trafficPotential: "High",
          publishDay: "Monday",
          wordCount: 1000,
          angle: "Step-by-step introduction for newcomers",
          linkingOpportunities: "Connect to advanced topics"
        }
      ],
      error: error.message || 'Failed to generate calendar'
    };
  }
}

module.exports = {
  runDraftWorkflow,
  runSeoWorkflow,

  runCalendarWorkflow
};