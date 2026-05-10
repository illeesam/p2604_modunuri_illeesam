package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 재입고 알림 발송 요청 DTO.
 * 사용: POST /api/bo/ec/pd/restock-noti/send
 */
public class PdRestockNotiSendDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 발송 대상 알림 ID 목록 */
        private List<String> ids;
    }
}
