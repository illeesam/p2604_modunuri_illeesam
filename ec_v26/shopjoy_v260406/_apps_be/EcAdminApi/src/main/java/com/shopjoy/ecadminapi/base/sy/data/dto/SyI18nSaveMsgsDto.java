package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * 다국어 메시지 일괄 저장 Request DTO.
 * 사용: PUT /api/bo/sy/i18n/{id}/msgs
 *
 * msgs: { langCode → message } 형식
 *   예: { "ko": "안녕하세요", "en": "Hello" }
 */
public class SyI18nSaveMsgsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        private Map<String, String> msgs;
    }
}
