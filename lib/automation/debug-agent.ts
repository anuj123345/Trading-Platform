import fs from 'fs';
import path from 'path';

export interface DebugReport {
    file: string;
    issue: string;
    fixed: boolean;
    type: 'missing_client_directive' | 'hydration_mismatch' | 'other';
}

const REACT_HOOKS = [
    'useState', 'useEffect', 'useContext', 'useCallback', 'useMemo',
    'useReducer', 'useRef', 'useLayoutEffect', 'useImperativeHandle',
    'useRouter', 'usePathname', 'useSearchParams'
];

/**
 * Scans the codebase for common mistakes and applies auto-fixes.
 */
export async function runMistakeGuardian(baseDir: string = process.cwd()): Promise<DebugReport[]> {
    const reports: DebugReport[] = [];
    const targetDirs = [
        path.join(baseDir, 'app'),
        path.join(baseDir, 'components')
    ];

    for (const dir of targetDirs) {
        if (fs.existsSync(dir)) {
            scanDirectory(dir, reports);
        }
    }

    return reports;
}

function scanDirectory(dir: string, reports: DebugReport[]) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath, reports);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            checkFile(fullPath, reports);
        }
    }
}

function checkFile(filePath: string, reports: DebugReport[]) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const hasClientDirective = lines.some(line => line.includes('"use client"') || line.includes("'use client'"));

    let needsFixed = false;
    let issueFound = '';

    // 1. Check for missing "use client" when hooks are present
    const containsHooks = REACT_HOOKS.some(hook => content.includes(hook));

    if (containsHooks && !hasClientDirective) {
        issueFound = 'Missing "use client" directive while using React hooks.';

        // Auto-fix: Insert at the top
        content = `"use client";\n${content}`;
        fs.writeFileSync(filePath, content);

        reports.push({
            file: path.relative(process.cwd(), filePath),
            issue: issueFound,
            fixed: true,
            type: 'missing_client_directive'
        });
        return; // File modified, move to next
    }

    // 2. Check for potential hydration mismatches (simplified pattern)
    // Look for toLocaleTimeString() or new Date() direct usage in JSX
    const hydrationMismatchPatterns = [
        /\.toLocaleTimeString\(\)/,
        /\.toLocaleDateString\(\)/,
        /new Date\(\)\.getHours\(\)/
    ];

    const hasHydrationMismatch = hydrationMismatchPatterns.some(pattern => pattern.test(content));

    if (hasHydrationMismatch) {
        // We don't auto-fix this easily as it requires architectural changes (useEffect)
        // But we flag it
        reports.push({
            file: path.relative(process.cwd(), filePath),
            issue: 'Potential hydration mismatch detected (direct date/time usage in component).',
            fixed: false,
            type: 'hydration_mismatch'
        });
    }
}
