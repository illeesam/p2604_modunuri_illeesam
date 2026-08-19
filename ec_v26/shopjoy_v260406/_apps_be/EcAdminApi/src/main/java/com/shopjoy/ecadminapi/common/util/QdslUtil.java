package com.shopjoy.ecadminapi.common.util;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DatePath;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.NumberPath;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.core.types.dsl.StringPath;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * QueryDSL Q*RepositoryImpl 검색조건(andXxx) 메서드에서 반복되는
 * null/blank 가드 + eq/like 조립 패턴을 공용화한 헬퍼.
 *
 * <p>사용 예:
 * <pre>
 * private BooleanExpression andProdIdEq(PdProdDto.Request s) {
 *     return s == null ? null : QdslUtil.strEq(pdProd.prodId, s.getProdId());
 * }
 * </pre>
 *
 * <p>주의사항: 인스턴스화 불가(private 생성자). 모든 메서드는 static.
 */
public class QdslUtil {

    /** 유틸 클래스 — 인스턴스화 금지. */
    private QdslUtil() {}

    /**
     * 정렬조건 빌드 — sort 문자열({@code "field dir[,field dir]"})을 파싱하여
     * {@code fieldMap} 에서 Q-경로를 찾아 {@link OrderSpecifier} 목록을 구성한다.
     * sort 미지정이거나 {@code fieldMap} 에 없는 필드만 있으면 {@code defaults} 를 그대로 반환한다.
     *
     * <pre>
     * private List&lt;OrderSpecifier&lt;?&gt;&gt; buildOrder(XxxDto.Request s) {
     *     return QdslUtil.buildOrder(s,
     *         Map.of("regDate",   xxx.regDate,
     *                "writerNm",  xxx.writerNm),
     *         new OrderSpecifier&lt;&gt;(Order.DESC, xxx.regDate),
     *         new OrderSpecifier&lt;&gt;(Order.ASC,  xxx.id));
     * }
     * </pre>
     *
     * @param search   검색조건 (null 허용)
     * @param fieldMap 필드명 → Q-경로(Expression) 매핑
     * @param defaults sort 미지정 또는 미매핑 시 적용할 기본 정렬 (순서 보장)
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    public static List<OrderSpecifier<?>> buildOrder(
            String sort,
            Map<String, ?> fieldMap,
            OrderSpecifier<?>... defaults) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        if (StringUtils.hasText(sort)) {
            for (String part : sort.split(",")) {
                String[] fd = part.trim().split(" ");
                if (fd.length == 2) {
                    com.querydsl.core.types.Expression path =
                            (com.querydsl.core.types.Expression) fieldMap.get(fd[0]);
                    if (path != null) {
                        Order ord = "desc".equalsIgnoreCase(fd[1]) ? Order.DESC : Order.ASC;
                        orders.add(new OrderSpecifier(ord, path));
                    }
                }
            }
        }
        if (orders.isEmpty() && defaults != null && defaults.length > 0) {
            orders.addAll(Arrays.asList(defaults));
        }
        return orders;
    }

    public static List<OrderSpecifier<?>> buildOrder(
            com.shopjoy.ecadminapi.common.data.BaseRequest search,
            Map<String, ?> fieldMap,
            OrderSpecifier<?>... defaults) {
        return buildOrder(sortOf(search), fieldMap, defaults);
    }

    /** Long 값 정확 일치. l 이 null 이면 조건 미적용(null 반환). */
    /**
     * 검색조건의 정렬값을 null 안전하게 꺼낸다.
     *
     * <p>모든 {@code *Dto.Request} 가 {@link com.shopjoy.ecadminapi.common.data.BaseRequest}
     * 를 상속하므로 sort 는 공통이다. Repository 의 {@code buildOrder(...)} 168곳이
     * {@code QdslUtil.sortOf(search)} 를 그대로 복붙하고 있어 하나로 묶었다.
     *
     * <pre>
     * String sort = QdslUtil.sortOf(search);
     * </pre>
     *
     * @param search 검색조건 (null 허용)
     * @return sort 문자열, search 가 null 이면 null
     */
    public static String sortOf(com.shopjoy.ecadminapi.common.data.BaseRequest search) {
        return (search == null) ? null : search.getSort();
    }

