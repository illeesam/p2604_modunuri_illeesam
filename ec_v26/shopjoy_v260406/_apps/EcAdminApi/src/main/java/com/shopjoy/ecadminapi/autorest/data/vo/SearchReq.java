package com.shopjoy.ecadminapi.autorest.data.vo;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class SearchReq {
    private String kw;
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
