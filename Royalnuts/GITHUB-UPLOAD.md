# 📤 GitHub'ga Yuklash Qo'llanmasi

## 1️⃣ Git O'rnatish (Agar yo'q bo'lsa)

### Windows:
1. [Git for Windows](https://git-scm.com/download/win) ni yuklab oling
2. O'rnating va kompyuterni qayta ishga tushiring

### Yoki Chocolatey orqali:
```powershell
choco install git
```

## 2️⃣ Git Repository Yaratish va GitHub'ga Yuklash

### Qadam 1: Git Repository Yaratish

```bash
# Git repository'ni boshlash
git init

# .gitignore fayl yaratish (muhim!)
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo .npm/ >> .gitignore
echo *.log >> .gitignore
echo .DS_Store >> .gitignore
```

### Qadam 2: Barcha Fayllarni Qo'shish

```bash
# Barcha fayllarni staging area'ga qo'shish
git add .

# Yoki faqat kerakli fayllarni:
git add package.json server.js index.html .npmrc
git add *.css *.js *.html
# (rasmlar va boshqa fayllar)
```

### Qadam 3: Birinchi Commit

```bash
# Commit yaratish
git commit -m "Initial commit: Royal Nuts e-commerce website"
```

### Qadam 4: GitHub Repository'ga Ulash

```bash
# Remote repository qo'shish
git remote add origin https://github.com/abushshsgi/roynut.git

# Yoki SSH orqali (agar SSH key sozlangan bo'lsa):
# git remote add origin git@github.com:abushshsgi/roynut.git
```

### Qadam 5: GitHub'ga Push Qilish

```bash
# Main branch'ga push qilish
git branch -M main
git push -u origin main
```

## 3️⃣ To'liq Buyruqlar Ketma-ketligi

```bash
# 1. Git repository yaratish
git init

# 2. .gitignore yaratish
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo .npm/ >> .gitignore
echo *.log >> .gitignore
echo .DS_Store >> .gitignore

# 3. Barcha fayllarni qo'shish
git add .

# 4. Commit yaratish
git commit -m "Initial commit: Royal Nuts e-commerce website"

# 5. GitHub'ga ulash
git remote add origin https://github.com/abushshsgi/roynut.git

# 6. Push qilish
git branch -M main
git push -u origin main
```

## 4️⃣ .gitignore Fayl Yaratish

`.gitignore` fayl yaratib, quyidagilarni qo'shing:

```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db
desktop.ini

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/

# Temporary files
*.tmp
*.temp
.cache/
```

## 5️⃣ Keyingi O'zgarishlarni Yuklash

Keyinchalik o'zgarishlar qilganda:

```bash
# O'zgarishlarni ko'rish
git status

# O'zgarishlarni qo'shish
git add .

# Commit yaratish
git commit -m "Description of changes"

# GitHub'ga push qilish
git push
```

## 6️⃣ GitHub Authentication

Agar authentication muammosi bo'lsa:

### Personal Access Token (Tavsiya etiladi):

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" ni bosing
3. `repo` scope'ni tanlang
4. Token'ni nusxalang
5. Push qilganda password o'rniga token'ni kiriting

### Yoki SSH Key:

```bash
# SSH key yaratish
ssh-keygen -t ed25519 -C "your_email@example.com"

# Public key'ni ko'rish
cat ~/.ssh/id_ed25519.pub

# GitHub → Settings → SSH and GPG keys → New SSH key
# Public key'ni qo'shing
```

## 7️⃣ Muammolarni Hal Qilish

### Xatolik: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/abushshsgi/roynut.git
```

### Xatolik: "failed to push some refs"
```bash
# Avval pull qiling
git pull origin main --allow-unrelated-histories
# Keyin push qiling
git push -u origin main
```

### Xatolik: Authentication failed
- Personal Access Token ishlatish
- Yoki SSH key sozlash

## ✅ Tekshirish

GitHub'da repository'ni ochib, barcha fayllar yuklanganini tekshiring:
https://github.com/abushshsgi/roynut

## 📝 Eslatma

- `.env` faylini **hech qachon** GitHub'ga yuklamang!
- `node_modules` ni yuklamang (`.gitignore` da bo'lishi kerak)
- Sensitive ma'lumotlarni yuklamang

