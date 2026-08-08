package com.shopjoy.ecadminapi.common.util;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
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
     * 기간 검색 — dateRangeType 값으로 dateFields 에서 대상 컬럼(DateTimePath)을 찾아 [dateRangeStart, dateRangeEnd]
     * 범위(끝일 포함, yyyy-MM-dd) 조건을 만든다. dateRangeType/dateRangeStart/dateRangeEnd 중 하나라도 blank 이거나
     * dateFields 에 dateRangeType 키가 없으면(알 수 없는 dateRangeType) 조건 미적용(null 반환).
     *
     * <p>사용 예:
     * <pre>
     * private static final Map&lt;String, DateTimePath&lt;LocalDateTime&gt;&gt; DATE_RANGE_FIELDS = Map.of(
     *     "reg_date", xxx.regDate,
     *     "upd_date", xxx.updDate
     * );
     * private BooleanExpression andDateRangeBetween(XxxDto.Request s) {
     *     return s == null ? null : QdslUtil.dateBetween(s.getDateRangeType(), s.getDateRangeStart(), s.getDateRangeEnd(), DATE_RANGE_FIELDS);
     * }
     * </pre>
     */
    public static BooleanExpression dateBetween(String dateRangeType, String dateRangeStart, String dateRangeEnd,
                                                       Map<String, DateTimePath<LocalDateTime>> dateFields) {
        if (!StringUtils.hasText(dateRangeType) || !StringUtils.hasText(dateRangeStart) || !StringUtils.hasText(dateRangeEnd)) return null;
        DateTimePath<LocalDateTime> path = dateFields.get(dateRangeType);
        if (path == null) return null;
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
