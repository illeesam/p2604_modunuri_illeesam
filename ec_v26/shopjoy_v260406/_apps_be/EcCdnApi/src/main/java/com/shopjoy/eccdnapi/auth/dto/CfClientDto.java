package com.shopjoy.eccdnapi.auth.dto;

import com.shopjoy.eccdnapi.auth.entity.CfClient;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/** cf_client 목록/상세 응답 — client_pwd(해시) 는 절대 내려주지 않는다. */
@Getter
@Builder
public class CfClientDto {
    private String clientId;
    private String clientNm;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public static CfClientDto from(CfClient e) {
        return CfClientDto.builder()
            .clientId(e.getClientId())
            .clientNm(e.getClientNm())
            .useYn(e.getUseYn())
            .regBy(e.getRegBy())
            .regDate(e.getRegDate())
            .updBy(e.getUpdBy())
            .updDate(e.getUpdDate())
            .build();
    }
}
