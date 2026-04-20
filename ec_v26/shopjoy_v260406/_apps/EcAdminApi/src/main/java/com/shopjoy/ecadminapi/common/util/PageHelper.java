package com.shopjoy.ecadminapi.common.util;

import java.util.Map;

/**
 * 페이징 유틸리티.
 * addPaging(p) 호출 시 pageNo/pageSize를 ThreadLocal에 저장하여
 * 이후 getPageNo() / getPageSize() 로 파라미터 없이 조회 가능.
 *
 * 사용 순서:
 *   PageHelper.addPaging(p);                           // limit/offset 추가 + ThreadLocal 저장
 *   PageResult.of(..., PageHelper.getPageNo(), PageHelper.getPageSize(), p);
 */
public class PageHelper {

    public static final String PAGE_NO   = "pageNo";
    public static final String PAGE_SIZE = "pageSize";
    public static final int    DEFAULT_PAGE_NO   = 1;
    public static final int    DEFAULT_PAGE_SIZE = 20;

    private static final ThreadLocal<int[]> PAGE_CONTEXT = new ThreadLocal<>();

    private PageHelper() {}

    /** Map에 limit / offset 추가 + pageNo/pageSize ThreadLocal 저장 */
    public static void addPaging(Map<String, Object> p) {
        int pageNo   = toInt(p.get(PAGE_NO),   DEFAULT_PAGE_NO);
        int pageSize = toInt(p.get(PAGE_SIZE), DEFAULT_PAGE_SIZE);
        p.put("limit",  pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        PAGE_CONTEXT.set(new int[]{pageNo, pageSize});
    }

    /** addPaging() 이후 사용 가능. 저장된 pageNo 반환 */
    public static int getPageNo() {
        int[] ctx = PAGE_CONTEXT.get();
        return ctx != null ? ctx[0] : DEFAULT_PAGE_NO;
    }

    /** addPaging() 이후 사용 가능. 저장된 pageSize 반환 */
    public static int getPageSize() {
        int[] ctx = PAGE_CONTEXT.get();
        return ctx != null ? ctx[1] : DEFAULT_PAGE_SIZE;
    }

    private static int toInt(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }
}
