package com.shopjoy.ecadminapi.common.util;

import java.lang.reflect.Method;
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

    /** Request DTO에 limit / offset setter 호출 + ThreadLocal 저장
     *  대상 객체에는 getPageNo / getPageSize / setLimit / setOffset 메서드가 있어야 한다.
     *  pageNo / pageSize가 null이면 기본값 적용. */
    public static void addPaging(Object req) {
        if (req == null) return;
        int pageNo   = toInt(invokeGetter(req, "getPageNo"),   DEFAULT_PAGE_NO);
        int pageSize = toInt(invokeGetter(req, "getPageSize"), DEFAULT_PAGE_SIZE);
        invokeSetter(req, "setPageNo",   Integer.class, pageNo);
        invokeSetter(req, "setPageSize", Integer.class, pageSize);
        invokeSetter(req, "setLimit",    Integer.class, pageSize);
        invokeSetter(req, "setOffset",   Integer.class, (pageNo - 1) * pageSize);
        PAGE_CONTEXT.set(new int[]{pageNo, pageSize});
    }

    /* invokeGetter */
    private static Object invokeGetter(Object target, String name) {
        try {
            Method m = target.getClass().getMethod(name);
            return m.invoke(target);
        } catch (ReflectiveOperationException e) {
            return null;
        }
    }

    /* invokeSetter */
    private static void invokeSetter(Object target, String name, Class<?> argType, Object value) {
        try {
            Method m = target.getClass().getMethod(name, argType);
            m.invoke(target, value);
        } catch (ReflectiveOperationException ignored) {
            // setter 없음 — 무시 (Request DTO에 해당 필드 없을 수 있음)
        }
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

    /** toInt — 변환 */
    private static int toInt(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }
}
