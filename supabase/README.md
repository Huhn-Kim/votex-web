# Supabase Edge Functions

이 디렉토리에는 Supabase Edge Functions이 포함되어 있습니다.

## weekly-data-update 함수

이 함수는 매주 일요일 자정에 실행되며, 사용자의 주간 투표 생성 및 참여 데이터를 업데이트합니다.

## 함수 배포 방법

### 1. Supabase CLI 설치 (Windows)

```powershell
# 방법 1: PowerShell에서 설치 (winget이 설치된 경우)
winget install --id Supabase.CLI

# 방법 2: scoop을 통해 설치 (scoop이 설치된 경우)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 방법 3: 직접 다운로드 및 설치
# 1. 다음 링크에서 최신 Windows 릴리스 다운로드:
#    https://github.com/supabase/cli/releases
# 2. 다운로드한 exe 파일을 실행하거나 압축 파일에서 추출
# 3. 추출한 파일을 PATH에 추가 (예: C:\Users\사용자명\AppData\Local\supabase\bin)
```

Windows에서 winget이나 scoop이 설치되지 않은 경우 방법 3을 사용하세요:

1. [Supabase CLI GitHub 릴리스 페이지](https://github.com/supabase/cli/releases)에서 최신 Windows 버전(`supabase_windows_x86_64.exe` 또는 압축 파일)을 다운로드합니다.
2. 다운로드한 파일을 실행하거나 압축 파일에서 추출합니다.
3. 추출한 파일을 Windows의 PATH에 추가합니다.

### 1-2. Supabase CLI 설치 (macOS/Linux)

```bash
# macOS에서 homebrew 사용
brew install supabase/tap/supabase

# Linux에서 (또는 macOS)
curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
```

npm을 통한 설치는 지원되지 않으니 위 방법 중 하나를 사용하세요.

### 1-3. 프로젝트에 로컬로 Supabase 설치 (대안)

```bash
# 프로젝트 디렉토리에서 실행
npm install supabase --save-dev
```

이 방법으로 설치한 경우, 모든 supabase 명령어 앞에 `npx`를 붙여서 사용해야 합니다:

```bash
# 로그인
npx supabase login

# Enter your verification code: e7ad5a4f
# Token cli_HUHNKIM_PRO\huhnk@HuhnKim_Pro_1744622308 created successfully.

# 프로젝트 연결
npx supabase link --project-ref YOUR_PROJECT_REF

# 함수 배포
npx supabase functions deploy weekly-data-update --project-ref YOUR_PROJECT_REF
```

### 2. Supabase에 로그인

```bash
supabase login
```

### 3. 로컬 프로젝트 링크

```bash
# Supabase 프로젝트에 연결
npx supabase link --project-ref YOUR_PROJECT_REF  #nemmgowccesebzdgyzrk  (내 ID)
```

> **권한 오류 해결 방법**:
> 
> `Your account does not have the necessary privileges` 오류가 발생하는 경우:
> 
> 1. Supabase 계정 유형 확인:
>    - 무료 계정은 일부 기능에 제한이 있을 수 있습니다.
>    - 조직 계정의 경우 적절한 권한이 있어야 합니다.
> 
> 2. 해결 방법:
>    - Supabase Studio에서 프로젝트 소유자 또는 관리자로 로그인했는지 확인
>    - 계정이 프로젝트에 연결되어 있는지 확인 (다른 계정으로 생성된 프로젝트일 수 있음)
>    - Supabase 대시보드에서 API 키를 확인하고 service_role 키를 사용
>    - `--debug` 플래그를 추가하여 더 자세한 오류 정보 확인:
>      ```bash
>      npx supabase link --project-ref YOUR_PROJECT_REF --debug
>      ```
>
> 3. 직접 Edge Function 배포 대안:
>    - Supabase 대시보드를 통해 Edge Function을 직접 업로드할 수 있습니다.
>    - Edge Functions 메뉴에서 "Create a new function" 선택 후 파일 업로드

### 4. Edge Function 배포

```bash
# weekly-data-update 함수 배포
npx supabase functions deploy weekly-data-update --project-ref YOUR_PROJECT_REF
```

> **대시보드를 통한 수동 배포 방법 (자세한 안내)**:
> 
> CLI로 배포가 어려운 경우 Supabase 대시보드를 통해 직접 배포할 수 있습니다:
> 
> 1. **Supabase 대시보드 접속**:
>    - https://supabase.com/dashboard 에 로그인합니다.
>    - 해당 프로젝트를 선택합니다.
> 
> 2. **Edge Functions 메뉴 접근**:
>    - 왼쪽 사이드바 하단에 있는 "Edge Functions" 메뉴를 클릭합니다.
>    - 아이콘은 번개 모양(⚡)으로 표시되어 있을 수 있습니다.
> 
> 3. **새 Edge Function 생성**:
>    - 상단의 "Create a new function" 또는 "New Function" 버튼을 클릭합니다.
> 
> 4. **Function 이름 지정**:
>    - 이름 입력란에 "weekly-data-update"를 입력합니다.
>    - 참고: 함수 이름은 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
> 
> 5. **파일 업로드**:
>    - 최신 Supabase UI에서는 기본적으로 간단한 코드 에디터가 표시됩니다.
>    - 에디터에 표시된 기본 코드를 모두 삭제합니다.
>    - `supabase/functions/weekly-data-update/index.ts` 파일의 내용을 복사하여 붙여넣습니다.
>    - 또는 일부 인터페이스에서는 "Import from file" 또는 "Upload" 옵션이 제공될 수 있습니다.
> 
> 6. **HTTP 메서드 설정** (인터페이스에 따라 다를 수 있음):
>    - 최신 Supabase 인터페이스에서는 HTTP 메서드 선택 옵션이 별도로 보이지 않을 수 있습니다.
>    - 이 경우 Function은 기본적으로 모든 HTTP 메서드(GET, POST 등)를 지원합니다.
>    - 코드 내에서 `req.method`를 체크하여 메서드를 처리하게 됩니다.
>    - 일부 UI에서는 "Function Settings" 또는 "Advanced" 섹션을 확장하면 HTTP 메서드 설정이 표시될 수 있습니다.
> 
> 7. **CRON 스케줄 설정**:
>    - 함수 생성 페이지에서 "Schedule" 또는 "CRON Schedule" 섹션을 찾습니다.
>    - 대부분의 경우 토글 스위치를 활성화하여 스케줄링을 켭니다.
>    - CRON 표현식 입력란에 `0 0 * * 0`을 입력합니다. (매주 일요일 자정)
>    - 인터페이스에 따라 "Advanced" 또는 "Settings" 탭에 있을 수 있습니다.
>    - 또는 함수 생성 후 세부 페이지에서 CRON 설정을 추가할 수도 있습니다.
> 
> 8. **환경 변수 설정** (필요한 경우):
>    - "Environment variables" 섹션이 있다면 확장합니다.
>    - edge function은 기본적으로 Supabase의 환경 변수(URL 및 anon/service_role 키)에 접근할 수 있습니다.
>    - 추가적인 환경 변수는 필요하지 않습니다.
> 
> 9. **Function 생성 완료**:
>    - "Create Function" 또는 "Deploy" 버튼을 클릭합니다.
>    - 배포가 시작되고, 완료되면 성공 메시지가 표시됩니다.
> 
> 10. **배포 후 설정** (필요한 경우):
>     - 함수 세부 페이지로 이동합니다.
>     - "Settings" 탭에서 CRON 스케줄이 설정되어 있지 않다면 추가합니다.
>     - "Logs" 탭에서 함수 실행 로그를 확인할 수 있습니다.
> 
> 11. **수동 테스트** (선택 사항):
>     - 함수 상세 페이지에서 "Run" 또는 "Invoke" 버튼을 클릭하여 함수를 직접 실행해볼 수 있습니다.
>     - 또는 "curl" 명령어 예시가 제공되는 경우 해당 명령을 사용하여 함수를 호출할 수 있습니다.

### 5. CRON 스케줄 설정

Edge Function에 대한 CRON 스케줄은 `cron.json` 파일에 정의되어 있습니다. 매주 일요일 자정에 실행됩니다.

Supabase 대시보드에서 CRON 스케줄을 활성화하려면:

1. Supabase 대시보드로 이동
2. Edge Functions 메뉴로 이동
3. `weekly-data-update` 함수 선택
4. CRON 설정 활성화

## 수동으로 함수 실행

테스트를 위해 함수를 수동으로 실행하려면:

```bash
# 로컬에서 테스트
supabase functions serve weekly-data-update --no-verify-jwt

# 배포된 함수 호출
curl -X POST "https://YOUR_SUPABASE_REF.supabase.co/functions/v1/weekly-data-update" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 함수 로깅 확인

함수의 로그를 확인하려면:

```bash
supabase functions logs weekly-data-update --project-ref YOUR_PROJECT_REF
```

## update_weekly_data 함수 설명

이 Edge Function은 데이터베이스에 있는 `update_weekly_data()` 함수를 실행합니다. 이 함수는 다음 작업을 수행합니다:

1. 모든 사용자의 `weekly_created` 배열을 업데이트 (이전 데이터를 한 칸씩 앞으로 이동, 마지막 위치에는 0 추가)
2. 모든 사용자의 `weekly_voted` 배열을 업데이트 (이전 데이터를 한 칸씩 앞으로 이동, 마지막 위치에는 0 추가)

이렇게 하면 매주 사용자의 투표 생성 및 참여 데이터가 업데이트되어 주간 활동 통계를 보여줄 수 있습니다.

## TypeScript 오류 관련 참고사항

Edge Functions는 Deno 런타임에서 실행되기 때문에 로컬 개발 환경에서 TypeScript 오류가 발생할 수 있습니다. 이는 로컬 편집기와 배포 환경의 차이로 인한 정상적인 현상입니다.

### 오류 유형 및 해결책

1. **모듈 가져오기 오류**:
   ```
   Cannot find module 'https://deno.land/std@0.177.0/http/server.ts'
   ```

2. **Deno 환경 변수 접근 오류**:
   ```
   Cannot find name 'Deno'.
   ```

이러한 오류는 로컬 개발 환경에서만 발생하며, 실제 Supabase Edge Functions 환경에서는 정상적으로 동작합니다.

### 로컬 개발 시 오류 해결 방법

오류를 무시하려면:
- 코드에 `// @ts-ignore` 주석을 추가했습니다
- `deno.json` 파일을 추가하여 필요한 타입 정의를 제공했습니다

실제 로컬 개발과 테스트를 위해서는 Deno 런타임을 설치하고 사용하는 것이 좋습니다:

```bash
# Deno 설치
curl -fsSL https://deno.land/x/install/install.sh | sh

# 로컬에서 Edge Function 실행
deno run --allow-net --allow-env --allow-read index.ts
```

## 배포 후 CRON 작동 확인

배포 후 CRON 설정이 제대로 작동하는지 Supabase 대시보드에서 확인할 수 있습니다:

1. Supabase 대시보드 접속
2. Edge Functions 메뉴로 이동
3. `weekly-data-update` 함수 선택
4. "Invocations" 탭에서 실행 기록 확인
5. "Logs" 탭에서 로그 확인

함수가 정상적으로 작동하면 매주 일요일 자정에 사용자의 주간 데이터가 업데이트됩니다.

## PostgreSQL pg_cron을 사용한 대안적 방법

Edge Functions 외에도, Supabase PostgreSQL 데이터베이스에서 직접 cron 작업을 예약하는 방법도 있습니다. 이 방법은 Supabase가 pg_cron 확장을 지원하는 경우에만 사용 가능합니다.

### pg_cron 확장 활성화 및 작업 설정

1. Supabase 대시보드에서 SQL 에디터로 이동합니다.

2. 다음 SQL을 실행하여 pg_cron 확장이 활성화되어 있는지 확인합니다:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

3. 확장이 없다면 확장을 활성화합니다 (Pro 플랜 이상에서만 가능):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

4. `create_weekly_update_job.sql` 파일의 내용을 SQL 에디터에 복사하여 실행합니다:
   ```sql
   -- 기존 작업이 있다면 삭제
   SELECT cron.unschedule('weekly_data_update_job')
   WHERE EXISTS (
     SELECT 1 FROM cron.job WHERE jobname = 'weekly_data_update_job'
   );

   -- 매주 일요일 자정에 update_weekly_data 함수를 실행하는 작업 스케줄링
   SELECT cron.schedule(
     'weekly_data_update_job',   -- 작업 이름
     '0 0 * * 0',                -- cron 표현식: 매주 일요일 00:00
     'SELECT update_weekly_data()'  -- 실행할 함수
   );
   ```

5. 작업이 생성되었는지 확인합니다:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'weekly_data_update_job';
   ```

### 주의사항

- pg_cron 확장은 Supabase의 Pro 플랜 이상에서만 사용 가능합니다.
- 무료 플랜에서는 Edge Functions의 CRON 기능을 사용하세요.
- pg_cron이 정상 작동하지 않는 경우, Supabase 지원팀에 문의하여 확장이 활성화되어 있는지 확인하세요.

## 두 가지 방식 중 어떤 것을 선택해야 할까요?

1. **Edge Functions + CRON 방식 (추천)**:
   - 모든 Supabase 플랜에서 사용 가능합니다.
   - 로그 확인이 쉽고 모니터링이 용이합니다.
   - 복잡한 로직도 구현할 수 있습니다.

2. **PostgreSQL pg_cron 방식**:
   - 데이터베이스 내부에서 직접 실행되어 외부 호출이 필요 없습니다.
   - 단순한 SQL 작업에 효율적입니다.
   - Pro 플랜 이상에서만 사용 가능합니다.

두 방법 모두 동일한 결과를 제공하지만, 안정성과 모니터링을 위해 Edge Functions 방식을 권장합니다.

## 추가 대안: GitHub Actions를 사용한 자동화

만약 Supabase CLI 배포나 pg_cron 사용에 문제가 있다면, GitHub Actions를 사용하여 주간 데이터 업데이트를 자동화할 수도 있습니다.

### GitHub Actions 설정 방법

1. 프로젝트 루트에 `.github/workflows` 디렉토리를 생성합니다.

2. `weekly-update.yml` 파일을 생성하고 다음 내용을 추가합니다:

```yaml
name: Weekly Data Update

on:
  schedule:
    # 매주 일요일 00:00 UTC에 실행
    - cron: '0 0 * * 0'
  # 수동 실행을 위한 워크플로우 디스패치 추가
  workflow_dispatch:

jobs:
  update-weekly-data:
    runs-on: ubuntu-latest
    steps:
      - name: Call update_weekly_data function
        run: |
          curl -X POST "${{ secrets.SUPABASE_FUNCTION_URL }}" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
          -d '{}'
```

3. GitHub 저장소 설정에서 다음 시크릿을 추가합니다:
   - `SUPABASE_FUNCTION_URL`: Edge Function의 URL (예: `https://nemmgowccesebzdgyzrk.supabase.co/functions/v1/weekly-data-update`)
   - `SUPABASE_ANON_KEY`: Supabase 프로젝트의 anon 키

4. 이 방법은 다음과 같은 장점이 있습니다:
   - Supabase CLI 설치 및 배포 과정이 필요 없음
   - 무료 GitHub 계정에서도 사용 가능
   - 워크플로우 실행 로그를 GitHub에서 확인 가능
   - 수동 트리거도 가능

### 또는 직접 SQL 실행하는 GitHub Actions

Edge Function을 사용하지 않고 직접 SQL을 실행하는 방법도 있습니다:

```yaml
name: Weekly Data Update SQL

on:
  schedule:
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  update-weekly-data:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client
        
      - name: Execute update_weekly_data function
        run: |
          PGPASSWORD=${{ secrets.SUPABASE_DB_PASSWORD }} psql \
          -h ${{ secrets.SUPABASE_DB_HOST }} \
          -U postgres \
          -d postgres \
          -c "SELECT update_weekly_data()"
```

이 방법을 사용하려면 다음 시크릿이 필요합니다:
- `SUPABASE_DB_PASSWORD`: 데이터베이스 비밀번호
- `SUPABASE_DB_HOST`: 데이터베이스 호스트 주소 