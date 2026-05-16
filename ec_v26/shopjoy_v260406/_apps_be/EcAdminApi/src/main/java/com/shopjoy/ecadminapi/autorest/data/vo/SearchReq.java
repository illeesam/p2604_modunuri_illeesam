package com.shopjoy.ecadminapi.autorest.data.vo;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class SearchReq {
    private String searchValue;
    private String searchType;     // 검색 대상 컬럼 토큰(콤마 구분). null/공백이면 전체 searchFields 적용
    private Map<String, Object> filters = new HashMap<>();
    private String dateField;
    private String dateStart;
    private String dateEnd;
    private String saleDateStart;
    private String saleDateEnd;
    private String dispDateStart;
    private String dispDateEnd;
    private String siteId;
    private String status;
    private String orderBy;
    private int pageNo = 1;
    private int pageSize = 20;
    private String sort = "reg_date";
    private String dir = "DESC";
}