    public static BooleanExpression numPathEq(NumberPath<Long> np, Long l) {
        return l == null ? null : np.eq(l);
    }

    /** 문자열 정확 일치. s 가 blank 면 조건 미적용(null 반환). */
    public static BooleanExpression strEq(StringPath p, String s) {
        return StringUtils.hasText(s) ? p.eq(s) : null;
    }

    /** 대소문자 무시 부분일치(LIKE %s%). s 가 blank 면 조건 미적용(null 반환). */
    public static BooleanExpression strLike(StringExpression p, String s) {
        return StringUtils.hasText(s) ? p.toUpperCase().contains(s.toUpperCase()) : null;
    }

    /** 문자열 컬렉션 IN. values 가 비어있으면 조건 미적용(null 반환). */
    public static BooleanExpression strIn(StringPath p, Collection<String> values) {
        return CollectionUtils.isEmpty(values) ? null : p.in(values);
    }

    /** 문자열 trim 후 정확 일치. s 가 blank 면 조건 미적용(null 반환). */
    public static BooleanExpression strEqTrim(StringPath p, String s) {
        return StringUtils.hasText(s) ? p.eq(s.trim()) : null;
    }

    /** 문자열 초과 비교(> , ID 기반 페이지네이션 등). s 가 blank 면 조건 미적용(null 반환). */
    public static BooleanExpression strGt(StringPath p, String s) {
        return StringUtils.hasText(s) ? p.gt(s) : null;
    }

    /** 숫자/날짜 이상 비교(&gt;=). n 이 null 이면 조건 미적용(null 반환). */
    public static <T extends Number & Comparable<?>> BooleanExpression numGoe(NumberExpression<T> p, T n) {
        return n == null ? null : p.goe(n);
    }

    /** 숫자/날짜 이하 비교(&lt;=). n 이 null 이면 조건 미적용(null 반환). */
    public static <T extends Number & Comparable<?>> BooleanExpression numLoe(NumberExpression<T> p, T n) {
        return n == null ? null : p.loe(n);
    }

    /** 숫자/날짜 초과 비교(&gt;). n 이 null 이면 조건 미적용(null 반환). */
    public static <T extends Number & Comparable<?>> BooleanExpression numGt(NumberExpression<T> p, T n) {
        return n == null ? null : p.gt(n);
    }

    /** 숫자/날짜 미만 비교(&lt;). n 이 null 이면 조건 미적용(null 반환). */
    public static <T extends Number & Comparable<?>> BooleanExpression numLt(NumberExpression<T> p, T n) {
        return n == null ? null : p.lt(n);
    }

    /** 숫자 값 정확 일치(범용, Long 외 Integer/BigDecimal 등). n 이 null 이면 조건 미적용(null 반환). */
    public static <T extends Number & Comparable<?>> BooleanExpression numEq(NumberExpression<T> p, T n) {
        return n == null ? null : p.eq(n);
    }

    /**
     * 숫자 범위(양끝 포함) — min/max 둘 다 null 이면 조건 미적용, 한쪽만 있으면 편측 비교로 동작한다.
     * numGoe/numLoe 를 그대로 조합한 것 — 가격/수량/금액 등 min~max 검색에 사용.
     *
     * <pre>
     * private BooleanExpression andPriceBetween(PdProdDto.Request s) {
     *     return s == null ? null : QdslUtil.numBetween(pdProd.salePrice, s.getPriceMin(), s.getPriceMax());
     * }
     * </pre>
     */
    public static <T extends Number & Comparable<?>> BooleanExpression numBetween(NumberExpression<T> p, T min, T max) {
        BooleanExpression goe = numGoe(p, min);
        BooleanExpression loe = numLoe(p, max);
        if (goe == null) return loe;
        if (loe == null) return goe;
        return goe.and(loe);
    }

