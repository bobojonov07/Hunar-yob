
# Ҳунар Ёб — Платформаи устоҳо (100% Online)

Ин барнома бо истифода аз **NextJS** ва **Firebase** сохта шудааст. Ҳамаи маълумотҳо дар базаи маълумоти воқеии Google (Firestore) сабт мешаванд.

## Қадами 1: Ҳалли мушкили "Quota Exceeded" (Квота пур шуд)

Агар дар аккаунти асосии шумо квота пур бошад:
1. Ба [Firebase Console](https://console.firebase.google.com/) бо дигар аккаунти Google ворид шавед.
2. Лоиҳаи навро бо номи `hunar-yob` созед.
3. Дар танзимот (Project Settings) ба бахши **General** равед ва дар қисми **Your apps** як "Web app" (тасвири `</>`) илова кунед.
4. Объекти `firebaseConfig`-ро нусхабардорӣ кунед ва ба файл дар `src/firebase/config.ts` гузоред.

## Қадами 2: Гузоштани код ба GitHub

1. Ба [github.com](https://github.com) ворид шавед ва репозиторийи нав бо номи `hunar-yob` созед.
2. Дар терминали лоиҳа ин фармонҳоро иҷро кунед:
   ```bash
   git init
   git add .
   git commit -m "Нашри аввалин"
   git remote add origin https://github.com/ИМЗОИ_ШУМО/hunar-yob.git
   git branch -M main
   git push -u origin main
   ```

## Қадами 3: Нашр дар Firebase App Hosting

1. Дар Firebase Console ба бахши **App Hosting** гузаред.
2. Репозиторийи GitHub-и худро пайваст кунед.
3. Firebase ба таври автоматӣ сомонаро дар интернет нашр мекунад.

---
Таҳия шудааст тавассути **TAJ.WEB** барои кумак ба ҳамватанон.
