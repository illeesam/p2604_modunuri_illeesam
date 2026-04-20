package com.shopjoy.ecadminapi.autorest.data.dto;

import java.util.LinkedHashMap;

/**
 * DB 조회 결과 및 동적 JSON 요청 바디를 담는 명시적 타입.
 * MyBatis resultType / @RequestBody 양쪽에서 사용.
 * LinkedHashMap을 상속하여 삽입 순서를 유지한다.
 */
public class RowMap extends LinkedHashMap<String, Object> {

    public RowMap() {
        super();
    }

    public RowMap(int initialCapacity) {
        super(initialCapacity);
    }
}
