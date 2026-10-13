# 3D BFS: THE LAST SIGNAL

> *"Har bir yo'l bitta qarordan boshlanadi."*

**3D BFS: THE LAST SIGNAL** — bu retro-futuristik kiberpank va Tron estetikasida yaratilgan, real **Breadth-First Search (BFS)** algoritmi ustiga qurilgan to'liq 3D ilmiy-fantastik labirint va jumboq o'yini.

---

## 🌟 Asosiy Xususiyatlar

1. **Haqiqiy BFS Algoritmi (No Fake Pathfinding)**:
   - FIFO navbati (`Queue`), 4-yo'nalishli kataklar tahlili, ziyorat qilingan kataklar (`visited set`) va ota-ona ko'rsatkichlari (`parent map`).
   - Eng qisqa yo'lni kafolatlangan holda tiklash (`reconstructPath`).
   - Jonli algoritm inspektori: qadamlar, navbat hajmi, ko'rilayotgan kataklar va real vaqt telemetriyasi.

2. **Kino Estetikasidagi 3D Muhit**:
   - Three.js orqali yaratilgan metall pollar, neon to'rlar, emissiv devorlar va atmosferik tuman.
   - Chuqur koinot yulduzlar tizimi va zarrachalar (particles).
   - Chiqish portali (aylanuvchi giroskop halqalari va yorug'lik ustuni).

3. **NEX — Kiber Robot**:
   - To'liq protsedural 3D geometriyaga ega (hech qanday tashqi .obj/.gltf fayllarsiz ishlaydi).
   - Jonli animatsiyalar: muallaq turish (idle hover), burilishdagi qiyalik (banking tilt), g'alaba sakrashi va to'qnashuv reaksiyasi.

4. **4 xil O'yin Rejimi**:
   - **CHALLENGE (Bosqichlar)**: 5 ta unikal, tobora murakkablashib boruvchi labirint.
   - **MANUAL (Mustaqil boshqaruv)**: Robotni `W/A/S/D` orqali to'g'ridan-to'g'ri boshqarish va labirintni o'zi yechish.
   - **AI BFS (Kuzatuv)**: Algoritm qanday ishlashini qadamma-qadam yoki tezlik slayderi bilan tomosha qilish.
   - **EDITOR (Konstruktor)**: Sichqoncha bilan devorlar o'rnatish, boshlang'ich va yakuniy nuqtani o'zgartirish, avtomatik labirint generatsiya qilish.

5. **4 xil Kamera Rejimi**:
   - **ORBIT**: Erkin 3D aylantirish va kattalashtirish (OrbitControls).
   - **FOLLOW**: Robot ortidan silliq kuzatuvchi 3rd-person kamera.
   - **TOPDOWN**: Taktik yuqoridan ko'rinish.
   - **FIRSTPERSON**: Robot NEX nigohidan 1-shaxs kamerasi.

6. **Protsedural Sintezlangan Ovozlar (Web Audio API)**:
   - Tashqi mp3/wav fayllarsiz sof Web Audio osillyatorlari orqali hosil qilingan kiber tovushlar.

---

## 🚀 O'rnatish va Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish:
```bash
npm install
```

### 2. Dasturni ishga tushirish (Development server):
```bash
npm run dev
```
Terminalda ko'rsatilgan manzilni (masalan: `http://localhost:5173`) brauzerda oching.

### 3. Testlarni tekshirish (TDD verification):
```bash
npm test
```

### 4. Ishlab chiqarish (Production build):
```bash
npm run build
```

---

## 🎮 Boshqaruv

- **Harakatlanish**: `W`, `A`, `S`, `D` yoki `Yo'nalish tugmalari (Strelkalar)`.
- **Kamera aylantirish**: Sichqonchaning chap tugmasini bosib siljitish (Orbit rejimida).
- **Kamera rejimini almashtirish**: Ekran pastidagi `CAM` tugmasi.
- **BFS boshlash**: `INITIATE BFS` tugmasi.
- **Pauza / Qadam**: `PAUSE` va `STEP` tugmalari.

---

## 📁 Loyiha Strukturasi

```
3d/
├── index.html                  # Asosiy HTML va UI interfeys
├── package.json                # Skriptlar va bog'liqliklar
├── README.md                   # Loyiha qo'llanmasi
├── src/
│   ├── main.js                 # Dasturning kirish nuqtasi va render sikli
│   ├── audio/
│   │   └── SoundManager.js     # Web Audio API protsedural tovushlar
│   ├── core/
│   │   ├── Queue.js            # O(1) xotira-xavfsiz FIFO navbati
│   │   ├── Grid.js             # Immutabel 2D grid boshqaruvi
│   │   ├── bfs.js              # Haqiqiy BFS algoritmi va hodisalar generatori
│   │   ├── mazeGenerator.js    # Tasodifiy labirint generatori (Backtracker + Braiding)
│   │   └── levels.js           # 5 ta tayyor kiberpank bosqichi
│   ├── game/
│   │   ├── GameController.js   # O'yin holati va mexanikasi
│   │   └── Visualizer.js       # BFS vizualizatsiyasini boshqaruvchi drayver
│   ├── gfx/
│   │   ├── SceneManager.js     # Three.js sahna, yoritish va yulduzlar
│   │   ├── MazeRenderer.js     # 3D pol, devorlar, portal va yo'l chizgisi
│   │   ├── RobotNEX.js         # Protsedural NEX roboti va animatsiyalari
│   │   ├── CameraController.js # 4 rejimli kamera boshqaruvchisi
│   │   └── ParticleSystem.js   # Dvigatel va g'alaba zarrachalari (particles)
│   ├── styles/
│   │   └── main.css            # Neon kiberpank uslubidagi dizayn
│   └── tests/
│       ├── bfs.test.js         # Algoritm va navbat testlari
│       ├── mazeGenerator.test.js # Labirint generatori testlari
│       └── levels.test.js      # Bosqichlarning yechiluvchanlik testlari
```
