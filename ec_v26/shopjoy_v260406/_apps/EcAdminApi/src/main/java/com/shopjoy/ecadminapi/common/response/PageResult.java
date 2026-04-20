package com.shopjoy.ecadminapi.common.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 페이징 조회 결과 래퍼.
 *
 * 응답 형태:
 * {
 *   "pageList":        [...],
 *   "pageNo":          1,
 *   "pageSize":        20,
 *   "pageTotalCount":  153,
 *   "pageTotalPage":   8,
 *   "pageCond":        { "kw": "검색어", "siteId": "s01" }
 * }
 *
 * pageTotalPage는 최소 1 (데이터가 없어도 1페이지로 표시).
 * pageCond는 이번 조회에 사용된 검색 조건으로, 클라이언트가 페이지 전환 시 조건을 유지하는 데 활용.
 * of() 팩토리 메서드로 생성한다.
 */
@Getter
@Builder
public class PageResult<T> {

    private final List<T> pageList;       // 현재 페이지 데이터
    private final int pageNo;             // 현재 페이지 번호 (1부터)
    private final int pageSize;           // 페이지당 건수
    private final long pageTotalCount;    // 전체 건수
    private final int pageTotalPage;      // 전체 페이지 수
    private final Object pageCond;        // 이번 조회에 사용된 검색 조건

    /**
     * 검색 조건 포함 생성.
     *
     * @param pageList       현재 페이지 데이터
     * @param pageTotalCount 전체 건수 (COUNT 쿼리 결과)
     * @param pageNo         현재 페이지 번호 (1부터)
     * @param pageSize       페이지당 건수
     * @param pageCond       이번 조회에 사용된 검색 조건 (SearchRequest, Map 등 자유, null 허용)
     */
    public static <T> PageResult<T> of(List<T> pageList, long pageTotalCount, int pageNo, int pageSize, Object pageCond) {
        int pageTotalPage = (int) Math.max(1, Math.ceil((double) pageTotalCount / pageSize));
        return PageResult.<T>builder()
            .pageList(pageList)
            .pageTotalCount(pageTotalCount)
            .pageNo(pageNo)
            .pageSize(pageSize)
            .pageTotalPage(pageTotalPage)
            .pageCond(pageCond)
            .build();
    }
}
