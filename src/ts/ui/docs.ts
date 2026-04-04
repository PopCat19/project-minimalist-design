// ui-docs.ts
//
// Purpose: Manages documentation sidebar and doc loading in the UI
//
// This module:
// - Lists available documentation files
// - Renders doc sidebar and handles doc menu toggling
// - Loads and displays doc content on demand
import { showToast } from './render';

interface DocItem {
    name: string;
    path: string;
}

const pmdDocs: DocItem[] = [
    { name: 'Overview', path: 'doc/overview.txt' },
    { name: 'Variables', path: 'doc/variables.txt' },
    { name: 'Usage Guidelines', path: 'doc/usage.txt' },
    { name: 'Palette Mapping', path: 'doc/palettes.txt' },
    { name: 'Hierarchy Rules', path: 'doc/hierarchy.txt' },
    { name: 'Nix Integration', path: 'doc/nix/overview.txt' },
    { name: 'Conventions', path: 'doc/conventions.txt' },
];

let docsOpen = false;

export { pmdDocs };

export function toggleDocs(): void {
    const overlay = document.getElementById('docsOverlay');
    if (!overlay) return;
    docsOpen = !docsOpen;
    overlay.style.display = docsOpen ? 'flex' : 'none';
    document.body.classList.toggle('no-scroll', docsOpen);
    if (docsOpen && document.getElementById('docSidebar')?.children.length === 0) {
        renderDocSidebar();
    }
}

export function toggleDocMenu(): void {
    const sidebar = document.getElementById('docSidebar');
    const backdrop = document.getElementById('docBackdrop');
    const isOpen = sidebar?.classList.toggle('open');
    backdrop?.classList.toggle('show', isOpen ?? false);
}

export function renderDocSidebar(): void {
    const sidebar = document.getElementById('docSidebar');
    if (!sidebar) return;
    sidebar.innerHTML = pmdDocs.map(doc => `
        <button class="export-btn doc-nav-btn" data-path="${doc.path}" style="text-align: left; justify-content: flex-start;">
            <span class="material-symbols-rounded" style="font-size: 1.125rem;">description</span>
            ${doc.name}
        </button>
    `).join('');

    sidebar.querySelectorAll('.doc-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const path = (btn as HTMLElement).dataset.path || '';
            loadDoc(path);
        });
    });
}

export async function loadDoc(path: string): Promise<void> {
    const viewer = document.getElementById('docViewer');
    if (!viewer) return;

    document.querySelectorAll('.doc-nav-btn').forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.path === path);
    });

    document.getElementById('docSidebar')?.classList.remove('open');

    if (window.location.protocol === 'file:') {
        viewer.innerHTML = `
            <div style="max-width: 750px; margin: 0 auto; white-space: normal; border: 0.125rem solid var(--base08); border-radius: 1rem; background: var(--base01); overflow: hidden;">
                <div style="background: var(--base08); color: var(--base00); padding: 0.875rem 1.5rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
                    <span class="material-symbols-rounded" style="font-size: 1.25rem;">security</span>
                    <span style="letter-spacing: 0.05em; font-size: 0.8125rem;">LOCAL_SECURITY_RESTRICTION</span>
                    <span style="width: 1.25rem;"></span>
                </div>
                <div style="padding: 2rem;">
                    <p style="margin-bottom: 1.5rem; color: var(--base05); font-weight: 500;">
                        Browsers block <code style="color: var(--base08); background: var(--base00); padding: 0.125rem 0.375rem; border-radius: 0.5rem;">fetch()</code> requests on the <code style="color: var(--base08); background: var(--base00); padding: 0.125rem 0.375rem; border-radius: 0.5rem;">file:///</code> protocol.
                        To view documentation locally, you must serve the directory via HTTP.
                    </p>
                    <div style="background: var(--base00); border: 0.125rem solid var(--base02); border-radius: 0.75rem; padding: 1.5rem; font-family: 'FiraCode Nerd Font', monospace;">
                        <div style="color: var(--base03); margin-bottom: 0.75rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">$ python3 -m http.server 8080</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    viewer.innerHTML = '<div style="max-width: 850px; margin: 0 auto; color: var(--base03)">Fetching document...</div>';
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('File not found');
        const text = await response.text();
        const cleanText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        viewer.innerHTML = `<div style="max-width: 850px; margin: 0 auto;">${cleanText}</div>`;
        viewer.scrollTop = 0;
    } catch {
        viewer.innerHTML = `<div style="max-width: 850px; margin: 0 auto; color: var(--base08);">Error: Failed to load ${path}. Ensure the /doc directory exists.</div>`;
    }
}