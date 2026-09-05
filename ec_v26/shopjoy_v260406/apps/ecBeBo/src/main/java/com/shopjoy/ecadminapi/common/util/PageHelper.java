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
 *
 * <p>주의사항: pageNo/pageSize 를 요청 스레드 단위 ThreadLocal 에 보관한다.
 * 같은 스레드 내 addPaging → getPageNo/getPageSize 순서를 지켜야 정상 동작하며,
 * 비동기(@Async)·다른 스레드로 넘어가면 컨텍스트가 전파되지 않아 기본값이 반환된다.
 * (요청 처리가 짧아 명시적 remove() 는 두지 않음 — 다음 요청 addPaging 시 덮어씀)
 */
public class PageHelper {

    /** 요청 파라미터의 페이지 번호 키. */
    public static final String PAGE_NO   = "pageNo";
    /** 요청 파라미터의 페이지 크기 키. */
    public static final String PAGE_SIZE = "pageSize";
    /** pageNo 미지정 시 기본값(1페이지). */
    public static final int    DEFAULT_PAGE_NO   = 1;
    /** pageSize 미지정 시 기본값(20건). */
    public static final int    DEFAULT_PAGE_SIZE = 20;

    /** 현재 스레드의 [pageNo, pageSize] 보관소. */
    private static final ThreadLocal<int[]> PAGE_CONTEXT = new ThreadLocal<>();

    /** 유틸 클래스 — 인스턴스화 금지. */
    private PageHelper() {}

    /**
     * Map 에 limit / offset 추가 + pageNo/pageSize 를 ThreadLocal 에 저장.
     *
     * <p>offset 은 {@code (pageNo - 1) * pageSize} 로 계산한다.
     * pageNo/pageSize 가 없거나 숫자가 아니면 기본값을 사용한다.
     *
     * @param p 쿼리 파라미터 Map (limit/offset 키가 추가됨 — 호출 후 원본이 변경됨)
     */
    public static void addPaging(Map<String, Object> p) {
        int pageNo   = toInt(p.get(PAGE_NO),   DEFAULT_PAGE_NO);
        int pageSize = toInt(p.get(PAGE_SIZE), DEFAULT_PAGE_SIZE);
        p.put("limit",  pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        PAGE_CONTEXT.set(new int[]{pageNo, pageSize});
    }

    /**
     * Request DTO 에 limit / offset setter 를 리플렉션으로 호출 + ThreadLocal 저장.
     *
     * <p>대상 객체에 getPageNo/getPageSize/setPageNo/setPageSize/setLimit/setOffset 가 있으면 호출한다.
     * 없는 setter 는 조용히 무시(부분 DTO 허용). pageNo/pageSize 가 null/비숫자면 기본값 적용.
     *
     * @param req Request DTO (null 이면 아무 동작 안 함)
     */
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

    /**
     * 무인자 getter 리플렉션 호출.
     *
     * @param target 대상 객체
     * @param name   메서드명(예: "getPageNo")
     * @return 반환값. 메서드가 없거나 호출 실패 시 null (호출 측에서 기본값 처리)
     */
    private static Object invokeGetter(Object target, String name) {
        try {
            Method m = target.getClass().getMethod(name);
            return m.invoke(target);
        } catch (ReflectiveOperationException e) {
            return null;
        }
    }

    /**
     * 단일 인자 setter 리플렉션 호출.
     *
     * @param target  대상 객체
     * @param name    메서드명(예: "setLimit")
     * @param argType 인자 타입(메서드 시그니처 매칭용)
     * @param value   설정할 값
     */
    private static void invokeSetter(Object target, String name, Class<?> argType, Object value) {
        try {
            Method m = target.getClass().getMethod(name, argType);
            m.invoke(target, value);
        } catch (ReflectiveOperationException ignored) {
            // setter 없음 — 무시 (Request DTO에 해당 필드 없을 수 있음)
        }
    }

    /**
     * 현재 스레드에 저장된 pageNo 반환.
     *
     * <p>{@code addPaging()} 호출 이후 같은 스레드에서만 유효.
     *
     * @return 저장된 pageNo, 미저장 시 {@link #DEFAULT_PAGE_NO}
     */
    public static int getPageNo() {
        int[] ctx = PAGE_CONTEXT.get();
        return ctx != null ? ctx[0] : DEFAULT_PAGE_NO;
    }

    /**
     * 현재 스레드에 저장된 pageSize 반환.
     *
     * <p>{@code addPaging()} 호출 이후 같은 스레드에서만 유효.
     *
     * @return 저장된 pageSize, 미저장 시 {@link #DEFAULT_PAGE_SIZE}
     */
    public static int getPageSize() {
        int[] ctx = PAGE_CONTEXT.get();
        return ctx != null ? ctx[1] : DEFAULT_PAGE_SIZE;
    }

    /**
     * 임의 객체를 int 로 안전 변환.
     *
     * <p>Number 면 intValue(), 문자열이면 parseInt 시도, 실패/널이면 기본값.
     *
     * @param val        변환 대상(Number/String/null 등)
     * @param defaultVal 변환 불가 시 기본값
     * @return 변환된 int 또는 defaultVal
     */
    private static int toInt(Object val, int defaultVal) {
        if (val == null) return defaultVal;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return defaultVal; }
    }
}
