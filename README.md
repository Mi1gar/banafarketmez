# Banafarketmez - Online Oyun Platformu

Render.com üzerinde çalışan, multiplayer oyunlar içeren modern bir web platformu.

## Özellikler

- 🎮 **3 Farklı Oyun**: Taş Kağıt Makas, Tic Tac Toe, Sayı Tahmin Oyunu
- 👥 **Multiplayer Desteği**: Gerçek zamanlı çok oyunculu oyun deneyimi
- 🎯 **Lobi Sistemi**: Kullanıcılar lobi oluşturup diğer oyuncularla eşleşebilir
- 💾 **Kullanıcı Adı Sistemi**: LocalStorage ile kullanıcı adı saklama
- ⚡ **Gerçek Zamanlı**: WebSocket (Socket.io) ile anlık senkronizasyon

## Teknolojiler

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io
- **Deployment**: Render.com

## Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn

### Yerel Geliştirme

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### Production Build

```bash
npm run build
npm start
```

## Kullanım

1. Siteye ilk girişte kullanıcı adınızı girin
2. Ana sayfadan bir oyun seçin
3. "Lobi Oluştur" veya "Lobilere Katıl" butonlarına tıklayın
4. Lobi odasında diğer oyuncuyu bekleyin
5. Oyun başladığında eğlenin!

## Oyunlar

### Taş Kağıt Makas
Klasik taş kağıt makas oyunu. Rakibinizi yenmeye çalışın!

### Tic Tac Toe
3x3 grid üzerinde X ve O ile oynanan strateji oyunu.

### Sayı Tahmin Oyunu
Bir oyuncu sayı seçer, diğeri tahmin eder. İpuçları ile yardımcı olunur.

## Lokal Sunucu ile Dışarıdan Erişim

Sunucuyu lokal bilgisayarınızda çalıştırıp başka yerlerden erişilebilir hale getirmek için [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) dosyasına bakın.

**Hızlı Başlangıç (ngrok ile):**
```bash
# 1. Sunucuyu başlat
npm run dev

# 2. Başka bir terminal'de ngrok başlat
ngrok http 3000

# 3. .env.local dosyası oluştur ve ngrok URL'ini ekle
echo "NEXT_PUBLIC_SOCKET_URL=https://YOUR_NGROK_URL" > .env.local
```

## Deployment

Bu proje Render.com üzerinde deploy edilmiştir. `render.yaml` dosyası deployment yapılandırmasını içerir.

### Render.com Deployment Adımları

1. Render.com hesabınıza giriş yapın
2. Yeni bir Web Service oluşturun
3. GitHub repository'nizi bağlayın
4. Build ve start komutları otomatik olarak `render.yaml`'dan alınacaktır
5. Environment variables gerekirse Render dashboard'dan ekleyin

## Proje Yapısı

```
banafarketmez/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── games/             # Oyun sayfaları
│   └── page.tsx           # Ana sayfa
├── components/            # React component'leri
│   ├── games/            # Oyun component'leri
│   └── ui/               # UI component'leri
├── lib/                   # Utility fonksiyonları
├── public/                # Statik dosyalar
└── server.js             # Custom server (Socket.io)
```

## Lisans

Bu proje özel bir projedir.

## İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.



