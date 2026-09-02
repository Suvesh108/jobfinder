import type { JobApplication } from '../db/schema';

export function exportToNotionCSV(jobs: JobApplication[]): void {
  const headers = ['Company', 'Role', 'Status', 'Location', 'Salary', 'Date Applied', 'Source', 'Notes', 'Tags', 'Link'];
  const rows = jobs.map(j => [
    `"${(j.company || '').replace(/"/g, '""')}"`,
    `"${(j.role || '').replace(/"/g, '""')}"`,
    `"${j.status}"`,
    `"${(j.location || '').replace(/"/g, '""')}"`,
    `"${(j.salary || '').replace(/"/g, '""')}"`,
    `"${j.dateApplied || ''}"`,
    `"${(j.sourceSite || '').replace(/"/g, '""')}"`,
    `"${(j.notes || '').replace(/"/g, '""')}"`,
    `"${(j.tags || []).join(', ')}"`,
    `"${(j.link || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobfinder_notion_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function syncToNotionAPI(
  jobs: JobApplication[],
  token: string,
  databaseId: string
): Promise<{ success: boolean; message: string }> {
  if (!token.trim() || !databaseId.trim()) {
    return {
      success: false,
      message: 'Notion Integration Token and Database ID must be configured in Settings.'
    };
  }

  try {
    const pythonUrl = (import.meta.env.VITE_PYTHON_BACKEND_URL as string)?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
    const response = await fetch(`${pythonUrl}/sync/notion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.trim(),
        database_id: databaseId.trim(),
        jobs: jobs.map(j => ({
          company: j.company,
          role: j.role,
          status: j.status,
          location: j.location,
          salary: j.salary,
          dateApplied: j.dateApplied,
          sourceSite: j.sourceSite,
          notes: j.notes,
          link: j.link
        }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message || `Successfully synced ${jobs.length} applications to Notion!` };
    }
  } catch (e) {
    // Fallback if backend proxy not online
  }

  // Graceful fallback to CSV export
  exportToNotionCSV(jobs);
  return {
    success: true,
    message: 'Exported pipeline as Notion-formatted CSV file ready for instant drag-and-drop import!'
  };
}
