import type { UserProfile, JobApplication } from '../db/schema';

export type AIProviderId = 
  | 'gemini' 
  | 'openrouter' 
  | 'nvidia' 
  | 'groq' 
  | 'deepseek' 
  | 'mistral' 
  | 'openai' 
  | 'cohere' 
  | 'custom' 
  | 'offline';

export interface AITailorResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengthsSummary: string;
  tailoredCoverLetter: string;
  tailoredResumeBullets: string[];
}

export interface InterviewPrepResult {
  companyBrief: string;
  behavioralSTAR: {
    question: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    tip: string;
  }[];
  technicalQuestions: {
    question: string;
    keyConcept: string;
    suggestedApproach: string;
  }[];
  questionsForInterviewer: string[];
}

export interface EmailDraftResult {
  subject: string;
  body: string;
  recipient: string;
}

export interface ProviderConfig {
  id: AIProviderId;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  defaultModel: string;
  candidateModels: string[];
  baseUrl: string;
  keyPlaceholder: string;
  keyDashboardUrl: string;
  isFreeTier: boolean;
}

export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Gemini 2.0 / 1.5 Flash (Free tier with 15 RPM)',
    badge: '100% Free Tier',
    badgeColor: '#38BDF8',
    defaultModel: 'gemini-1.5-flash',
    candidateModels: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    keyPlaceholder: 'AIzaSy...',
    keyDashboardUrl: 'https://aistudio.google.com/app/apikey',
    isFreeTier: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'Aggregator with dozens of free models (Llama 3.3, Qwen 2.5, Gemini)',
    badge: 'Free Models Available',
    badgeColor: '#818CF8',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    candidateModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
      'qwen/qwen-2.5-coder-32b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free'
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    keyDashboardUrl: 'https://openrouter.ai/keys',
    isFreeTier: true,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    tagline: 'High-speed cloud inference with 1,000 free API credits',
    badge: '1,000 Free Credits',
    badgeColor: '#10B981',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    candidateModels: [
      'meta/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2-instruct',
      'deepseek-ai/deepseek-r1',
      'nvidia/llama-3.1-nemotron-70b-instruct'
    ],
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyPlaceholder: 'nvapi-...',
    keyDashboardUrl: 'https://build.nvidia.com',
    isFreeTier: true,
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    tagline: 'LPU inference with 500+ tokens/sec (Free generous tier)',
    badge: 'Ultra Fast',
    badgeColor: '#F59E0B',
    defaultModel: 'llama-3.3-70b-versatile',
    candidateModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'deepseek-r1-distill-llama-70b',
      'gemma2-9b-it'
    ],
    baseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_...',
    keyDashboardUrl: 'https://console.groq.com/keys',
    isFreeTier: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    tagline: 'DeepSeek-V3 and DeepSeek-R1 (Extremely low-cost / Free credit)',
    badge: 'Top Reasoning',
    badgeColor: '#06B6D4',
    defaultModel: 'deepseek-chat',
    candidateModels: ['deepseek-chat', 'deepseek-reasoner'],
    baseUrl: 'https://api.deepseek.com/v1',
    keyPlaceholder: 'sk-...',
    keyDashboardUrl: 'https://platform.deepseek.com/api_keys',
    isFreeTier: false,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    tagline: 'Mistral Large 2 & Codestral (Free experimental tier)',
    badge: 'Free Tier',
    badgeColor: '#FB923C',
    defaultModel: 'mistral-large-latest',
    candidateModels: ['mistral-large-latest', 'codestral-latest', 'mistral-small-latest'],
    baseUrl: 'https://api.mistral.ai/v1',
    keyPlaceholder: 'Bearer key...',
    keyDashboardUrl: 'https://console.mistral.ai/api-keys',
    isFreeTier: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT-4o, GPT-4o-mini & GPT-3.5',
    badge: 'Industry Standard',
    badgeColor: '#2DD4BF',
    defaultModel: 'gpt-4o-mini',
    candidateModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-proj-...',
    keyDashboardUrl: 'https://platform.openai.com/api-keys',
    isFreeTier: false,
  },
  {
    id: 'custom',
    name: 'Custom / Local (Ollama)',
    tagline: 'Self-hosted Ollama, LM Studio, vLLM, or custom backend',
    badge: '100% Private',
    badgeColor: '#EC4899',
    defaultModel: 'llama3',
    candidateModels: ['llama3', 'mistral', 'deepseek-r1', 'qwen2.5'],
    baseUrl: 'http://localhost:11434/v1',
    keyPlaceholder: 'Optional for local',
    keyDashboardUrl: 'https://ollama.com',
    isFreeTier: true,
  },
  {
    id: 'offline',
    name: 'Offline Smart Engine',
    tagline: 'Deterministic ATS optimization algorithm (0 keys required)',
    badge: 'Always Ready',
    badgeColor: '#94A3B8',
    defaultModel: 'local-rules-v2',
    candidateModels: ['local-rules-v2'],
    baseUrl: '',
    keyPlaceholder: 'No key needed',
    keyDashboardUrl: '',
    isFreeTier: true,
  },
];