    /**
     * 문자열 범위(양끝 포함, 사전식 비교) — min/max 둘 다 blank 면 조건 미적용, 한쪽만 있으면 편측 비교.
     * 영문/숫자 코드처럼 사전식 정렬이 곧 값 순서인 컬럼의 구간 검색에 사용.
     */
    public static BooleanExpression strBetween(StringExpression p, String min, String max) {
        BooleanExpression goe = StringUtils.hasText(min) ? p.goe(min) : null;
        BooleanExpression loe = StringUtils.hasText(max) ? p.loe(max) : null;
        if (goe == null) return loe;
        if (loe == null) return goe;
        return goe.and(loe);
    }

    /**
     * ⭐ 기준일이 기간컬럼 안에 드는가 (DATE 컬럼용) — {@code baseDate} 가 [startDate, endDate] 안인지.
     * 시작/종료가 NULL 이면 각각 "제한 없음"으로 본다(즉시 시작 / 무기한).
     *
     * <p>같은 이름의 {@code dateBetween(path, start, end)} 과 읽는 방식이 동일하다 —
     * <b>"첫 인자가 뒤 두 인자 사이에 있는가"</b>. 다만 방향이 반대다:
     * <ul>
     *   <li>{@code dateBetween(regDate, "2026-01-01", "2026-12-31")} — <b>컬럼</b>이 입력 두 날짜 사이 (기간검색)</li>
     *   <li>{@code dateBetween(today, startDate, endDate)} — <b>기준일</b>이 두 컬럼 사이 (유효기간 판정)</li>
     * </ul>
     *
     * <p>기준일을 인자로 받으므로 "지금"에 묶이지 않는다 — 과거/미래 특정 시점 기준 조회(BO 시뮬레이션,
     * "그날 유효했던 프로모션" 조회 등)에도 그대로 쓸 수 있다.
     *
     * <p><b>기준일은 호출부에서 미리 한 번 구해 변수에 담아 넘긴다</b> — 메서드 안에서 매번
     * {@code LocalDate.now()} 를 부르면 한 쿼리 안의 조건들이 서로 다른 시각을 기준으로 평가될 수
     * 있고(자정 경계에서 목록/카운트 불일치), 같은 요청 안의 여러 조건이 동일 시점 스냅샷을 공유하지
     * 못한다. 한 요청 = 한 기준시각 원칙.
     *
     * <pre>
     * LocalDate today = LocalDate.now();
     * .where(QdslUtil.dateBetween(today, pmEvent.startDate, pmEvent.endDate),
     *        pmEvent.useYn.eq("Y"))
     * </pre>
     *
     * @param baseDate 기준일 (호출부에서 1회 계산해 전달). null 이면 조건 미적용(null 반환).
     */
    public static BooleanExpression dateBetween(LocalDate baseDate, DatePath<LocalDate> startDate, DatePath<LocalDate> endDate) {
        if (baseDate == null) return null;
        return startDate.isNull().or(startDate.loe(baseDate))
                .and(endDate.isNull().or(endDate.goe(baseDate)));
    }

    /**
     * ⭐ 기준시각이 기간컬럼 안에 드는가 (TIMESTAMP 컬럼용) — {@code baseDateTime} 이 [startDt, endDt] 안인지.
     * 의미·사용 원칙은 {@link #dateBetween(LocalDate, DatePath, DatePath)} 와 동일하며 컬럼 타입만 다르다.
     *
     * <p>DATE 컬럼에 이걸 쓰거나 TIMESTAMP 컬럼에 DATE 버전을 쓰면 경계값(당일 오후 시작 등)이
     * 미묘하게 어긋나므로 <b>컬럼 타입에 맞는 쪽을 반드시 골라 쓸 것</b>.
     *
     * @param baseDateTime 기준시각 (호출부에서 1회 계산해 전달). null 이면 조건 미적용(null 반환).
     */
    public static BooleanExpression dateBetween(LocalDateTime baseDateTime, DateTimePath<LocalDateTime> startDt, DateTimePath<LocalDateTime> endDt) {
        if (baseDateTime == null) return null;
        return startDt.isNull().or(startDt.loe(baseDateTime))
                .and(endDt.isNull().or(endDt.goe(baseDateTime)));
    }

