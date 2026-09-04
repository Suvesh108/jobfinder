import React, { useState, useEffect } from 'react';
import { 
  getUserProfile, 
  saveUserProfile, 
  type UserProfile,
  type EducationEntry,
  type ExperienceEntry,
  type ProjectEntry,
  type CertificationEntry
} from '../db/schema';
import { ResumePreview } from './ResumePreview';
import { generateAITailoredResume } from '../utils/aiService';
import { 
  User, 
  Check, 
  Save, 
  Tag, 
  GraduationCap, 
  Briefcase,
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Code, 
  FileText, 
  Sliders, 
  Plus, 
  Trash2, 
  Award,
  FolderGit2,
  Share2,
  Key,
  Globe,
  Sparkles
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'preview' | 'edit'>('preview');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [isRecreating, setIsRecreating] = useState(false);
  
  // Full Profile State
  const [fullProfile, setFullProfile] = useState<UserProfile | null>(null);

  // 1. Basic Info
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  
  // 2. Summary
  const [bio, setBio] = useState('');
  
  // 3. Categorized Skills
  const [technicalSupportSkills, setTechnicalSupportSkills] = useState('');
  const [operatingSystemsSkills, setOperatingSystemsSkills] = useState('');
  const [networkingSkills, setNetworkingSkills] = useState('');
  const [toolsSkills, setToolsSkills] = useState('');
  const [languagesBackendSkills, setLanguagesBackendSkills] = useState('');
  const [databasesSkills, setDatabasesSkills] = useState('');

  // 4. Structured Arrays
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [experienceList, setExperienceList] = useState<ExperienceEntry[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectEntry[]>([]);
  const [certificationsList, setCertificationsList] = useState<CertificationEntry[]>([]);

  // 5. Integrations
  const [notionToken, setNotionToken] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');

  const loadData = () => {
    getUserProfile().then((p: UserProfile) => {
      setFullProfile(p);
      setName(p.name || '');
      setHeadline(p.headline || '');
      setEmail(p.email || '');
      setPhone(p.phone || '');
      setLocation(p.location || '');
      setLinkedinUrl(p.linkedinUrl || '');
      setGithubUrl(p.githubUrl || '');
      setPortfolioUrl(p.portfolioUrl || '');
      
      setBio(p.bio || '');
      
      setTechnicalSupportSkills(p.technicalSupportSkills || '');
      setOperatingSystemsSkills(p.operatingSystemsSkills || '');
      setNetworkingSkills(p.networkingSkills || '');
      setToolsSkills(p.toolsSkills || '');
      setLanguagesBackendSkills(p.languagesBackendSkills || '');
      setDatabasesSkills(p.databasesSkills || '');

      setEducationList(p.educationList || []);
      setExperienceList(p.experienceList || []);
      setProjectsList(p.projectsList || []);
      setCertificationsList(p.certificationsList || []);

      setNotionToken(p.notionToken || '');
      setNotionDatabaseId(p.notionDatabaseId || '');
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedData: Partial<UserProfile> = {
      name,
      headline,
      email,
      phone,
      location,
      bio,
      technicalSupportSkills,
      operatingSystemsSkills,
      networkingSkills,
      toolsSkills,
      languagesBackendSkills,
      databasesSkills,
      educationList,
      experienceList,
      projectsList,
      certificationsList,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      notionToken,
      notionDatabaseId
    };

    await saveUserProfile(updatedData);
    setProfileSaveSuccess(true);
    loadData();
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleRecreateResume = async () => {
    if (!fullProfile) return;
    setIsRecreating(true);
    try {
      const result = await generateAITailoredResume(fullProfile, {
        role: headline || fullProfile.headline || 'Software Engineer',
        company: 'Premier Tech Engineering Teams',
      });
      setFullProfile(result.tailoredProfile);
      await saveUserProfile(result.tailoredProfile);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to recreate resume:', err);
    } finally {
      setIsRecreating(false);
    }
  };

  // ─── Education Handlers ───
  const addEducation = () => {
    setEducationList([
      ...educationList,
      { institution: '', degree: '', cgpaOrGrade: '', location: '', years: '' }
    ]);
  };
  const updateEducation = (index: number, field: keyof EducationEntry, val: string) => {
    const updated = [...educationList];
    updated[index] = { ...updated[index], [field]: val };
    setEducationList(updated);
  };
  const removeEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  // ─── Experience Handlers ───
  const addExperience = () => {
    setExperienceList([
      ...experienceList,
      { company: '', role: '', location: '', dates: '', certificateUrl: '', bullets: [''] }
    ]);
  };
  const updateExperience = (index: number, field: keyof ExperienceEntry, val: any) => {
    const updated = [...experienceList];
    updated[index] = { ...updated[index], [field]: val };
    setExperienceList(updated);
  };
  const removeExperience = (index: number) => {
    setExperienceList(experienceList.filter((_, i) => i !== index));
  };
  const addExpBullet = (expIndex: number) => {
    const updated = [...experienceList];
    updated[expIndex].bullets.push('');
    setExperienceList(updated);
  };
  const updateExpBullet = (expIndex: number, bIndex: number, val: string) => {
    const updated = [...experienceList];
    updated[expIndex].bullets[bIndex] = val;
    setExperienceList(updated);
  };
  const removeExpBullet = (expIndex: number, bIndex: number) => {
    const updated = [...experienceList];
    updated[expIndex].bullets = updated[expIndex].bullets.filter((_, i) => i !== bIndex);
    setExperienceList(updated);
  };

  // ─── Project Handlers ───
  const addProject = () => {
    setProjectsList([
      ...projectsList,
      { title: '', githubUrl: '', bullets: [''] }
    ]);
  };
  const updateProject = (index: number, field: keyof ProjectEntry, val: any) => {
    const updated = [...projectsList];
    updated[index] = { ...updated[index], [field]: val };
    setProjectsList(updated);
  };
  const removeProject = (index: number) => {
    setProjectsList(projectsList.filter((_, i) => i !== index));
  };
  const addPrjBullet = (prjIndex: number) => {
    const updated = [...projectsList];
    updated[prjIndex].bullets.push('');
    setProjectsList(updated);
  };
  const updatePrjBullet = (prjIndex: number, bIndex: number, val: string) => {
    const updated = [...projectsList];
    updated[prjIndex].bullets[bIndex] = val;
    setProjectsList(updated);
  };
  const removePrjBullet = (prjIndex: number, bIndex: number) => {
    const updated = [...projectsList];
    updated[prjIndex].bullets = updated[prjIndex].bullets.filter((_, i) => i !== bIndex);
    setProjectsList(updated);
  };

  // ─── Certification Handlers ───
  const addCertification = () => {
    setCertificationsList([
      ...certificationsList,
      { title: '', certificateUrl: '', description: '' }
    ]);
  };
  const updateCertification = (index: number, field: keyof CertificationEntry, val: string) => {
    const updated = [...certificationsList];
    updated[index] = { ...updated[index], [field]: val };
    setCertificationsList(updated);
  };
  const removeCertification = (index: number) => {
    setCertificationsList(certificationsList.filter((_, i) => i !== index));
  };

  return (
    <div className="page-content w-full max-w-full px-3 sm:px-8 py-3 sm:py-6 pb-24 sm:pb-10 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-[860px] mx-auto space-y-5">
        
        {/* Top Header & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold font-display text-text-primary flex items-center space-x-2">
              <User className="h-5 w-5 text-cyan-400" />
              <span>Candidate Profile &amp; ATS Resume</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                Beta
              </span>
            </h2>
          </div>

          {/* Mode Switcher: Resume Preview ⇄ Edit Form (Stable Width Layout) */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="view-toggle">
              <button
                type="button"
                onClick={() => setActiveMode('preview')}
                className={`view-toggle-btn${activeMode === 'preview' ? ' active' : ''}`}
              >
                <FileText size={13} />
                <span>ATS Resume Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('edit')}
                className={`view-toggle-btn${activeMode === 'edit' ? ' active' : ''}`}
              >
                <Sliders size={13} />
                <span>Edit Profile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSaveProfile()}
              className={`btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5 font-bold transition-all cursor-pointer ${
                activeMode === 'edit' ? 'opacity-100' : 'hidden'
              }`}
              title="Save all candidate profile details"
            >
              <Save size={13} />
              <span>{profileSaveSuccess ? 'Saved!' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Beta Phase Notice Banner */}
        <div 
          className="p-3.5 px-4 rounded-xl border flex items-start space-x-3 text-xs leading-relaxed animate-fade-in"
          style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }}
        >
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
            <Sparkles size={15} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                <span>Candidate Profile &amp; ATS Resume Studio</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Beta Phase</span>
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-normal">
              This feature is currently in <strong>Beta Phase</strong>. We are actively refining real-time ATS resume generation, AI bullet tailoring, and LaTeX markup export. All candidate profile details are stored 100% locally on your device in IndexedDB. Please review your details and resume output before submitting job applications.
            </p>
          </div>
        </div>

        {/* Success Toast Banner */}
        {profileSaveSuccess && (
          <div className="p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <Check className="h-4 w-4 shrink-0" />
            <span>Candidate profile and ATS resume data updated successfully!</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 1: ATS LATEX / JAKE'S RESUME PAPER PREVIEW (Live State Bound)
            ══════════════════════════════════════════════════════════════ */}
        {activeMode === 'preview' && (
          <ResumePreview 
            profile={{
              ...(fullProfile || {}),
              name: name || fullProfile?.name || '',
              headline: headline || fullProfile?.headline || '',
              email: email || fullProfile?.email || '',
              phone: phone || fullProfile?.phone || '',
              location: location || fullProfile?.location || '',
              bio: bio !== undefined ? bio : (fullProfile?.bio || ''),
              technicalSupportSkills: technicalSupportSkills || fullProfile?.technicalSupportSkills || '',
              operatingSystemsSkills: operatingSystemsSkills || fullProfile?.operatingSystemsSkills || '',
              networkingSkills: networkingSkills || fullProfile?.networkingSkills || '',
              toolsSkills: toolsSkills || fullProfile?.toolsSkills || '',
              languagesBackendSkills: languagesBackendSkills || fullProfile?.languagesBackendSkills || '',
              databasesSkills: databasesSkills || fullProfile?.databasesSkills || '',
              educationList: educationList.length > 0 ? educationList : (fullProfile?.educationList || []),
              experienceList: experienceList.length > 0 ? experienceList : (fullProfile?.experienceList || []),
              projectsList: projectsList.length > 0 ? projectsList : (fullProfile?.projectsList || []),
              certificationsList: certificationsList.length > 0 ? certificationsList : (fullProfile?.certificationsList || []),
              linkedinUrl,
              githubUrl,
              portfolioUrl,
              experienceSummary: bio,
              education: educationList[0]?.institution || '',
              skills: fullProfile?.skills || [],
            }} 
            onRecreate={handleRecreateResume} 
            isRecreating={isRecreating} 
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2: DETAILED PROFILE EDIT FORM
            ══════════════════════════════════════════════════════════════ */}
        {activeMode === 'edit' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* SECTION 1: Personal & Contact Details */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>1. Personal &amp; Contact Details</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">Professional Headline *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer | Full Stack Developer"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex.smith@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91-9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>Location (City, Country)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <ExternalLink className="h-3 w-3 text-[#0A66C2]" />
                    <span>LinkedIn Profile URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <Code className="h-3 w-3" />
                    <span>GitHub Profile URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wider flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>Portfolio / Personal Website</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourportfolio.dev"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Professional Summary */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span>2. Professional Summary</span>
                </h3>
              </div>

              <textarea
                rows={4}
                placeholder="e.g. Passionate software engineer with experience building scalable web applications and distributed systems..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border rounded-xl p-3.5 text-xs text-text-primary focus:outline-none resize-none leading-relaxed"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              />
            </div>

            {/* SECTION 3: Education & Academics (Repeater) */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-amber-400" />
                  <span>3. Education &amp; Academics</span>
                </h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="btn-secondary text-xs px-3 py-1.5 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Education</span>
                </button>
              </div>

              <div className="space-y-3">
                {educationList.map((edu, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border space-y-3 relative group"
                    style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Education #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="text-text-muted hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove education"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Institution / College Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Stanford University / Indian Institute of Technology"
                          value={edu.institution}
                          onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Degree &amp; Major</label>
                        <input
                          type="text"
                          placeholder="e.g. B.S. / B.Tech in Computer Science"
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">CGPA / Grade / Percentage</label>
                        <input
                          type="text"
                          placeholder="e.g. 3.8/4.0 GPA or 85%"
                          value={edu.cgpaOrGrade}
                          onChange={(e) => updateEducation(idx, 'cgpaOrGrade', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Location</label>
                          <input
                            type="text"
                            placeholder="e.g. City, Country"
                            value={edu.location}
                            onChange={(e) => updateEducation(idx, 'location', e.target.value)}
                            className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Year Range</label>
                          <input
                            type="text"
                            placeholder="e.g. 2020 — 2024"
                            value={edu.years}
                            onChange={(e) => updateEducation(idx, 'years', e.target.value)}
                            className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: Categorized Core Skills (Jake's / ATS taxonomy) */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-emerald-400" />
                  <span>4. Categorized Core Skills Matrix</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Technical Support &amp; Systems</label>
                  <input
                    type="text"
                    value={technicalSupportSkills}
                    onChange={(e) => setTechnicalSupportSkills(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Operating Systems</label>
                  <input
                    type="text"
                    value={operatingSystemsSkills}
                    onChange={(e) => setOperatingSystemsSkills(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Networking &amp; Protocols</label>
                  <input
                    type="text"
                    value={networkingSkills}
                    onChange={(e) => setNetworkingSkills(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Tools &amp; CI/CD</label>
                  <input
                    type="text"
                    value={toolsSkills}
                    onChange={(e) => setToolsSkills(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Languages &amp; Backend Frameworks</label>
                  <input
                    type="text"
                    value={languagesBackendSkills}
                    onChange={(e) => setLanguagesBackendSkills(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">Databases &amp; Caching</label>
                  <input
                    type="text"
                    value={databasesSkills}
                    onChange={(e) => setDatabasesSkills(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: Work Experience & Internships (Repeater) */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  <span>5. Experience &amp; Internships</span>
                </h3>
                <button
                  type="button"
                  onClick={addExperience}
                  className="btn-secondary text-xs px-3 py-1.5 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Experience</span>
                </button>
              </div>

              <div className="space-y-4">
                {experienceList.map((exp, expIdx) => (
                  <div 
                    key={expIdx} 
                    className="p-4 rounded-xl border space-y-3 relative group"
                    style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Role #{expIdx + 1}: {exp.role || 'New Role'} at {exp.company || 'Company'}</span>
                      <button
                        type="button"
                        onClick={() => removeExperience(expIdx)}
                        className="text-text-muted hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove experience"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Company / Organization</label>
                        <input
                          type="text"
                          placeholder="e.g. Acme Tech Solutions / Google"
                          value={exp.company}
                          onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Role / Job Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Software Engineer Intern"
                          value={exp.role}
                          onChange={(e) => updateExperience(expIdx, 'role', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Location / Work Mode</label>
                        <input
                          type="text"
                          placeholder="e.g. Remote / San Francisco, CA"
                          value={exp.location}
                          onChange={(e) => updateExperience(expIdx, 'location', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Date Range</label>
                        <input
                          type="text"
                          placeholder="e.g. Jun 2023 — Aug 2023"
                          value={exp.dates}
                          onChange={(e) => updateExperience(expIdx, 'dates', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Certificate / Verification URL (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://certificate.link"
                          value={exp.certificateUrl || ''}
                          onChange={(e) => updateExperience(expIdx, 'certificateUrl', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>
                    </div>

                    {/* Bullets List */}
                    <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-text-muted uppercase">Accomplishment Bullets</label>
                        <button
                          type="button"
                          onClick={() => addExpBullet(expIdx)}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>Add Bullet Point</span>
                        </button>
                      </div>

                      {exp.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-text-muted text-xs">•</span>
                          <input
                            type="text"
                            placeholder="e.g. Diagnosed and resolved application bugs, UI issues, and data-flow errors..."
                            value={b}
                            onChange={(e) => updateExpBullet(expIdx, bIdx, e.target.value)}
                            className="flex-1 border rounded-lg px-3 py-1 text-xs text-text-primary focus:outline-none"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeExpBullet(expIdx, bIdx)}
                            className="text-text-muted hover:text-danger p-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 6: Technical Projects (Repeater) */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <FolderGit2 className="h-4 w-4 text-blue-400" />
                  <span>6. Technical Projects</span>
                </h3>
                <button
                  type="button"
                  onClick={addProject}
                  className="btn-secondary text-xs px-3 py-1.5 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-4">
                {projectsList.map((prj, prjIdx) => (
                  <div 
                    key={prjIdx} 
                    className="p-4 rounded-xl border space-y-3 relative group"
                    style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Project #{prjIdx + 1}: {prj.title || 'New Project'}</span>
                      <button
                        type="button"
                        onClick={() => removeProject(prjIdx)}
                        className="text-text-muted hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Project Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Cloud Task Management & Analytics Platform"
                          value={prj.title}
                          onChange={(e) => updateProject(prjIdx, 'title', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">GitHub Repository URL</label>
                        <input
                          type="url"
                          placeholder="https://github.com/username/project-repo"
                          value={prj.githubUrl || ''}
                          onChange={(e) => updateProject(prjIdx, 'githubUrl', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>
                    </div>

                    {/* Bullets List */}
                    <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-text-muted uppercase">Project Bullets &amp; Metrics</label>
                        <button
                          type="button"
                          onClick={() => addPrjBullet(prjIdx)}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>Add Bullet Point</span>
                        </button>
                      </div>

                      {prj.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <span className="text-text-muted text-xs">•</span>
                          <input
                            type="text"
                            placeholder="e.g. Built a real-time collaborative web application with React, TypeScript & Node.js..."
                            value={b}
                            onChange={(e) => updatePrjBullet(prjIdx, bIdx, e.target.value)}
                            className="flex-1 border rounded-lg px-3 py-1 text-xs text-text-primary focus:outline-none"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removePrjBullet(prjIdx, bIdx)}
                            className="text-text-muted hover:text-danger p-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 7: Certifications & Accomplishments (Repeater) */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                  <Award className="h-4 w-4 text-rose-400" />
                  <span>7. Certifications &amp; Accomplishments</span>
                </h3>
                <button
                  type="button"
                  onClick={addCertification}
                  className="btn-secondary text-xs px-3 py-1.5 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Certification</span>
                </button>
              </div>

              <div className="space-y-3">
                {certificationsList.map((cert, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border space-y-3 relative group"
                    style={{ background: 'var(--bg-surface-raised)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">Certification #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCertification(idx)}
                        className="text-text-muted hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove certification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Certification Title</label>
                        <input
                          type="text"
                          placeholder="e.g. AWS Certified Solutions Architect / Meta Frontend Developer"
                          value={cert.title}
                          onChange={(e) => updateCertification(idx, 'title', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Certificate Link (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://certificate.link"
                          value={cert.certificateUrl || ''}
                          onChange={(e) => updateCertification(idx, 'certificateUrl', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[9px] font-bold text-text-muted uppercase block mb-1">Short Description / Core Domains</label>
                        <input
                          type="text"
                          placeholder="e.g. Cloud architecture, distributed systems, and modern web application development"
                          value={cert.description}
                          onChange={(e) => updateCertification(idx, 'description', e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 8: Notion Automation Integration */}
            <div className="card p-6 space-y-4 shadow-xl border hover:border-cyan-500/30 transition-all duration-200" style={{ background: 'var(--bg-card)' }}>
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center space-x-2">
                <Share2 className="h-4 w-4 text-cyan-400" />
                <span>8. Notion Pipeline Integration</span>
              </h3>
              <p className="text-xs text-text-muted">
                Connect your Notion database to synchronize your application pipeline with 1 click.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-text-muted uppercase block mb-1 flex items-center space-x-1">
                    <Key size={11} />
                    <span>Notion Internal Integration Token</span>
                  </label>
                  <input
                    type="password"
                    placeholder="secret_xxxxxxxxxxxxxxxxxxxxxx"
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs font-mono text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-text-muted uppercase block mb-1 flex items-center space-x-1">
                    <Globe size={11} />
                    <span>Notion Database ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1a2b3c4d5e6f..."
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    className="w-full border rounded-xl px-4 py-2 text-xs font-mono text-text-primary focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-3 pb-8">
              <button
                type="submit"
                className="btn-primary text-xs px-8 py-3 font-bold flex items-center space-x-2 text-sm shadow-lg cursor-pointer"
              >
                <Save size={16} />
                <span>{profileSaveSuccess ? 'Saved!' : 'Save Complete Profile'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