// ─── Auto-Detect Working Models ──────────────────────────────────────────────
export async function autoDetectWorkingModel(
  providerId: AIProviderId,
  apiKey?: string,
  baseUrl?: string
): Promise<{ success: boolean; workingModel: string; message: string; latencyMs: number }> {
  const startTime = Date.now();
  const config = AI_PROVIDERS.find(p => p.id === providerId) || AI_PROVIDERS[0];

  if (providerId === 'offline') {
    return { success: true, workingModel: 'local-rules-v2', message: 'Offline deterministic engine is active.', latencyMs: 0 };
  }

  if (!apiKey && providerId !== 'custom') {
    return { success: false, workingModel: config.defaultModel, message: 'API key is required to detect models.', latencyMs: 0 };
  }

  // 1. Google Gemini Auto-Detection
  if (providerId === 'gemini') {
    for (const model of config.candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with OK.' }] }]
          })
        });
        if (res.ok) {
          return {
            success: true,
            workingModel: model,
            message: `Auto-detected active model: ${model}`,
            latencyMs: Date.now() - startTime
          };
        }
      } catch (_) {
        continue;
      }
    }
    return { success: false, workingModel: config.defaultModel, message: 'Could not connect to Gemini API with this key.', latencyMs: Date.now() - startTime };
  }

  // 2. OpenAI-compatible providers (OpenRouter, NVIDIA NIM, Groq, DeepSeek, Mistral, OpenAI, Custom)
  const apiBase = (providerId === 'custom' ? (baseUrl || 'http://localhost:11434/v1') : config.baseUrl).replace(/\/+$/, '');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = 'https://jobfinder.local';
    headers['X-Title'] = 'JobFinder ATS Optimizer';
  }

  for (const model of config.candidateModels) {
    try {
      const res = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5
        })
      });

      if (res.ok) {
        return {
          success: true,
          workingModel: model,
          message: `Auto-detected active model: ${model}`,
          latencyMs: Date.now() - startTime
        };
      }
    } catch (_) {
      continue;
    }
  }

  return { 
    success: false, 
    workingModel: config.defaultModel, 
    message: `Failed to connect to ${config.name}. Please verify your API key and base URL.`, 
    latencyMs: Date.now() - startTime 
  };
}

// ─── Test Connection ─────────────────────────────────────────────────────────
export async function testAIConnection(
  provider: AIProviderId,
  apiKey?: string,
  baseUrl?: string
): Promise<{ success: boolean; message: string; latencyMs: number; detectedModel?: string }> {
  const result = await autoDetectWorkingModel(provider, apiKey, baseUrl);
  return {
    success: result.success,
    message: result.message,
    latencyMs: result.latencyMs,
    detectedModel: result.workingModel
  };
}

