# Weather Board Backend

날씨 정보와 판매 데이터를 연계하여 분석할 수 있는 FastAPI 기반 백엔드 서비스입니다.

## 프로젝트 소개

Weather Board Backend는 일일 판매 데이터와 날씨 정보를 통합 관리하여, 날씨 조건이 판매 성과에 미치는 영향을 분석할 수 있도록 돕는 RESTful API 서버입니다.

### 주요 기능

- 판매 데이터 CRUD (생성, 조회, 수정, 삭제)
- 날씨 데이터 저장 및 조회
- 판매 통계 분석 (주별/월별)
- 결제 수단별 판매 분석
- 날씨-판매 상관관계 분석

## 기술 스택

- **프레임워크**: FastAPI
- **데이터베이스**: SQLite
- **ORM**: SQLModel
- **언어**: Python 3.12
- **배포**: Uvicorn

## API 엔드포인트

### 판매 (Sales)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/sale` | 판매 데이터 생성 |
| GET | `/sale` | 판매 목록 조회 (페이지네이션) |
| GET | `/sale/{sale_id}` | 특정 판매 데이터 조회 |
| GET | `/sale/month/` | 월별 판매 데이터 조회 |
| PATCH | `/sale` | 판매 데이터 수정 |
| DELETE | `/sale` | 판매 데이터 삭제 |

### 날씨 (Weather)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/weather` | 날씨 데이터 생성 |
| GET | `/weather?month=YYYY-MM` | 날씨 데이터 조회 (월 단위) |

### 통계 (Statistics)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/statistics` | 판매 통계 조회 |
| GET | `/statistics/summary/{period_type}` | 통계 요약 조회 |
| GET | `/statistics/weather/monthly` | 날씨별 월별 매출 추이 (sky/rain/both, 필터 지원) |
| GET | `/statistics/daily` | 결제 수단별 일별 매출 통계 |
| POST | `/statistics/recompute` | 통계 재계산 요청 |

## CORS 설정

다음 오리진에서의 요청을 허용합니다:
- `http://localhost:5173` (Vite 개발 서버)
- `http://127.0.0.1:5173`
- `http://localhost:8000`
- `http://127.0.0.1:8000`

## 개발

### 테스트

프로젝트에 포함된 `test_main.http` 파일을 사용하여 API를 테스트할 수 있습니다.

### 데이터 마이그레이션

날씨 요약 값을 `맑음/흐림/강우`로 통일하려면 아래 스크립트를 실행하세요.

```bash
python scripts/migrate_weather_summary.py --db sales.db
```

### 데이터베이스

- SQLite 데이터베이스는 `sales.db` 파일로 저장됩니다
- 테이블은 애플리케이션 시작 시 자동으로 생성됩니다
- 데이터베이스 스키마 변경 시 기존 데이터 백업을 권장합니다
- 쓰기 오류가 나면 `DATABASE_URL` 환경변수로 경로를 지정하세요

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 기여

이슈나 개선 사항이 있다면 GitHub Issues를 통해 제안해주세요.
