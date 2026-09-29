# 테스트 실행 태그 규약

CI 가 어떤 테스트를 돌릴지 결정하는 태그. 테스트의 `describe(...)` 제목 끝에 마커로 박는다.
jest 는 1급 태그 API 가 없으므로 **태그 = 테스트 이름의 마커**, `jest -t "<패턴>"` 으로 필터한다.

## 3가지 태그

| 태그 | 의미 | 누가 관리 | CI 실행? |
|---|---|---|---|
| `@critical` | 예외 없이 항상 실행하는 안전망 | **사람만** (Claude 금지) | ✅ 항상 |
| `@selected` | 이번 변경 대상 | `/test-coverage`(Claude) | ✅ |
| `@notSelected` | 이번 변경과 무관 → 배제 | `/test-coverage`(Claude) | ❌ |
| (무태그) | 분류 안 됨 | — | ❌ (selected 아니면 skip) |

- **CI 필터**: `jest -t "@critical|@selected"` → critical + selected 만 실행.
- `@critical` 은 핵심 회귀 안전망이라 **변경 무관하게 매번** 돈다. **Claude 는 절대 추가/삭제/수정하지 않는다.**
- `@selected`/`@notSelected` 는 **PR 단위로 갱신**된다(`/test-coverage` 가 리셋 후 재부여). 그래서 PR 브랜치마다 태깅이 다를 수 있다 — 정상.

## 작성 예시

```ts
// 사람이 단 안전망 (Claude 가 못 건드림)
describe('useLogoutHandler @critical', () => { ... });

// /test-coverage 가 이번 변경 대상으로 표시
describe('useDeleteCurated @selected', () => { ... });

// /test-coverage 가 무관으로 명시 제외
describe('useSwipe @notSelected', () => { ... });
```

> describe 제목에 박으면 그 안의 모든 `test()` 가 함께 필터된다(jest -t 는 describe+test 전체 이름에 매칭).

## 흐름

```
사람: 변경을 docs/testing/change-template.md 양식으로 PR/Notion 작성
      + 핵심 테스트엔 @critical 을 미리 수동 부여
  ↓
/test-coverage <PR/Notion 링크>
  ↓ Claude: @selected/@notSelected 리셋 후 재부여 (@critical 불변) + 커버리지 갭 테스트 추가(@selected)
  ↓
CI: jest -t "@critical|@selected"  → 필요한 것만 실행
```