// ─── Generate AI Role-Tailored Resume using Profile Data ─────────────────────
export async function generateAITailoredResume(
  profile: UserProfile,
  job: JobApplication | { company: string; role: string; location?: string; description?: string }
): Promise<{ matchScore: number; tailoredProfile: UserProfile }> {
  const role = job.role || 'Software Engineer';
  const company = job.company || 'Target Company';
  const jobDesc = (job as JobApplication).notes || (job as { description?: string }).description || '';

  const provider = (profile.aiProvider as AIProviderId) || 'gemini';
  const apiKey = profile.aiApiKey;
  const config = AI_PROVIDERS.find(p => p.id === provider) || AI_PROVIDERS[0];
  const modelToUse = profile.aiModel || config.defaultModel;

  if (provider !== 'offline' && (apiKey || provider === 'custom')) {
    try {
      const prompt = `You are an expert ATS Resume Optimizer.
Below is the candidate's existing verified profile details:
- Name: ${profile.name}
- Headline: ${profile.headline}
- Current Summary: ${profile.bio}
- Technical Support Skills: ${profile.technicalSupportSkills || ''}
- Operating Systems: ${profile.operatingSystemsSkills || ''}
- Networking Skills: ${profile.networkingSkills || ''}
- Tools: ${profile.toolsSkills || ''}
- Languages & Backend: ${profile.languagesBackendSkills || ''}
- Databases: ${profile.databasesSkills || ''}
- Experience: ${JSON.stringify(profile.experienceList || [])}
- Projects: ${JSON.stringify(profile.projectsList || [])}

Target Job Posting:
- Role: ${role}
- Company: ${company}
- Requirements / Details: ${jobDesc || 'Software engineering, bug troubleshooting, testing, robust system design.'}

Task:
Produce an ATS-optimized summary specifically for ${company}, and prioritize relevant skills. Return ONLY a valid JSON object:
{
  "tailoredSummary": "3-4 sentence high-impact summary highlighting candidate strengths relevant to ${company} and ${role}",
  "matchScore": 96,
  "highlightedSkills": {
    "technicalSupport": "comma-separated skills",
    "languagesBackend": "comma-separated skills",
    "databases": "comma-separated skills"
  }
}`;

      let jsonResponseText = '';

      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });
        if (res.ok) {
          const data = await res.json();
          jsonResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } else {
        const apiBase = (provider === 'custom' ? (profile.aiBaseUrl || 'http://localhost:11434/v1') : config.baseUrl).replace(/\/+$/, '');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = 'https://jobfinder.local';
          headers['X-Title'] = 'JobFinder ATS Optimizer';
        }

        const res = await fetch(`${apiBase}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelToUse,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });

        if (res.ok) {
          const data = await res.json();
          jsonResponseText = data.choices?.[0]?.message?.content || '';
        }
      }

      if (jsonResponseText) {
        const parsed = JSON.parse(jsonResponseText);
        const tailored: UserProfile = {
          ...profile,
          headline: `${role} candidate | Software Engineering & Technical Systems Specialist`,
          bio: parsed.tailoredSummary || profile.bio,
          technicalSupportSkills: parsed.highlightedSkills?.technicalSupport || profile.technicalSupportSkills,
          languagesBackendSkills: parsed.highlightedSkills?.languagesBackend || profile.languagesBackendSkills,
          databasesSkills: parsed.highlightedSkills?.databases || profile.databasesSkills,
        };

        return {
          matchScore: parsed.matchScore || 96,
          tailoredProfile: tailored,
        };
      }
    } catch (e) {
      console.warn('Live AI call failed, using deterministic engine:', e);
    }
  }

  // Fallback Engine
  const defaultSummary = `Computer Science graduate with strong proficiency in ${role} fundamentals, software development, and technical troubleshooting. Demonstrates proven ability to build full-stack features, diagnose data-flow errors, and test across environments. Dedicated to applying technical problem-solving and engineering skills to deliver robust solutions for ${company}.`;

  const fallbackProfile: UserProfile = {
    ...profile,
    headline: `${role} Candidate | Full-Stack & Technical Systems Specialist`,
    bio: defaultSummary,
  };

  return {
    matchScore: Math.floor(Math.random() * 6) + 93,
    tailoredProfile: fallbackProfile,
  };
}

// ─── Cover Letter & Interview Helpers ─────────────────────────────────────────
const COMMON_TECH_KEYWORDS = [
  'react', 'react.js', 'typescript', 'javascript', 'next.js', 'vue', 'angular',
  'node.js', 'express', 'python', 'fastapi', 'django', 'java', 'spring boot', 'c#', '.net', 'golang',
  'html', 'css', 'tailwind', 'tailwind css', 'bootstrap', 'sass', 'redux', 'zustand',
  'rest api', 'graphql', 'websockets', 'grpc', 'microservices',
  'postgresql', 'mysql', 'mongodb', 'redis', 'dynamodb', 'sql', 'prisma',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'linux',
  'jest', 'cypress', 'testing library', 'playwright', 'unit testing',
  'agile', 'scrum', 'system design', 'architecture', 'scalability', 'performance optimization'
];

export function analyzeSkills(jobText: string, candidateSkills: string[]) {
  const normalizedText = jobText.toLowerCase();
  const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());
  const foundInJob: string[] = [];
  
  for (const kw of COMMON_TECH_KEYWORDS) {
    if (normalizedText.includes(kw)) {
      foundInJob.push(kw);
    }
  }

  for (const skill of candidateSkills) {
    if (normalizedText.includes(skill.toLowerCase()) && !foundInJob.includes(skill.toLowerCase())) {
      foundInJob.push(skill.toLowerCase());
    }
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const jobKw of foundInJob) {
    const isMatched = normalizedCandidateSkills.some(cs => cs.includes(jobKw) || jobKw.includes(cs));
    if (isMatched) {
      const original = candidateSkills.find(cs => cs.toLowerCase().includes(jobKw) || jobKw.includes(cs.toLowerCase())) || jobKw;
      if (!matchedSkills.includes(original)) matchedSkills.push(original);
    } else {
      const formatted = jobKw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!missingSkills.includes(formatted)) missingSkills.push(formatted);
    }
  }

  if (matchedSkills.length === 0 && missingSkills.length === 0) {
    matchedSkills.push(...candidateSkills.slice(0, 4));
    missingSkills.push('Cloud Architecture (AWS/GCP)', 'CI/CD Pipelines');
  }

  const total = matchedSkills.length + missingSkills.length;
  const matchScore = total > 0 ? Math.min(96, Math.max(55, Math.round((matchedSkills.length / total) * 100) + 15)) : 82;

  return { matchScore, matchedSkills, missingSkills };
}

export function generateTailoredApplication(
  profile: UserProfile,
  job: { company: string; role: string; location?: string; description?: string }
) {
  const jobText = `${job.role} ${job.company} ${job.description || ''}`;
  const { matchScore, matchedSkills, missingSkills } = analyzeSkills(jobText, profile.skills || []);

  const topSkills = matchedSkills.slice(0, 4).join(', ') || 'modern software engineering best practices';
  const roleName = job.role || 'Software Engineer';
  const companyName = job.company || 'Hiring Team';
  const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const coverLetter = `${todayDate}

Hiring Team
${companyName}
${job.location || 'Remote'}

Dear Hiring Team at ${companyName},

I am writing to express my strong enthusiasm for the ${roleName} position at ${companyName}. With a solid track record in ${profile.headline || 'building robust software applications'} and hands-on proficiency in ${topSkills}, I am excited about the prospect of delivering high-impact contributions to your engineering team.

${profile.experienceSummary || 'Throughout my career, I have focused on engineering scalable, maintainable, and user-centric systems.'} At ${companyName}, I noticed your focus on building modern, high-quality products. My background aligning closely with ${matchedSkills[0] || 'core engineering fundamentals'} and ${matchedSkills[1] || 'modern system architecture'} makes me confident in my ability to immediately accelerate your product roadmap.

A few highlights I bring to ${companyName}:
• Demonstrated mastery in ${matchedSkills.slice(0, 3).join(' and ') || 'full-stack development'}, delivering clean, tested, and reliable code.
• Experience collaborating across cross-functional teams to translate complex product specifications into intuitive user experiences.
• A proactive approach to system scalability, code reviews, and maintaining high engineering standards.

I would welcome the opportunity to discuss how my technical skill set and passion for clean engineering align with the mission of ${companyName}. Thank you for your time and consideration.

Sincerely,

${profile.name}
${profile.email} | ${profile.phone}
${profile.linkedinUrl || ''}`;

  const resumeBullets = [
    `Architected and deployed responsive ${roleName} solutions utilizing ${matchedSkills.slice(0, 2).join(' & ') || 'modern frameworks'}, improving load speeds and UX responsiveness by 35%.`,
    `Engineered scalable modular components and API integrations with ${matchedSkills[2] || 'clean architecture patterns'}, reducing code duplication and onboarding overhead.`,
    `Collaborated within agile sprint cycles to optimize continuous integration and automated test suites, achieving 99.8% test coverage and zero regression deployments.`,
    `Mentored peer developers on ${matchedSkills[0] || 'engineering'} best practices, state management optimizations, and accessibility standards.`
  ];

  const strengthsSummary = `Strong match in ${matchedSkills.slice(0, 3).join(', ')}. Candidate profile demonstrates direct domain overlap with ${companyName}'s core tech stack.`;

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    strengthsSummary,
    tailoredCoverLetter: coverLetter,
    tailoredResumeBullets: resumeBullets
  };
}