    /**
     * 기간 검색 — 호출부에서 dateRangeType 값을 if 로 직접 분기해 미리 골라 둔 대상 컬럼(path)에 대해
     * [dateRangeStart, dateRangeEnd] 범위(끝일 포함, yyyy-MM-dd) 조건을 만든다.
     * dateRangeStart/dateRangeEnd 중 하나라도 blank 면 조건 미적용(null 반환).
     *
     * <p>대상 컬럼이 2~3개뿐인 경우가 대부분이라, 매 Repository 마다 Map&lt;String, DateTimePath&gt; 상수를
     * 선언해 조회하던 이전 방식이나 별도 헬퍼 메서드/중간 변수(dateRangeField) 대신, 검색조건을 모으는
     * {@code List<BooleanExpression> wheres} 에 분기마다 <b>3항 연산자로 한 줄씩</b> 바로 add 한다.
     * dateRangeType 이 해당 키와 일치하지 않으면 그 줄은 null 이 add 되어(=조건 없음) 자동 무시되므로,
     * if/else 블록 없이도 여러 키를 매끄럽게 표현할 수 있다 — 어느 키가 어느 컬럼을 쓰는지 한 줄에서 바로 보인다.
     *
     * <pre>
     * List&lt;BooleanExpression&gt; wheres = new ArrayList&lt;&gt;();
     * ...
     * wheres.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(xxx.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
     * wheres.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(xxx.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
     * </pre>
     */
    public static BooleanExpression dateBetween(DateTimePath<LocalDateTime> path, String dateRangeStart, String dateRangeEnd) {
        if (path == null || !StringUtils.hasText(dateRangeStart) || !StringUtils.hasText(dateRangeEnd)) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        /* 종료일 23:59:59.999999(마이크로초 끝) — SQL 로그에 검색한 두 날짜(start~end) 그대로 찍혀서
         * 일자 기준 기간임을 바로 알아볼 수 있다. "다음날 00시 미만" 방식과 결과는 사실상 동일하고
         * (빠지는 구간은 1마이크로초 미만 — Postgres timestamp 정밀도 한계라 그 이상 못 쪼갬),
         * 리터럴 23:59:59(초 단위)로 하면 서브초 데이터가 실제로 누락되므로 반드시 나노초까지 채운다. */
        LocalDateTime start = LocalDate.parse(dateRangeStart, fmt).atTime(0, 0, 0, 0);
        LocalDateTime end   = LocalDate.parse(dateRangeEnd,   fmt).atTime(23, 59, 59, 999_999_999);
        return path.goe(start).and(path.loe(end));
    }

    /**
     * 통합검색 — searchValue 를 fields 에 등록된 컬럼들에 대소문자 무시 부분일치(LIKE)로 누적 OR 조건을
     * 만든다. searchType 이 blank 면 fields 전체 대상, 아니면 CSV(콤마 구분) 로 지정된 필드명만 대상.
     * searchValue 가 blank 면 조건 미적용(null 반환).
     *
     * <p>mode 값:
     * <ul>
     *   <li>{@code "like"}  — %value% 양쪽 와일드카드 (기본값)</li>
     *   <li>{@code "rlike"} — value% 전방 일치 (starts-with)</li>
     *   <li>{@code "llike"} — %value 후방 일치 (ends-with)</li>
     *   <li>{@code "eq"}    — 대소문자 무시 정확 일치</li>
     * </ul>
     *
     * <p>사용 예:
     * <pre>
     * private BooleanExpression andSearchValue(String sv, String st) {
     *     return andSearchValue(sv, st, "like");
     * }
     * private BooleanExpression andSearchValue(String sv, String st, String mode) {
     *     Map&lt;String, StringPath&gt; fields = Map.ofEntries(...);
     *     return QdslUtil.searchValueLike(sv, st, fields, mode);
     * }
     * </pre>
     */
    public static BooleanExpression searchValueLike(String searchValue, String searchType, Map<String, StringPath> fields) {
        return searchValueLike(searchValue, searchType, fields, "like");
    }

