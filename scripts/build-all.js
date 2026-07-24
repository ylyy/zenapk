import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('📦 Building fruit game...');
execSync('npm run build', { cwd: path.join(rootDir, 'fruit'), stdio: 'inherit' });

console.log('📦 Building badminton game...');
execSync('npm run build', { cwd: path.join(rootDir, 'badminton-game'), stdio: 'inherit' });

console.log('📦 Building saiyan game...');
execSync('npm run build', { cwd: path.join(rootDir, 'saiyan'), stdio: 'inherit' });

console.log('📂 Copying game dist outputs...');
fs.cpSync(path.join(rootDir, 'fruit', 'dist'), path.join(distDir, 'fruit'), { recursive: true });
fs.cpSync(path.join(rootDir, 'badminton-game', 'dist'), path.join(distDir, 'badminton'), { recursive: true });
fs.cpSync(path.join(rootDir, 'saiyan', 'dist'), path.join(distDir, 'saiyan'), { recursive: true });

console.log('📄 Copying hub index.html...');
if (fs.existsSync(path.join(rootDir, 'index.html'))) {
  fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
}

console.log('✅ Build all complete!');
