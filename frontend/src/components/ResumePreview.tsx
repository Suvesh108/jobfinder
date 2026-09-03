import React, { useState } from 'react';
import type { UserProfile } from '../db/schema';
import { 
  Printer, 
  Copy, 
  Check, 
  Download,
  Sparkles,
  FileCode2,
  ExternalLink,
  X
} from 'lucide-react';

interface ResumePreviewProps {
  profile: UserProfile;
  onRecreate?: () => void;
  isRecreating?: boolean;
}

// ponytail: regex escaping for LaTeX reserved characters to prevent syntax and injection errors
const escapeLatex = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

export const ResumePreview: React.FC<ResumePreviewProps> = ({ profile, onRecreate, isRecreating }) => {
  const [copiedTex, setCopiedTex] = useState(false);
  const [showTexEditor, setShowTexEditor] = useState(false);
  const [editedTex, setEditedTex] = useState('');
  

  const handlePrint = () => {
    window.print();
  };

  const generateLatex = (): string => {
    const eduItems = (profile.educationList && profile.educationList.length > 0)
      ? profile.educationList.map(edu => "    \\item\n    \\textbf{" + escapeLatex(edu.institution) + "} $|$ \\textbf{" + escapeLatex(edu.cgpaOrGrade) + "} \\hfill " + edu.location + "\\\\\n    \\textit{" + escapeLatex(edu.degree) + "} \\hfill " + edu.years).join('\n')
      : "    \\item\n    \\textbf{Nagarjuna College of Engineering and Technology} $|$ \\textbf{CGPA: 7/10} \\hfill Bangalore, India\\\\\n    \\textit{B.Tech in Computer Science and Engineering} \\hfill 2021 -- 2025";

    const expItems = (profile.experienceList && profile.experienceList.length > 0)
      ? profile.experienceList.map(exp => "    \\item\n    \\textbf{" + escapeLatex(exp.company) + "} \\hfill " + exp.location + "\\\\\n    \\textit{" + escapeLatex(exp.role) + "} \\hfill " + exp.dates + "\n    \\begin{itemize}\n" + (exp.bullets || []).map(b => "        \\item " + b).join('\n') + "\n    \\end{itemize}").join('\n')
      : '';

    const prjItems = (profile.projectsList && profile.projectsList.length > 0)
      ? profile.projectsList.map(prj => "    \\item\n    \\textbf{" + prj.title + "} \\hfill \\href{" + (prj.githubUrl || '#') + "}{\\underline{GitHub}}\n    \\begin{itemize}\n" + (prj.bullets || []).map(b => "        \\item " + b).join('\n') + "\n    \\end{itemize}").join('\n')
      : '';

    const certItems = (profile.certificationsList && profile.certificationsList.length > 0)
      ? profile.certificationsList.map(cert => "    \\item \\textbf{" + cert.title + "} -- " + cert.description).join('\n')
      : '';

    return "%-------------------------\n% Resume in LaTeX / Jake's Resume Template\n%-------------------------\n\n\\documentclass[letterpaper,11pt]{article}\n\n\\usepackage{latexsym}\n\\usepackage[empty]{fullpage}\n\\usepackage{titlesec}\n\\usepackage{marvosym}\n\\usepackage[usenames,dvipsnames]{color}\n\\usepackage{verbatim}\n\\usepackage{enumitem}\n\\usepackage[hidelinks]{hyperref}\n\\usepackage{fancyhdr}\n\\usepackage[english]{babel}\n\\usepackage{tabularx}\n\n\\pagestyle{fancy}\n\\fancyhf{}\n\\fancyfoot{}\n\\renewcommand{\\headrulewidth}{0pt}\n\\renewcommand{\\footrulewidth}{0pt}\n\n\\addtolength{\\oddsidemargin}{-0.5in}\n\\addtolength{\\evensidemargin}{-0.5in}\n\\addtolength{\\textwidth}{1in}\n\\addtolength{\\topmargin}{-.5in}\n\\addtolength{\\textheight}{1.0in}\n\n\\urlstyle{same}\n\n\\raggedbottom\n\\raggedright\n\\setlength{\\tabcolsep}{0in}\n\n% Sections formatting\n\\titleformat{\\section}{\n  \\vspace{-4pt}\\scshape\\raggedright\\large\\color{NavyBlue}\n}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]\n\n\\begin{document}\n\n%----------HEADING----------\n\\begin{center}\n    \\textbf{\\Huge \\scshape " + (escapeLatex(profile.name) || 'YOUR NAME') + "} \\\\ \\vspace{1pt}\n    \\small " + (profile.email || 'your.email@example.com') + " $|$ " + (profile.phone || '+91-XXXXXXXXXX') + " $|$ \n    \\href{" + (profile.linkedinUrl || 'https://linkedin.com') + "}{\\underline{LinkedIn}} $|$\n    \\href{" + (profile.githubUrl || 'https://github.com') + "}{\\underline{GitHub}} $|$\n    \\href{" + (profile.portfolioUrl || 'https://portfolio.dev') + "}{\\underline{Portfolio}}\n\\end{center}\n\n%-----------PROFESSIONAL SUMMARY-----------\n\\section{Professional Summary}\n" + (escapeLatex(profile.bio) || '') + "\n\n%-----------EDUCATION-----------\n\\section{Education}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n" + eduItems + "\n\\end{itemize}\n\n%-----------CORE SKILLS-----------\n\\section{Core Skills}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n     \\textbf{Technical Support:}{ " + (profile.technicalSupportSkills || 'Troubleshooting, Debugging, Problem Solving, Technical Documentation') + " } \\\\\n     \\textbf{Operating Systems:}{ " + (profile.operatingSystemsSkills || 'Linux, Windows') + " } \\\\\n     \\textbf{Networking:}{ " + (profile.networkingSkills || 'TCP/IP, IPv4, Subnetting, DNS, DHCP, HTTP/HTTPS, SSH') + " } \\\\\n     \\textbf{Tools:}{ " + (profile.toolsSkills || 'Git, GitHub, Postman, Maven, Linux CLI') + " } \\\\\n     \\textbf{Languages \\& Backend:}{ " + (profile.languagesBackendSkills || 'Java, JavaScript, TypeScript, SQL, Spring Boot, Node.js, Express.js') + " } \\\\\n     \\textbf{Databases:}{ " + (profile.databasesSkills || 'MySQL, PostgreSQL, JDBC, Dexie (IndexedDB)') + " }\n    }}\n\\end{itemize}\n\n" + (expItems ? "%-----------EXPERIENCE-----------\n\\section{Experience \\& Training}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n" + expItems + "\n\\end{itemize}\n\n" : "") + (prjItems ? "%-----------PROJECTS-----------\n\\section{Projects}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n" + prjItems + "\n\\end{itemize}\n\n" : "") + (certItems ? "%-----------CERTIFICATIONS-----------\n\\section{Certifications \\& Accomplishments}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n" + certItems + "\n\\end{itemize}\n\n" : "") + "\\end{document}\n";
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(generateLatex());
    setCopiedTex(true);
    setTimeout(() => setCopiedTex(false), 2000);
  };

    const handleOpenTexEditor = () => {
    setEditedTex(generateLatex());
    setShowTexEditor(true);
  };

  const handleDownloadCustomLatex = () => {
    const tex = editedTex || generateLatex();
    const blob = new Blob([tex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.name || 'Resume').replace(/\\s+/g, '_')}_Resume.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 w-full max-w-[860px] mx-auto">
      {/* Action Bar (Print, Download .tex, Copy) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-surface" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="text-xs font-bold text-text-primary">Jake's ATS Format</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md border text-text-muted shrink-0" style={{ background: 'var(--bg-surface-raised)' }}>A4</span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5"
            title="Print or Save as PDF"
          >
            <Printer size={13} />
            <span>Print / PDF</span>
          </button>

          {onRecreate && (
            <button
              type="button"
              onClick={onRecreate}
              disabled={isRecreating}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1.5 font-bold cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06B6D4',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}
              title="Recreate & optimize resume with AI"
            >
              <Sparkles size={13} className={isRecreating ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
              <span>{isRecreating ? 'Recreating...' : 'Recreate'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLatex}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1"
            title="Copy LaTeX (.tex) code for Overleaf"
          >
            {copiedTex ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            <span>{copiedTex ? 'Copied .tex!' : 'Copy LaTeX'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenTexEditor}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1 font-semibold hover:border-cyan-500/40 hover:text-cyan-400 transition-all cursor-pointer"
            title="Open and edit raw LaTeX source code"
          >
            <FileCode2 size={13} className="text-cyan-400" />
            <span>Edit .tex</span>
          </button>
        </div>
      </div>

      {/* ─── EXACT JAKE'S RESUME / LATEX PAPER SHEET (A4 WHITE PAPER WITH MOBILE OVERFLOW SAFETY) ─── */}
      <div className="w-full max-w-full overflow-x-auto pb-4 scrollbar-thin">
        <div 
          id="printable-resume"
        className="w-full max-w-[860px] mx-auto bg-white text-slate-900 shadow-2xl rounded-sm p-10 sm:p-12 transition-all select-text font-serif leading-relaxed"
        style={{
          fontFamily: "'Times New Roman', Times, 'Computer Modern Serif', Georgia, serif",
          minHeight: '1050px',
          color: '#111827',
          backgroundColor: '#FFFFFF'
        }}
      >
        {/* 1. Header: Name & Contact Info */}
        <div className="text-center pb-3 border-b-0 space-y-1">
          <h1 
            className="text-2xl sm:text-3xl font-bold tracking-normal uppercase"
            style={{ color: '#1E3A8A', fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            {profile.name || 'YOUR NAME'}
          </h1>
          <div className="text-[12px] sm:text-[13px] text-slate-700 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            {profile.email && <span>{profile.email}</span>}
            {profile.phone && (
              <>
                <span>|</span>
                <span>{profile.phone}</span>
              </>
            )}
            {profile.linkedinUrl && (
              <>
                <span>|</span>
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">
                  LinkedIn
                </a>
              </>
            )}
            {profile.githubUrl && (
              <>
                <span>|</span>
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">
                  GitHub
                </a>
              </>
            )}
            {profile.portfolioUrl && (
              <>
                <span>|</span>
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">
                  Portfolio
                </a>
              </>
            )}
          </div>
        </div>

        {/* 2. Professional Summary */}
        {profile.bio && (
          <div className="mt-4">
            <h2 className="text-[14px] font-bold text-[#1E3A8A] uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1.5">
              Professional Summary
            </h2>
            <p className="text-[12px] text-slate-800 text-justify leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* 3. Education */}
        <div className="mt-4">
          <h2 className="text-[14px] font-bold text-[#1E3A8A] uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1.5">
            Education
          </h2>
          {(profile.educationList && profile.educationList.length > 0) ? (
            profile.educationList.map((edu, idx) => (
              <div key={idx} className="text-[12px] space-y-0.5">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{edu.institution} <span className="font-normal">| {edu.cgpaOrGrade}</span></span>
                  <span className="font-normal text-slate-800">{edu.location}</span>
                </div>
                <div className="flex justify-between items-baseline italic text-slate-800">
                  <span>{edu.degree}</span>
                  <span className="not-italic text-slate-800">{edu.years}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[12px]">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Nagarjuna College of Engineering and Technology <span className="font-normal">| CGPA: 7/10</span></span>
                <span className="font-normal text-slate-800">Bangalore, India</span>
              </div>
              <div className="flex justify-between italic text-slate-800">
                <span>B.Tech in Computer Science and Engineering</span>
                <span className="not-italic text-slate-800">2021 — 2025</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Core Skills */}
        <div className="mt-4">
          <h2 className="text-[14px] font-bold text-[#1E3A8A] uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1.5">
            Core Skills
          </h2>
          <div className="text-[12px] text-slate-800 space-y-1">
            {profile.technicalSupportSkills && (
              <div>
                <span className="font-bold text-slate-900">Technical Support: </span>
                <span>{profile.technicalSupportSkills}</span>
              </div>
            )}
            {profile.operatingSystemsSkills && (
              <div>
                <span className="font-bold text-slate-900">Operating Systems: </span>
                <span>{profile.operatingSystemsSkills}</span>
              </div>
            )}
            {profile.networkingSkills && (
              <div>
                <span className="font-bold text-slate-900">Networking: </span>
                <span>{profile.networkingSkills}</span>
              </div>
            )}
            {profile.toolsSkills && (
              <div>
                <span className="font-bold text-slate-900">Tools: </span>
                <span>{profile.toolsSkills}</span>
              </div>
            )}
            {profile.languagesBackendSkills && (
              <div>
                <span className="font-bold text-slate-900">Languages &amp; Backend: </span>
                <span>{profile.languagesBackendSkills}</span>
              </div>
            )}
            {profile.databasesSkills && (
              <div>
                <span className="font-bold text-slate-900">Databases: </span>
                <span>{profile.databasesSkills}</span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Experience & Training */}
        {profile.experienceList && profile.experienceList.length > 0 && (
          <div className="mt-4">
            <h2 className="text-[14px] font-bold text-[#1E3A8A] uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-2">
              Experience &amp; Training
            </h2>
            <div className="space-y-3">
              {profile.experienceList.map((exp, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[12px]">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                      <span>{exp.company}</span>
                      {exp.certificateUrl && (
                        <span className="text-blue-900 text-[11px] font-normal">[<a href={exp.certificateUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Certificate</a>]</span>
                      )}
                    </div>
                    <span className="text-slate-800 text-[12px]">{exp.location}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[12px] italic text-slate-800">
                    <span>{exp.role}</span>
                    <span className="not-italic text-slate-800">{exp.dates}</span>
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-0.5 text-[12px] text-slate-800">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="leading-snug">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Projects */}
        {profile.projectsList && profile.projectsList.length > 0 && (
          <div className="mt-4">
            <h2 className="text-[14px] font-bold text-[#1E3A8A] uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-2">
              Projects
            </h2>
            <div className="space-y-3">
              {profile.projectsList.map((prj, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[12px]">
                    <span className="font-bold text-slate-900">{prj.title}</span>
                    {prj.githubUrl && (
                      <span className="text-blue-900 text-[11px]">[<a href={prj.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>]</span>
                    )}
                  </div>
                  <ul className="list-disc list-outside ml-4 space-y-0.5 text-[12px] text-slate-800">
                    {prj.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="leading-snug">{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Certifications & Accomplishments */}
        {profile.certificationsList && profile.certificationsList.length > 0 && (
          <div className="mt-4">
            <h2 className="text-[14px] font-bold text-[#1E3A8A] uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-2">
              Certifications &amp; Accomplishments
            </h2>
            <div className="space-y-1.5 text-[12px] text-slate-800">
              {profile.certificationsList.map((cert, idx) => (
                <div key={idx} className="flex items-baseline space-x-1">
                  <span className="font-bold text-slate-900">{cert.title}</span>
                  {cert.certificateUrl && (
                    <span className="text-blue-900 text-[11px]">[<a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Certificate</a>]</span>
                  )}
                  <span>— {cert.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
      </div>

      {/* ─── INTERACTIVE LATEX (.TEX) SOURCE CODE EDITOR MODAL ─── */}
      {showTexEditor && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
          onClick={() => setShowTexEditor(false)}
        >
          <div 
            className="card w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 px-6 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                  <FileCode2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-display">LaTeX (.tex) Source Editor</h3>
                  <p className="text-[11px] text-text-muted">Directly edit, copy for Overleaf, or download your ATS resume markup</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href="https://www.overleaf.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5 hidden sm:flex items-center space-x-1"
                  title="Open Overleaf Docs"
                >
                  <span>Overleaf</span>
                  <ExternalLink size={12} />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(editedTex);
                    setCopiedTex(true);
                    setTimeout(() => setCopiedTex(false), 2000);
                  }}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center space-x-1 font-semibold"
                  title="Copy .tex markup"
                >
                  {copiedTex ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  <span>{copiedTex ? 'Copied .tex!' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCustomLatex}
                  className="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5 font-bold"
                  title="Download edited .tex file"
                >
                  <Download size={13} />
                  <span>Download .tex</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTexEditor(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors cursor-pointer"
                  title="Close editor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Editor Textarea with Monospace Syntax Look */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col bg-canvas">
              <div className="flex items-center justify-between pb-2 text-[10px] font-mono text-text-muted select-none">
                <span>FILE: Jake_Resume.tex (UTF-8)</span>
                <span>LINES: {editedTex.split('\n').length}</span>
              </div>
              <textarea
                value={editedTex}
                onChange={(e) => setEditedTex(e.target.value)}
                className="w-full flex-1 border rounded-xl p-4 font-mono text-xs leading-relaxed text-text-primary focus:outline-none resize-none shadow-inner"
                style={{ 
                  background: 'var(--bg-input)', 
                  borderColor: 'var(--border-subtle)',
                  whiteSpace: 'pre',
                  tabSize: 2
                }}
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
