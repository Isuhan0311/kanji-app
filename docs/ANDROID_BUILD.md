# Android 빌드 가이드 (Capacitor)

이 앱은 React + Vite 웹앱을 **Capacitor**로 감싼 Android 앱입니다. 웹 코드 그대로
Android WebView에서 실행되며, 실제 APK/AAB를 만들어 기기에 설치하거나 Play 스토어에
올릴 수 있습니다.

## 사전 요구 사항 (로컬 PC)

- **Node.js 18+** 와 npm
- **JDK 17 이상** (Android Gradle Plugin 요구)
- **Android Studio** (SDK + Platform Tools + Build Tools 포함)
  - 설치 후 `ANDROID_HOME`(또는 `ANDROID_SDK_ROOT`) 환경변수가 SDK 경로를 가리키도록 설정
  - 예) macOS/Linux: `~/Library/Android/sdk` 또는 `~/Android/Sdk`

> 이 저장소의 `android/` 디렉터리는 이미 생성·커밋되어 있습니다. `npx cap add android`를
> 다시 실행할 필요가 없습니다.

## 빌드 절차

```bash
# 1. 의존성 설치
npm install

# 2. 웹앱을 네이티브용으로 빌드(상대 경로 base, PWA 서비스워커 제외)하고
#    Android 프로젝트로 동기화
npm run android        # = build:app + cap:sync

# 3. Android Studio 열기
npm run cap:open       # = cap open android
```

Android Studio가 열리면 기기/에뮬레이터를 선택하고 **Run ▶** 으로 실행합니다.

### 커맨드라인으로 디버그 APK 만들기

```bash
cd android
./gradlew assembleDebug
# 결과물: android/app/build/outputs/apk/debug/app-debug.apk
```

생성된 `app-debug.apk`를 기기에 설치:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 릴리스(서명) 빌드 — Play 스토어용 AAB

1. 업로드 키스토어 생성(최초 1회):
   ```bash
   keytool -genkey -v -keystore upload-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
   > 키스토어와 비밀번호는 **로컬에서 안전하게 보관**하세요. 저장소에 커밋하지 마세요.

2. Android Studio → **Build > Generate Signed Bundle / APK > Android App Bundle** 에서
   위 키스토어로 서명하여 `.aab` 생성.

3. 생성된 `.aab`를 Google Play Console에 업로드.

## 코드 수정 후 반영 루프

웹 코드(`src/`)를 고친 뒤에는 다시 동기화해야 네이티브 앱에 반영됩니다.

```bash
npm run android        # 웹 재빌드 + Android로 동기화
```

그 다음 Android Studio에서 다시 Run 하거나 `./gradlew assembleDebug`.

## 참고 (구성 세부)

- **앱 ID**: `com.isuhan0311.kanji` — `capacitor.config.ts` 와 Play Console에서 일치해야 하며
  최초 출시 후에는 변경 불가.
- **앱 이름 / 아이콘 / 스플래시**: `android/app/src/main/res/` 에 한자(漢) 로고 기반으로
  브랜딩되어 있음(틸 배경 + 흰색 명조체 글자). 교체하려면 해당 mipmap/drawable PNG를
  덮어쓰거나 `npx @capacitor/assets generate --android`(1024px 아이콘 소스 필요) 사용.
- **세리프 폰트**: Noto Serif JP 서브셋(약 292KB)이 앱에 번들되어 오프라인에서도 한자가
  명조체로 표시됨.
- **화면 방향**: 현재 매니페스트 기본값. 세로 고정이 필요하면 `AndroidManifest.xml`의
  activity에 `android:screenOrientation="portrait"` 추가.
- **웹 배포(GitHub Pages)** 빌드는 그대로 `npm run build` 사용(이쪽은 base `/kanji-app/` +
  PWA 포함). 네이티브 빌드는 `npm run build:app`.
