package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 지도(맵) JS 키 응답 VO (BO/FO 공통, co 레이어).
 *
 * <p>클라이언트(브라우저)에서 카카오맵/네이버맵 JavaScript SDK 초기화에 사용하는
 * 공개키(클라이언트 노출 가능 키)만 담는다. 시크릿/REST 키는 절대 포함하지 않는다.</p>
 *
 * <p>필드 default 금지 정책: 모든 필드 null 시작 (VoUtil selective-update 전제).</p>
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapKeysRes {

    /** 카카오맵 JavaScript 키 (공개키, 카카오 디벨로퍼스 앱의 JavaScript 키). */
    private String kakaoMapJsKey;

    /** 네이버 클라우드 맵 Client ID (공개키, ncpClientId / ncpKeyId 로 SDK 로드 시 사용). */
    private String naverMapClientId;
}
