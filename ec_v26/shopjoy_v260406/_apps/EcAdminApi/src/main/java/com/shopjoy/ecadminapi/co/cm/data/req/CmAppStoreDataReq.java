package com.shopjoy.ecadminapi.co.cm.data.req;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * 애플리케이션 Store 데이터 요청 DTO (BO/FO 공통)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CmAppStoreDataReq {

    @NotBlank(message = "siteId는 필수입니다.")
    private String siteId;

    @NotBlank(message = "userId는 필수입니다.")
    private String userId;

    @NotBlank(message = "roleId는 필수입니다.")
    private String roleId;

    private String names;
}
