-- service_role의 statement_timeout을 5분으로 설정
-- API 호출 시 사용하는 role이므로 이 설정이 필수

-- 1. 현재 service_role 설정 확인
SELECT rolname, rolconfig
FROM pg_roles
WHERE rolname IN ('service_role', 'postgres', 'authenticated');

-- 2. service_role에 5분 timeout 설정
ALTER ROLE service_role SET statement_timeout = '300000';

-- 3. authenticated role에도 설정 (혹시 모르니)
ALTER ROLE authenticated SET statement_timeout = '300000';

-- 4. postgres role에도 설정
ALTER ROLE postgres SET statement_timeout = '300000';

-- 5. 설정 확인
SELECT rolname, rolconfig
FROM pg_roles
WHERE rolname IN ('service_role', 'postgres', 'authenticated');

-- 6. 현재 세션 확인
SHOW statement_timeout;
