import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'safelaunch';
const OWNER = 'dozzlime06';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.cache',
  '.config',
  '.upm',
  'package-lock.json',
  '.local',
  'attached_assets',
  'tmp',
  '.breakpoints',
];

async function getAccessToken(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit environment not available');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  const connectionSettings = data.items?.[0];
  const accessToken = connectionSettings?.settings?.access_token || 
                      connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!accessToken) {
    throw new Error('GitHub not connected. Please connect GitHub in the Replit integrations.');
  }
  
  return accessToken;
}

async function githubApi(token: string, endpoint: string, method: string = 'GET', body?: any) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${text}`);
  }
  
  if (response.status === 404) {
    return null;
  }
  
  return response.json();
}

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    if (item.startsWith('.')) continue;
    
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, baseDir));
      } else if (stat.size < 1000000) {
        files.push(relativePath);
      }
    } catch {
      // Skip files we can't read
    }
  }
  
  return files;
}

async function main() {
  console.log('🚀 Starting GitHub push...');
  
  try {
    const token = await getAccessToken();
    console.log('✅ GitHub token obtained');
    
    // Check if repo exists
    let repo = await githubApi(token, `/repos/${OWNER}/${REPO_NAME}`);
    
    if (!repo) {
      console.log(`📦 Creating repository ${REPO_NAME}...`);
      repo = await githubApi(token, '/user/repos', 'POST', {
        name: REPO_NAME,
        description: 'SafeLaunch - Token launch platform on Base network',
        private: false,
        auto_init: true,
      });
      console.log('✅ Repository created');
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log(`✅ Repository ${OWNER}/${REPO_NAME} exists`);
    }
    
    // Get all files
    const projectDir = process.cwd();
    const files = getAllFiles(projectDir);
    console.log(`📁 Found ${files.length} files to upload`);
    
    // Get the default branch ref
    let baseSha: string | null = null;
    let treeSha: string | null = null;
    
    const mainRef = await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/ref/heads/main`);
    if (mainRef) {
      baseSha = mainRef.object.sha;
      const commit = await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/commits/${baseSha}`);
      treeSha = commit.tree.sha;
      console.log(`✅ Got base commit: ${baseSha.slice(0, 7)}`);
    }
    
    // Create blobs for all files
    console.log('📤 Uploading files...');
    const treeItems: Array<{path: string, mode: string, type: string, sha: string}> = [];
    
    let uploaded = 0;
    for (const file of files) {
      try {
        const filePath = path.join(projectDir, file);
        const content = fs.readFileSync(filePath);
        
        const blob = await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/blobs`, 'POST', {
          content: content.toString('base64'),
          encoding: 'base64',
        });
        
        treeItems.push({
          path: file,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
        
        uploaded++;
        if (uploaded % 20 === 0) {
          console.log(`   Uploaded ${uploaded}/${files.length} files...`);
        }
      } catch (err) {
        console.log(`   ⚠️ Skipped: ${file}`);
      }
    }
    
    console.log(`✅ Uploaded ${uploaded} files`);
    
    // Create new tree
    console.log('🌳 Creating tree...');
    const treePayload: any = { tree: treeItems };
    if (treeSha) {
      treePayload.base_tree = treeSha;
    }
    const newTree = await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/trees`, 'POST', treePayload);
    
    // Create commit
    console.log('💾 Creating commit...');
    const commitPayload: any = {
      message: 'SafeLaunch: Ready for Vercel deployment',
      tree: newTree.sha,
    };
    if (baseSha) {
      commitPayload.parents = [baseSha];
    } else {
      commitPayload.parents = [];
    }
    const newCommit = await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/commits`, 'POST', commitPayload);
    
    // Update or create ref
    console.log('🔗 Updating branch...');
    if (baseSha) {
      await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/refs/heads/main`, 'PATCH', {
        sha: newCommit.sha,
        force: true,
      });
    } else {
      await githubApi(token, `/repos/${OWNER}/${REPO_NAME}/git/refs`, 'POST', {
        ref: 'refs/heads/main',
        sha: newCommit.sha,
      });
    }
    
    console.log('');
    console.log('✅ ✅ ✅ SUCCESS! ✅ ✅ ✅');
    console.log(`🔗 Repository: https://github.com/${OWNER}/${REPO_NAME}`);
    console.log('');
    console.log('Next steps for Vercel:');
    console.log('1. Go to https://vercel.com/new');
    console.log('2. Import the safelaunch repository');
    console.log('3. Set Framework Preset to "Vite"');
    console.log('4. Deploy!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
