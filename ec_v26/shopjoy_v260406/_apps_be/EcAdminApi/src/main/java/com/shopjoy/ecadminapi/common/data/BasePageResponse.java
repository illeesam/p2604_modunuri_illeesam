package com.shopjoy.ecadminapi.common.data;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 모든 도메인 페이징 Response DTO 의 공통 부모.
 * 결과 목록(pageList) + 페이징 메타 + 조회조건 echo 를 표준화.
 *
 * 제네릭:
 *   T = Item 타입 (단건 응답 항목)
 *   R = Request 타입 (pageCond 에 echo 할 검색조건)
 *
 * 사용:
 *   public static class PageResponse extends BasePageResponse<Item, Request> {}
 *
 *   // Service.getPageData() — list/count/페이징 항목을 setPageInfo() 로 풀어서 한 번에 전달
 *   PageResponse res = new PageResponse();
 *   List<Item> list = mapper.selectPageList(req);
 *   long count = mapper.selectPageCount(req);
 *   return res.setPageInfo(list, count,
 *                          PageHelper.getPageNo(), PageHelper.getPageSize(), req);
 *
 *   // Service.getList() — pageList 만 set (페이징 메타 비움)
 *   PageResponse res = new PageResponse();
 *   res.setPageList(mapper.selectList(req));
 *   return res;
 *
 * 표준 페이징 필드명 규칙 (프론트엔드와 약속된 고정 키):
 *   pageList       = 현재 페이지 데이터 배열
 *   pageTotalCount = 전체 건수 (COUNT 결과)
 *   pageTotalPage  = 전체 페이지 수 (최소 1)
 *   pageNo         = 현재 페이지 번호 (1부터)
 *   pageSize       = 페이지당 건수
 *   pageCond       = 이번 조회에 사용된 검색 조건 echo
 * ⚠️ list/totalCount/total/items 등 다른 이름을 쓰면 프론트에서 빈 결과로 처리된다.
 * {@link com.shopjoy.ecadminapi.common.response.PageResult} 와 동일한 필드명 규칙을 공유한다.
 */
@Getter @Setter @NoArgsConstructor
public abstract class BasePageResponse<T, R extends BaseRequest> {

    /** 조회 결과 항목들 (단순목록/페이징 결과 공용) */
    private List<T> pageList;

    /** 전체 건수 */
    private long pageTotalCount;

    /** 전체 페이지 수 */
    private int pageTotalPage;

    /** 현재 페이지 번호 */
    private int pageNo;

    /** 페이지 크기 */
    private int pageSize;

    /** 이번 응답에 사용된 조회 조건 (request echo) */
    private R pageCond;

    /**
     * pageList + 페이징 메타 + 조회조건 echo 한 번에 채우기.
     * 호출자가 list/count/페이징 항목을 명시적으로 풀어서 전달한다.
     *
     * <p>pageTotalPage 는 {@code ceil(pageTotalCount / pageSize)} 로 자동 계산하며,
     * pageSize 가 0 이하이면(페이징 미사용) 1 로 둔다. 반환 타입을 하위 PageResponse
     * 제네릭 S 로 캐스팅해 호출부에서 {@code return new PageResponse().setPageInfo(...)}
     * 형태의 체이닝이 가능하도록 한다.</p>
     *
     * @param pageList       조회 결과 항목들
     * @param pageTotalCount 전체 건수
     * @param pageNo         현재 페이지 번호 (1부터)
     * @param pageSize       페이지 크기 (0 이하면 전체 1페이지로 간주)
     * @param pageCond       이번 조회에 사용된 검색 조건 (echo, null 허용)
     * @param <S>            실제 하위 PageResponse 타입
     * @return 값이 채워진 자기 자신 (S 로 캐스팅, 메서드 체이닝용)
     */
    @SuppressWarnings("unchecked")
    public <S extends BasePageResponse<T, R>> S setPageInfo(List<T> pageList, long pageTotalCount, int pageNo, int pageSize, R pageCond) {
        int totalPage = pageSize > 0 ? (int) Math.ceil((double) pageTotalCount / pageSize) : 1;
        this.pageList = pageList;
        this.pageTotalCount = pageTotalCount;
        this.pageTotalPage = totalPage;
        this.pageNo = pageNo;
        this.pageSize = pageSize;
        this.pageCond = pageCond;
        return (S) this;
    }
}