    public static BooleanExpression searchValueLike(String searchValue, String searchType, Map<String, StringPath> fields, String mode) {
        if (!StringUtils.hasText(searchValue)) return null;
        boolean all = !StringUtils.hasText(searchType);
        String types = all ? "" : ("," + searchType.trim() + ",");
        BooleanExpression or = null;
        for (Map.Entry<String, StringPath> e : fields.entrySet()) {
            if (!(all || types.contains("," + e.getKey() + ","))) continue;
            BooleanExpression expr = switch (mode) {
                case "eq"    -> e.getValue().toUpperCase().eq(searchValue.toUpperCase());
                case "rlike" -> e.getValue().toUpperCase().startsWith(searchValue.toUpperCase());
                case "llike" -> e.getValue().toUpperCase().endsWith(searchValue.toUpperCase());
                default      -> strLike(e.getValue(), searchValue);
            };
            or = or == null ? expr : or.or(expr);
        }
        return or;
    }

    // -------------------------------------------------------------------------
    // FieldDef — 필드별 검색 방식(LIKE 계열 / EXISTS) 명세
    // -------------------------------------------------------------------------

    /**
     * 필드 단위 검색 방식 명세. {@link #searchValueFields} 와 함께 사용한다.
     *
     * <pre>
     * // 사용 예 (andSearchValue 내부)
     * return QdslUtil.searchValueFields(sv, st, List.of(
     *     QdslUtil.FieldDef.like("orderId",  xxx.orderId),
     *     QdslUtil.FieldDef.rlike("code",    xxx.code),       // 전방 일치
     *     QdslUtil.FieldDef.eq("statusCd",   xxx.statusCd),   // 정확 일치
     *     QdslUtil.FieldDef.exists("prodNm", sv2 ->
     *         JPAExpressions.selectOne().from(pEx)
     *             .where(pEx.prodId.eq(xxx.prodId), QdslUtil.strLike(pEx.prodNm, sv2))
     *             .exists())
     * ));
     * </pre>
     */
    public sealed interface FieldDef permits FieldDef.Like, FieldDef.Exists {
        String key();

        /** LIKE 계열 검색 (mode: "like" / "rlike" / "llike" / "eq"). */
        record Like(String key, StringPath path, String mode) implements FieldDef {}

        /** EXISTS 서브쿼리 검색. expr 은 searchValue → BooleanExpression 팩토리. */
        record Exists(String key, Function<String, BooleanExpression> expr) implements FieldDef {}

        static Like   like(String key, StringPath path)                          { return new Like(key, path, "like"); }
        static Like   rlike(String key, StringPath path)                         { return new Like(key, path, "rlike"); }
        static Like   llike(String key, StringPath path)                         { return new Like(key, path, "llike"); }
        static Like   eq(String key, StringPath path)                            { return new Like(key, path, "eq"); }
        static Exists exists(String key, Function<String, BooleanExpression> e)  { return new Exists(key, e); }
    }

    /**
     * 필드별 mode/EXISTS 혼합 검색. 각 필드에 {@link FieldDef} 로 검색 방식을 개별 지정한다.
     * searchType 이 blank 면 전체 필드, 아니면 해당 키 필드만 대상(OR 누적).
     * searchValue 가 blank 면 조건 미적용(null 반환).
     */
    public static BooleanExpression searchValueFields(String sv, String st, List<FieldDef> fields) {
        if (!StringUtils.hasText(sv)) return null;
        boolean all = !StringUtils.hasText(st);
        String types = all ? "" : ("," + st.trim() + ",");
        BooleanExpression or = null;
        for (FieldDef f : fields) {
            if (!(all || types.contains("," + f.key() + ","))) continue;
            BooleanExpression expr;
            if (f instanceof FieldDef.Like lf) {
                expr = switch (lf.mode()) {
                    case "eq"    -> lf.path().toUpperCase().eq(sv.toUpperCase());
                    case "rlike" -> lf.path().toUpperCase().startsWith(sv.toUpperCase());
                    case "llike" -> lf.path().toUpperCase().endsWith(sv.toUpperCase());
                    default      -> strLike(lf.path(), sv);
                };
            } else if (f instanceof FieldDef.Exists ef) {
                expr = ef.expr().apply(sv);
            } else {
                continue;
            }
            or = (or == null) ? expr : or.or(expr);
        }
        return or;
    }
}