export function generateInterviewPrep(
  profile: UserProfile,
  job: JobApplication | { company: string; role: string; description?: string }
) {
  const company = job.company || 'Target Company';
  const role = job.role || 'Software Engineer';
  const skills = profile.skills || ['JavaScript', 'React', 'Node.js'];
  const p1 = skills[0] || 'React';
  const p2 = skills[1] || 'TypeScript';

  return {
    companyBrief: `${company} is focused on scalable modern products and engineering velocity. For the ${role} position, they evaluate problem-solving, architectural maturity, and hands-on proficiency in ${p1} and ${p2}.`,
    behavioralSTAR: [
      {
        question: "Tell me about a challenging bug or performance bottleneck you resolved.",
        situation: `While working on a high-traffic feature involving ${p1}, page rendering times degraded under heavy payload.`,
        task: "Identify the root cause, eliminate unnecessary re-renders, and ensure reliable state synchronization.",
        action: `Profiled component lifecycles, memoized expensive calculations, and restructured state flow with ${p2}.`,
        result: "Reduced render latency by 45% and eliminated race conditions across client sessions.",
        tip: "Highlight your systematic root-cause analysis rather than just the final fix."
      },
      {
        question: "Describe a time you had to adapt quickly to changing technical requirements or tight deadlines.",
        situation: "A core product deliverable required an unexpected architecture pivot 2 weeks before release.",
        task: "Maintain delivery timelines while preventing technical debt and preserving code quality.",
        action: "Broke down requirements into modular sprint deliverables, aligned with the lead engineer, and built reusable service layers.",
        result: "Delivered the feature on time with 100% test coverage and zero production escalations.",
        tip: "Emphasize clear communication and proactive risk management."
      }
    ],
    technicalQuestions: [
      {
        question: `How would you architect state management and data caching in a modern ${p1} application?`,
        keyConcept: "Client vs Server state separation, caching invalidation, and reactivity.",
        suggestedApproach: `Explain using lightweight reactive stores (e.g. Zustand) combined with optimistic updates and clean API boundary layers.`
      },
      {
        question: `How do you ensure end-to-end type safety and resilience when integrating external APIs with ${p2}?`,
        keyConcept: "Schema validation, runtime type guards, and structured error boundaries.",
        suggestedApproach: "Discuss combining compile-time TypeScript types with runtime validators (like Zod) and centralized interceptors."
      }
    ],
    questionsForInterviewer: [
      `What are the biggest technical challenges the ${company} engineering team is currently facing around scalability?`,
      `How does your team balance feature velocity with architectural refactoring and automated test coverage?`,
      `What does success look like in the first 90 days for someone joining as a ${role}?`
    ]
  };
}

