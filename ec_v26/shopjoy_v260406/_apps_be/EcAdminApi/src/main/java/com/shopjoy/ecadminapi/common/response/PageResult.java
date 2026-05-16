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
 *   "pageCond":        { "searchValue": "검색어", "siteId": "s01" }
 * }
 *
 * pageTotalPage는 최소 1 (데이터가 없어도 1페이지로 표시).
 * pageCond는 이번 조회에 사용된 검색 조건으로, 클라이언트가 페이지 전환 시 조건을 유지하는 데 활용.
 * of() 팩토리 메서드로 생성한다(불변 객체, Lombok @Builder).
 *
 * 표준 페이징 필드명 규칙 (프론트와 약속된 고정 키, {@link com.shopjoy.ecadminapi.common.data.BasePageResponse} 와 동일):
 *   pageList / pageNo / pageSize / pageTotalCount / pageTotalPage / pageCond
 * ⚠️ list/totalCount/total/items 등 다른 이름을 쓰면 프론트가 빈 결과로 처리한다.
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
     * 페이징 결과 + 검색 조건 echo 를 담은 불변 PageResult 를 생성한다.
     *
     * <p>pageTotalPage 는 {@code max(1, ceil(pageTotalCount / pageSize))} 로 계산하므로
     * 데이터가 0건이어도 최소 1 페이지로 표시된다.
     * 주의: pageSize 가 0 이면 0 으로 나누게 되어 무한대가 되므로 호출부에서
     * PageHelper 로 1 이상의 pageSize 가 보장된 상태로 호출해야 한다.</p>
     *
     * @param pageList       현재 페이지 데이터
     * @param pageTotalCount 전체 건수 (COUNT 쿼리 결과)
     * @param pageNo         현재 페이지 번호 (1부터)
     * @param pageSize       페이지당 건수 (1 이상)
     * @param pageCond       이번 조회에 사용된 검색 조건 (SearchRequest, Map 등 자유, null 허용)
     * @param <T>            데이터 항목 타입
     * @return 값이 채워진 불변 PageResult
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
