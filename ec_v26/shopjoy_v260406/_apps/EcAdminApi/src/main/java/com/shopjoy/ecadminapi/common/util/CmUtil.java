package com.shopjoy.ecadminapi.common.util;

import com.shopjoy.ecadminapi.common.exception.CmBizException;
import java.util.HashMap;
import java.util.Map;

/**
 * 공통 유틸리티.
 */
public class CmUtil {

    private CmUtil() {}

    /** @deprecated PageHelper.addPaging(p) 사용 */
    @Deprecated
    public static void addPaging(Map<String, Object> p) {
        PageHelper.addPaging(p);
    }

    /**
     * null·빈 값을 무시하며 Map 생성.
     * 사용: CmUtil.params("siteId", siteId, "kw", kw, ...)
     */
    public static Map<String, Object> params(Object... keyValues) {
        Map<String, Object> p = new HashMap<>();
        for (int i = 0; i < keyValues.length - 1; i += 2) {
            String key = String.valueOf(keyValues[i]);
            Object val = keyValues[i + 1];
            if (val instanceof String s) {
                if (s != null && !s.isBlank()) p.put(key, s);
            } else if (val != null) {
                p.put(key, val);
            }
        }
        return p;
    }

    /**
     * 필수 파라미터 존재 여부 검증. 없으면 CmBizException(400).
     * 사용: CmUtil.require(p, "siteId", "kw")
     */
    public static void require(Map<String, Object> p, String... keys) {
        for (String key : keys) {
            Object val = p.get(key);
            if (val == null || val.toString().isBlank()) {
                throw new CmBizException("필수 파라미터 누락: " + key);
            }
        }
    }

}
