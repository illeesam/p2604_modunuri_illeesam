package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * OdClaim 일괄 작업(상태/유형/결재) Request DTO.
 * 사용:
 *   PUT /api/bo/ec/od/claim/bulk-status      (changes[] 행별 statusCd)
 *   PUT /api/bo/ec/od/claim/bulk-type        (ids[] + type)
 *   PUT /api/bo/ec/od/claim/bulk-approval    (ids[])
 *   PUT /api/bo/ec/od/claim/bulk-approvalReq (ids[])
 */
public class OdClaimBulkDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** 일괄 대상 ID 목록 */
        private List<String> ids;
        /** 일괄 적용 클레임 유형 코드 */
        private String type;
        /** 행별로 다른 statusCd를 적용할 때 사용 */
        private List<Change> changes;
        /** 결재/요청 메모 */
        private String memo;
        /** 결재 요청 대상 사용자 */
        private String approvalUserId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Change {
        private String id;
        private String statusCd;
    }
}
