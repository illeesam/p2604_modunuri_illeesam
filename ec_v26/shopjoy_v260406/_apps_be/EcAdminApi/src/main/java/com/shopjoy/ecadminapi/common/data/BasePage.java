package com.shopjoy.ecadminapi.common.data;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 페이징 응답 공통 타입 — {@code BasePage<XxxDto.Item>} 하나로 쓴다.
 *
 * <p>{@link BasePageResponse} 는 DTO 마다 {@code PageResponse extends BasePageResponse<Item, Request>}
 * 빈 클래스를 하나씩 두게 했다(168개). 그 클래스들은 <b>필드도 메서드도 없는 껍데기</b>였고,
 * 두 번째 타입 파라미터 {@code R}(Request) 은 {@code pageCond} 의 선언 타입을 좁히는 것 외에
 * 하는 일이 없었다 — 실제로 자바 코드에서 {@code getPageCond()/setPageCond()} 를 호출하는 곳은
 * <b>한 군데도 없다</b>. 응답 JSON 으로 echo 될 뿐이다.</p>
 *
 * <p>그래서 타입 파라미터를 하나로 줄이고 구상 클래스로 만들었다.</p>
 *
 * <pre>
 * // 이전 — DTO 마다 빈 클래스가 필요했다
 * public static class PageResponse extends BasePageResponse&lt;Item, Request&gt; {}
 * SyUserDto.PageResponse selectPageData(SyUserDto.Request search);
 *
 * // 지금 — 선언 없이 바로 쓴다
 * BasePage&lt;SyUserDto.Item&gt; selectPageData(SyUserDto.Request search);
 * </pre>
 *
 * <p><b>응답 JSON 은 이전과 완전히 같다.</b> 필드명이 동일하고, {@code pageCond} 는 선언 타입이
 * {@link BaseRequest} 로 넓어졌지만 Jackson 은 런타임 타입 기준으로 직렬화하므로
 * 실제 Request 의 필드가 그대로 나간다(프론트 124곳이 이 값을 읽는다).</p>
 *
 * <p>표준 페이징 필드명 규칙 (프론트엔드와 약속된 고정 키):</p>
 * <ul>
 *   <li>{@code pageList}       — 현재 페이지 데이터 배열</li>
 *   <li>{@code pageTotalCount} — 전체 건수 (COUNT 결과)</li>
 *   <li>{@code pageTotalPage}  — 전체 페이지 수 (최소 1)</li>
 *   <li>{@code pageNo}         — 현재 페이지 번호 (1부터)</li>
 *   <li>{@code pageSize}       — 페이지당 건수</li>
 *   <li>{@code pageCond}       — 이번 조회에 사용된 검색 조건 echo</li>
 * </ul>
 * ⚠️ {@code list/totalCount/total/items} 등 다른 이름을 쓰면 프론트에서 빈 결과로 처리된다.
 *
 * @param <T> 항목(Item) 타입
 */
@Getter @Setter @NoArgsConstructor
public class BasePage<T> {

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
    private BaseRequest pageCond;

    /**
     * pageList + 페이징 메타 + 조회조건 echo 한 번에 채우기.
     *
     * <p>{@code pageTotalPage} 는 {@code ceil(pageTotalCount / pageSize)} 로 자동 계산하며,
     * pageSize 가 0 이하이면(페이징 미사용) 1 로 둔다.</p>
     *
     * @param pageList       조회 결과 항목들
     * @param pageTotalCount 전체 건수
     * @param pageNo         현재 페이지 번호 (1부터)
     * @param pageSize       페이지 크기 (0 이하면 전체 1페이지로 간주)
     * @param pageCond       이번 조회에 사용된 검색 조건 (echo, null 허용)
     * @return 값이 채워진 자기 자신 (메서드 체이닝용)
     */
    public BasePage<T> setPageInfo(List<T> pageList, long pageTotalCount,
                                   int pageNo, int pageSize, BaseRequest pageCond) {
        this.pageList       = pageList;
        this.pageTotalCount = pageTotalCount;
        this.pageTotalPage  = pageSize > 0 ? (int) Math.ceil((double) pageTotalCount / pageSize) : 1;
        this.pageNo         = pageNo;
        this.pageSize       = pageSize;
        this.pageCond       = pageCond;
        return this;
    }

    /** 목록만 담는 경우 (페이징 메타 없음) — 기존 {@code res.setPageList(list)} 대응 */
    public static <T> BasePage<T> ofList(List<T> pageList) {
        BasePage<T> res = new BasePage<>();
        res.setPageList(pageList);
        return res;
    }
}
