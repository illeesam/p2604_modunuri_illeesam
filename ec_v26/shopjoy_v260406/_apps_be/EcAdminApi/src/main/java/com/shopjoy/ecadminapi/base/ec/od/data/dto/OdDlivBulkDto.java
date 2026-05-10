package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * OdDliv 일괄 작업(상태/택배/결재) Request DTO.
 * 사용:
 *   PUT /api/bo/ec/od/dliv/bulk-status       (ids[] + status)
 *   PUT /api/bo/ec/od/dliv/bulk-courier      (ids[] + courier + trackingNo)
 *   PUT /api/bo/ec/od/dliv/bulk-approval     (ids[])
 *   PUT /api/bo/ec/od/dliv/bulk-approvalReq  (ids[])
 */
public class OdDlivBulkDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 일괄 대상 ID 목록 */
        private List<String> ids;
        /** 일괄 적용 배송 상태 코드 */
        private String status;
        /** 택배사 코드 */
        private String courier;
        /** 송장번호 */
        private String trackingNo;
        /** 결재/요청 메모 */
        private String memo;
        /** 결재 요청 대상 사용자 */
        private String approvalUserId;
    }
}