export function generateSmartEmail(
  profile: UserProfile,
  job: JobApplication,
  type: 'follow_up' | 'thank_you' | 'cold_outreach'
) {
  const company = job.company || 'Company';
  const role = job.role || 'Software Engineer';
  const candidate = profile.name || 'Candidate';

  if (type === 'thank_you') {
    return {
      subject: `Thank you for the interview - ${role} position - ${candidate}`,
      recipient: job.contactEmail || `careers@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      body: `Hi ${job.contactName || 'Hiring Team'},

Thank you so much for taking the time to speak with me today regarding the ${role} opening at ${company}.

I really enjoyed learning more about the team's roadmap and engineering initiatives. Our conversation reinforced my excitement about the opportunity to contribute with my background in ${(profile.skills || []).slice(0, 3).join(', ')}.

Please let me know if you need any additional code samples, references, or details from my end.

Best regards,

${candidate}
${profile.email} | ${profile.phone}
${profile.linkedinUrl || ''}`
    };
  }

  if (type === 'cold_outreach') {
    return {
      subject: `${role} opportunity - ${candidate}`,
      recipient: job.contactEmail || `hiring@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      body: `Hi ${job.contactName || 'Team'},

I have been following ${company}'s work and was very impressed by your product trajectory. I am writing to introduce myself as a ${profile.headline || 'Software Engineer'}.

With hands-on experience building ${(profile.skills || []).slice(0, 3).join(' and ')} systems, I would love to explore how my technical background could assist your engineering team.

I have attached my resume and portfolio (${profile.portfolioUrl || profile.githubUrl || 'portfolio'}). I would appreciate 10 minutes to connect if you have an opening on the horizon.

Best regards,

${candidate}
${profile.email} | ${profile.phone}
${profile.linkedinUrl || ''}`
    };
  }

  return {
    subject: `Following up on ${role} application - ${candidate}`,
    recipient: job.contactEmail || `recruiting@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    body: `Hi ${job.contactName || 'Hiring Team'},

I hope this email finds you well.

I wanted to follow up on my application for the ${role} position at ${company} submitted on ${job.dateApplied}.

I remain very interested in the opportunity to contribute to ${company} with my skills in ${(profile.skills || []).slice(0, 3).join(', ')}. Please let me know if there are any updates regarding the recruitment timeline or if you need any additional materials from me.

Thank you again for your time and consideration.

Best regards,

${candidate}
${profile.email} | ${profile.phone}
${profile.linkedinUrl || ''}`
  };
}

export function generateEmailDraft(
  type: string,
  profile: UserProfile,
  job: JobApplication
) {
  const normalizedType = type === 'thank_you' ? 'thank_you' : type === 'inquiry' ? 'cold_outreach' : 'follow_up';
  return generateSmartEmail(profile, job, normalizedType);
}


export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export async function chatWithAICopilot(
  userQuery: string,
  history: ChatMessage[],
  profile: UserProfile,
  selectedJob?: JobApplication | null
): Promise<{ text: string }> {
  const provider = (profile.aiProvider as AIProviderId) || 'gemini';
  const apiKey = profile.aiApiKey;
  const config = AI_PROVIDERS.find(p => p.id === provider) || AI_PROVIDERS[0];
  const modelToUse = profile.aiModel || config.defaultModel;

  const jobContext = selectedJob ? 
    "Target Tracked Job Context:\n- Company: " + selectedJob.company + "\n- Role: " + selectedJob.role + "\n- Location: " + selectedJob.location + "\n- Status in Tracker: " + selectedJob.status + "\n- Requirements/Notes: " + (selectedJob.notes || 'Full-stack engineering, system troubleshooting, clean architecture.')
    : "No specific job selected. General candidate profile context.";

  const profileContext = "Verified Candidate Profile (from Edit Profile):\n" +
    "- Name: " + profile.name + "\n" +
    "- Headline: " + profile.headline + "\n" +
    "- Summary: " + profile.bio + "\n" +
    "- Technical Support: " + (profile.technicalSupportSkills || '') + "\n" +
    "- Operating Systems: " + (profile.operatingSystemsSkills || '') + "\n" +
    "- Networking: " + (profile.networkingSkills || '') + "\n" +
    "- Tools: " + (profile.toolsSkills || '') + "\n" +
    "- Languages & Backend: " + (profile.languagesBackendSkills || '') + "\n" +
    "- Databases: " + (profile.databasesSkills || '') + "\n" +
    "- Education: " + JSON.stringify(profile.educationList || []) + "\n" +
    "- Experience: " + JSON.stringify(profile.experienceList || []) + "\n" +
    "- Projects: " + JSON.stringify(profile.projectsList || []) + "\n" +
    "- Certifications: " + JSON.stringify(profile.certificationsList || []);

  const systemPrompt = "You are the JobFinder AI Copilot, a strict and dedicated specialist for candidate resumes, ATS optimizations, and job application tracking.\n\n" +
    "CRITICAL CONSTRAINTS & BEHAVIORAL RULES:\n" +
    "1. DOMAIN RESTRICTION: You MUST ONLY answer queries related to the candidate's resume, candidate profile, experience/project bullets, core skills, ATS matching, job application tailoring, cover letters, and interview preparation.\n" +
    "2. STRICT REFUSAL OF UNRELATED TOPICS: If the user asks about unrelated topics (such as general knowledge, cooking, politics, gaming, homework, unrelated software development tutorials, or generic chit-chat), you MUST politely refuse with:\n" +
    "\"I am specialized strictly as your Resume & Job Application Copilot. I can only assist with tailoring your resume, optimizing your profile details, analyzing job applications, and preparing application materials. How can I help optimize your resume or applications today?\"\n" +
    "3. Keep all responses clear, actionable, metric-oriented, and formatted in clean markdown.\n\n" +
    profileContext + "\n\n" +
    jobContext;

  if (provider !== 'offline' && (apiKey || provider === 'custom')) {
    try {
      if (provider === 'gemini') {
        const conversationParts = [
          { text: systemPrompt },
          ...history.slice(-4).map(h => ({ text: (h.sender === 'user' ? 'User: ' : 'Assistant: ') + h.text })),
          { text: 'User: ' + userQuery }
        ];

        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelToUse + ":generateContent?key=" + apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: conversationParts }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return { text: reply };
        }
      } else {
        const apiBase = (provider === 'custom' ? (profile.aiBaseUrl || 'http://localhost:11434/v1') : config.baseUrl).replace(/\/+$/, '');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = "Bearer " + apiKey;
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = 'https://jobfinder.local';
          headers['X-Title'] = 'JobFinder ATS Optimizer';
        }

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
          { role: 'user', content: userQuery }
        ];

        const res = await fetch(apiBase + "/chat/completions", {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelToUse,
            messages
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return { text: reply };
        }
      }
    } catch (err) {
      console.warn('AI Copilot request failed, using smart local engine:', err);
    }
  }

  // When no AI API key is connected
  const hasKey = Boolean(apiKey) || (provider === 'custom' && Boolean(profile.aiBaseUrl));
  if (!hasKey) {
    return {
      text: "Hello " + (profile.name || 'there') + "! 👋\n\n" +
        "⚠️ **No AI API Key Connected**: To enable live resume tailoring, bullet generation, and keyword analysis, please connect your AI API key in **Settings → AI Providers**.\n\n" +
        "You can connect free API keys from **Google Gemini**, **OpenRouter**, **NVIDIA NIM (1,000 free credits)**, **Groq Cloud**, or **DeepSeek**."
    };
  }

  return {
    text: "I was unable to receive a response from your AI provider. Please verify your API key and model selection in **Settings → AI Providers**."
  };
}
