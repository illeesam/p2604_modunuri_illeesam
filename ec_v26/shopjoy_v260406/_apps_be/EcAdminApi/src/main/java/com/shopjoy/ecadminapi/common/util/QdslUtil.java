package com.shopjoy.ecadminapi.common.util;

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
import java.util.Collection;
import java.util.Map;

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

    /** Long 값 정확 일치. l 이 null 이면 조건 미적용(null 반환). */
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
     * 기간 검색 — dateType 값으로 dateFields 에서 대상 컬럼(DateTimePath)을 찾아 [dateStart, dateEnd]
     * 범위(끝일 포함, yyyy-MM-dd) 조건을 만든다. dateType/dateStart/dateEnd 중 하나라도 blank 이거나
     * dateFields 에 dateType 키가 없으면(알 수 없는 dateType) 조건 미적용(null 반환).
     *
     * <p>사용 예:
     * <pre>
     * private static final Map&lt;String, DateTimePath&lt;LocalDateTime&gt;&gt; DATE_FIELDS = Map.of(
     *     "reg_date", xxx.regDate,
     *     "upd_date", xxx.updDate
     * );
     * private BooleanExpression andDateRangeBetween(XxxDto.Request s) {
     *     return s == null ? null : QdslUtil.dateBetween(s.getDateType(), s.getDateStart(), s.getDateEnd(), DATE_FIELDS);
     * }
     * </pre>
     */
    public static BooleanExpression dateBetween(String dateType, String dateStart, String dateEnd,
                                                       Map<String, DateTimePath<LocalDateTime>> dateFields) {
        if (!StringUtils.hasText(dateType) || !StringUtils.hasText(dateStart) || !StringUtils.hasText(dateEnd)) return null;
        DateTimePath<LocalDateTime> path = dateFields.get(dateType);
        if (path == null) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(dateStart, fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(dateEnd,   fmt).plusDays(1).atStartOfDay();
        return path.goe(start).and(path.lt(endExcl));
    }

    /**
     * 통합검색 — searchValue 를 fields 에 등록된 컬럼들에 대소문자 무시 부분일치(LIKE)로 누적 OR 조건을
     * 만든다. searchType 이 blank 면 fields 전체 대상, 아니면 CSV(콤마 구분) 로 지정된 필드명만 대상.
     * searchValue 가 blank 면 조건 미적용(null 반환).
     *
     * <p>사용 예:
     * <pre>
     * private static final Map&lt;String, StringPath&gt; SEARCH_FIELDS = Map.ofEntries(
     *     Map.entry("prodNm", xxx.prodNm),
     *     Map.entry("prodCode", xxx.prodCode)
     * );
     *     private BooleanExpression andSearchValueLike(XxxDto.Request s) {
     *     return s == null ? null : QdslUtil.searchValueLike(s.getSearchValue(), s.getSearchType(), SEARCH_FIELDS);
     * }
     * </pre>
     */
    public static BooleanExpression searchValueLike(String searchValue, String searchType, Map<String, StringPath> fields) {
        if (!StringUtils.hasText(searchValue)) return null;
        boolean all = !StringUtils.hasText(searchType);
        String types = all ? "" : ("," + searchType.trim() + ",");
        BooleanExpression or = null;
        for (Map.Entry<String, StringPath> e : fields.entrySet()) {
            if (!(all || types.contains("," + e.getKey() + ","))) continue;
            BooleanExpression expr = strLike(e.getValue(), searchValue);
            or = or == null ? expr : or.or(expr);
        }
        return or;
    }
}
