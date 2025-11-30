# 🔧 npm install Xatoliklarini Hal Qilish

## ❌ Xatolik: "An error occured during installation of modules"

Bu xatolik hostingda `npm install` qilayotganda yuzaga keladi.

## ✅ Yechimlar (Qadam-baqadam):

### 1️⃣ SSH orqali Serverni Ulang

```bash
ssh user@your-server.com
cd /home/doctorsi/Royalnuts
```

### 2️⃣ Eski Fayllarni Tozalash

```bash
# package-lock.json ni o'chirish
rm -f package-lock.json

# node_modules ni o'chirish
rm -rf node_modules

# npm cache tozalash
npm cache clean --force
```

### 3️⃣ .npmrc Faylini Tekshirish

`.npmrc` fayl yaratilgan (loyihada mavjud). U quyidagilarni o'z ichiga oladi:
```
legacy-peer-deps=true
fund=false
audit=false
```

### 4️⃣ Dependencies O'rnatish

#### Variant A: Oddiy o'rnatish
```bash
npm install
```

#### Variant B: Legacy peer deps bilan
```bash
npm install --legacy-peer-deps
```

#### Variant C: Production mode (nodemon o'rnatilmaydi)
```bash
npm install --production
```

#### Variant D: Verbose mode (xatoliklarni ko'rish uchun)
```bash
npm install --verbose 2>&1 | tee install.log
cat install.log
```

### 5️⃣ Agar Hali Ham Xatolik Bo'lsa

#### Har bir paketni alohida o'rnatish:
```bash
npm install express@4.18.2 --save
npm install cors@2.8.5 --save
npm install axios@1.6.7 --save
npm install dotenv@16.3.1 --save
npm install pg@8.11.3 --save
```

#### Memory limit oshirish:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm install
```

#### npm versiyasini yangilash:
```bash
npm install -g npm@latest
npm install
```

## 🔍 Xatolik Turlari va Yechimlari

### Xatolik: "ENOSPC: no space left on device"
```bash
# Disk bo'sh joyini tekshirish
df -h

# node_modules ni o'chirish
rm -rf node_modules
npm install --production
```

### Xatolik: "EACCES: permission denied"
```bash
# Permissions ni tuzatish
chmod -R 755 .
npm install
```

### Xatolik: "ETIMEDOUT" yoki "ECONNRESET"
```bash
# npm registry ni tekshirish
npm config get registry

# Agar muammo bo'lsa, registry ni o'zgartirish
npm config set registry https://registry.npmjs.org/
npm install
```

### Xatolik: "peer dependency" xatoliklari
```bash
# .npmrc faylida legacy-peer-deps=true bor
# Yoki qo'lda:
npm install --legacy-peer-deps
```

## ✅ Tekshirish

O'rnatishdan keyin:

```bash
# node_modules mavjudligini tekshirish
ls -la node_modules

# Express o'rnatilganini tekshirish
node -e "console.log(require('express'))"

# Server ishga tushirish
npm start
# yoki
node server.js
```

## 📋 Hosting Panel orqali

Agar hosting panel orqali `npm install` qilayotgan bo'lsangiz:

1. **Node.js versiyasini tanlang**: 18, 20 yoki 22
2. **SSH orqali qo'lda o'rnatish** (tavsiya etiladi)
3. **Memory limit oshiring** (agar mumkin bo'lsa)
4. **Timeout oshiring** (agar mumkin bo'lsa)

## 🎯 Eng Yaxshi Yechim

**SSH orqali qo'lda o'rnatish** - bu eng ishonchli usul:

```bash
ssh user@server
cd /home/doctorsi/Royalnuts
rm -rf package-lock.json node_modules
npm cache clean --force
npm install --legacy-peer-deps
npm start
```

## 📞 Qo'shimcha Yordam

Agar hali ham muammo bo'lsa:

1. **npm install log faylini ko'ring**:
   ```bash
   npm install --verbose 2>&1 | tee npm-install.log
   cat npm-install.log
   ```

2. **Node.js va npm versiyalarini tekshiring**:
   ```bash
   node --version  # 16+ bo'lishi kerak
   npm --version   # 8+ bo'lishi kerak
   ```

3. **Disk va memory holatini tekshiring**:
   ```bash
   df -h
   free -h
   ```

4. **Hosting provayder bilan bog'laning** - ular yordam berishi mumkin.

