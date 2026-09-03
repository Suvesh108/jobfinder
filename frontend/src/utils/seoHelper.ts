/**
 * Dynamic SEO Title & Meta Description Manager
 */
export function updatePageSEO(tabName: string, subInfo?: string) {
  let title = 'JobFinder — #1 Jobs Finder & Career Hub';
  let desc = 'Find top developer, fresher, remote, and tech jobs across Naukri, LinkedIn, Indeed, Glassdoor & ZipRecruiter in one search.';

  switch (tabName) {
    case 'search':
      title = subInfo 
        ? `🔍 ${subInfo} Jobs Finder | JobFinder` 
        : '🔍 Search Jobs — Multi-Portal Job Finder | JobFinder';
      desc = 'Search 100+ fresh openings across Naukri, LinkedIn, Indeed, Glassdoor & ZipRecruiter simultaneously.';
      break;
    case 'found-jobs':
      title = '📋 Discovered Jobs — Live Openings | JobFinder';
      desc = 'Browse and filter verified active job openings with fresh date badges and instant apply links.';
      break;
    case 'applications':
      title = '📊 Application Tracker & Pipeline | JobFinder';
      desc = 'Track your job applications, interviews, offers, and follow-up deadlines in one offline-ready Kanban board.';
      break;
    case 'resume-studio':
      title = '📄 AI Resume Studio & ATS Matcher | JobFinder';
      desc = 'Tailor your resume with AI keyword optimization, match score calculation, and cover letter generation.';
      break;
    case 'settings':
      title = '⚙️ Settings & JobSpy Configuration | JobFinder';
      desc = 'Configure AI providers, manage API keys, and customize JobSpy search adapters.';
      break;
  }

  document.title = title;

  // Update Meta Description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', desc);
  }

  // Update OpenGraph Title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', title);
  }
}
