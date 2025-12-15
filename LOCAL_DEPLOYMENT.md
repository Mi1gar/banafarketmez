# Lokal Sunucu ile Dışarıdan Erişim Rehberi

Bu rehber, sunucuyu lokal bilgisayarınızda çalıştırıp başka yerlerden erişilebilir hale getirmek için gereken adımları açıklar.

## Gereksinimler

1. **Port Forwarding**: Router'ınızda port yönlendirme yapılmalı
2. **Public IP Adresi**: İnternet servis sağlayıcınızın verdiği public IP
3. **Firewall Ayarları**: Windows/Linux firewall'unda port açık olmalı

## Adım Adım Kurulum

### 1. Sunucuyu Başlatma

```bash
npm run dev
```

Veya production modunda:
```bash
npm run build
npm start
```

Sunucu varsayılan olarak `http://0.0.0.0:3000` adresinde çalışacaktır.

### 2. Public IP Adresinizi Öğrenme

Public IP adresinizi öğrenmek için:
- https://whatismyipaddress.com/ adresini ziyaret edin
- Veya terminal'de: `curl ifconfig.me`

### 3. Router'da Port Forwarding

1. Router yönetim paneline giriş yapın (genellikle `192.168.1.1` veya `192.168.0.1`)
2. "Port Forwarding" veya "Virtual Server" bölümüne gidin
3. Yeni bir kural ekleyin:
   - **External Port**: 3000 (veya istediğiniz port)
   - **Internal IP**: Bilgisayarınızın yerel IP adresi (örn: `192.168.1.100`)
   - **Internal Port**: 3000
   - **Protocol**: TCP (veya Both)

### 4. Firewall Ayarları

#### Windows:
1. Windows Defender Firewall'u açın
2. "Advanced settings" > "Inbound Rules" > "New Rule"
3. "Port" seçin > "TCP" > "Specific local ports: 3000"
4. "Allow the connection" seçin
5. Tüm profilleri seçin (Domain, Private, Public)
6. İsim verin ve kaydedin

#### Linux (ufw):
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

#### macOS:
1. System Preferences > Security & Privacy > Firewall
2. Firewall Options > "+" butonuna tıklayın
3. Node.js uygulamasını ekleyin

### 5. Environment Variables

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SOCKET_URL=http://YOUR_PUBLIC_IP:3000
PORT=3000
HOSTNAME=0.0.0.0
```

**ÖNEMLİ**: `YOUR_PUBLIC_IP` yerine kendi public IP adresinizi yazın.

### 6. Test Etme

1. Sunucuyu başlatın: `npm run dev`
2. Başka bir cihazdan (telefon, başka bilgisayar) şu adresi açın:
   ```
   http://YOUR_PUBLIC_IP:3000
   ```
3. Eğer bağlanamıyorsanız:
   - Router ayarlarını kontrol edin
   - Firewall ayarlarını kontrol edin
   - Public IP'nin doğru olduğundan emin olun

## Alternatif: ngrok Kullanımı (Daha Kolay)

Port forwarding yapmak istemiyorsanız, ngrok kullanabilirsiniz:

### 1. ngrok Kurulumu

```bash
# Windows (Chocolatey)
choco install ngrok

# macOS (Homebrew)
brew install ngrok

# Veya https://ngrok.com/download adresinden indirin
```

### 2. ngrok ile Tünel Oluşturma

```bash
ngrok http 3000
```

Bu komut size bir URL verecek (örn: `https://abc123.ngrok.io`)

### 3. Environment Variable

`.env.local` dosyasında:
```env
NEXT_PUBLIC_SOCKET_URL=https://abc123.ngrok.io
```

**NOT**: ngrok ücretsiz planında URL her yeniden başlatmada değişir. Sabit URL için ücretli plan gerekir.

## Güvenlik Uyarıları

⚠️ **ÖNEMLİ**: Lokal sunucunuzu internete açmak güvenlik riski oluşturur:

1. **Sadece güvendiğiniz kişilerle paylaşın**
2. **Production'da kullanmayın** - Sadece test için
3. **HTTPS kullanın** (Let's Encrypt veya ngrok HTTPS)
4. **Rate limiting ekleyin** (gelecekte)
5. **Authentication ekleyin** (gelecekte)

## Sorun Giderme

### Bağlanamıyorum
- Router port forwarding ayarlarını kontrol edin
- Firewall ayarlarını kontrol edin
- Public IP'nin doğru olduğundan emin olun
- ISP'niz port 3000'i engelliyor olabilir (farklı port deneyin)

### Socket.io bağlanmıyor
- `NEXT_PUBLIC_SOCKET_URL` environment variable'ının doğru olduğundan emin olun
- Browser console'da hata mesajlarını kontrol edin
- CORS ayarlarını kontrol edin

### Port zaten kullanılıyor
- Farklı bir port kullanın (örn: 3001)
- Port forwarding ve environment variable'ları güncelleyin

## Örnek Yapılandırma

### .env.local
```env
NEXT_PUBLIC_SOCKET_URL=http://123.45.67.89:3000
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=development
```

### Router Port Forwarding
```
External Port: 3000
Internal IP: 192.168.1.100
Internal Port: 3000
Protocol: TCP
```

## İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

