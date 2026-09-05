package com.shopjoy.ecadminapi.common.data;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 모든 도메인 Request DTO 의 공통 부모.
 * 검색 토큰/입력값, 기간, 정렬, 페이징 필드를 제공한다.
 *
 * 사용:
 *   public static class Request extends BaseRequest {
 *       // 도메인 고유필드만 추가 선언
 *       private String siteId;
 *       private String deptId;
 *   }
 *
 * MyBatis OGNL 및 Spring @ModelAttribute 모두 상속된 getter/setter 정상 인식.
 * PageHelper.addPaging(Object) 도 reflection 으로 setLimit/setOffset 호출 가능.
 */
@Getter @Setter @NoArgsConstructor
public abstract class BaseRequest {

    /** 검색 대상 필드 — Entity 필드명(camelCase) 토큰 조합. 예: "fieldA,fieldB" 또는 "fieldA fieldB" (OR 조건) */
    @Size(max = 200, message = "searchType 는 200자 이내여야 합니다.")
    private String searchType;

    /** 검색 입력값 */
    @Size(max = 100, message = "searchValue 는 100자 이내여야 합니다.")
    private String searchValue;

    /** 기간 검색 대상 컬럼 토큰. 예: "reg_date", "upd_date", "last_login_date" — Mapper XML 에서 dateRangeType 으로 분기 */
    @Size(max = 50, message = "dateRangeType 는 50자 이내여야 합니다.")
    private String dateRangeType;

    /** 기간 검색 시작일 (포함). 형식 yyyy-MM-dd, 최대 10자. dateRangeType 컬럼 기준 비교. */
    @Size(max = 10, message = "dateRangeStart 는 10자 이내여야 합니다.")
    private String dateRangeStart;

    /** 기간 검색 종료일 (포함). 형식 yyyy-MM-dd, 최대 10자. dateRangeType 컬럼 기준 비교. */
    @Size(max = 10, message = "dateRangeEnd 는 10자 이내여야 합니다.")
    private String dateRangeEnd;

    /** 정렬 지정 토큰. 예: "regDate desc" — Mapper XML 의 ORDER BY 분기에 사용. */
    @Size(max = 50, message = "sort 는 50자 이내여야 합니다.")
    private String sort;

    /**
     * 현재 유효건만 조회 ('Y' 일 때만 적용) — 사용여부/상태 + 노출기간이 "지금" 기준으로 유효한 행만.
     *
     * <p><b>BO 전용 옵션이다.</b> 관리자 화면은 만료·미시작 건도 관리해야 하므로 기본은 전체 조회이고,
     * "지금 노출중인 것만 미리보기" 같은 용도에서만 'Y' 를 보낸다.
     *
     * <p><b>FO 는 이 값을 쓰지 않는다</b> — 사용자에게 만료·숨김 데이터가 노출되면 안 되므로
     * FO Repository 는 파라미터와 무관하게 유효조건을 <b>항상</b> 건다(빠뜨릴 여지를 없앤다).
     */
    @Size(max = 1, message = "currentYn 는 1자 이내여야 합니다.")
    private String currentYn;

    /** 조회할 페이지 번호 (1부터). PageHelper 가 offset 계산에 사용. */
    @Min(value = 1, message = "pageNo 는 1 이상이어야 합니다.")
    @Max(value = 100000, message = "pageNo 는 100000 이하여야 합니다.")
    private Integer pageNo;

    /** 페이지당 건수. 미지정 시 단순 목록(비페이징) 조회로 동작할 수 있음. */
    @Min(value = 1, message = "pageSize 는 1 이상이어야 합니다.")
    @Max(value = 100000, message = "pageSize 는 100000 이하여야 합니다.")
    private Integer pageSize;

    /** PageHelper.addPaging() 가 reflection 으로 자동 주입 — Mapper XML LIMIT 바인딩용. 직접 세팅 금지. */
    private Integer limit;

    /** PageHelper.addPaging() 가 reflection 으로 자동 주입 — Mapper XML OFFSET 바인딩용. 직접 세팅 금지. */
    private Integer offset;
}
