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

    /** 기간 검색 대상 컬럼 토큰. 예: "reg_date", "upd_date", "last_login_date" — Mapper XML 에서 dateType 으로 분기 */
    @Size(max = 50, message = "dateType 는 50자 이내여야 합니다.")
    private String dateType;

    /** 기간 검색 시작일 (포함). 형식 yyyy-MM-dd, 최대 10자. dateType 컬럼 기준 비교. */
    @Size(max = 10, message = "dateStart 는 10자 이내여야 합니다.")
    private String dateStart;

    /** 기간 검색 종료일 (포함). 형식 yyyy-MM-dd, 최대 10자. dateType 컬럼 기준 비교. */
    @Size(max = 10, message = "dateEnd 는 10자 이내여야 합니다.")
    private String dateEnd;

    /** 정렬 지정 토큰. 예: "regDate desc" — Mapper XML 의 ORDER BY 분기에 사용. */
    @Size(max = 50, message = "sort 는 50자 이내여야 합니다.")
    private String sort;

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
