package com.shopjoy.ecBeCdn.common.response;

import lombok.Getter;

import java.util.List;

/** 목록 화면 표준 페이징 응답 — EcAdminApi 의 PageResult 와 같은 필드명(pageList/pageTotalCount/pageTotalPage). */
@Getter
public class PageResult<T> {

    private final List<T> pageList;
    private final long pageTotalCount;
    private final int pageTotalPage;
    private final int pageNo;
    private final int pageSize;

    public PageResult(List<T> pageList, long pageTotalCount, int pageNo, int pageSize) {
        this.pageList = pageList;
        this.pageTotalCount = pageTotalCount;
        this.pageNo = pageNo;
        this.pageSize = pageSize;
        this.pageTotalPage = pageSize > 0 ? (int) Math.ceil((double) pageTotalCount / pageSize) : 0;
    }
}
