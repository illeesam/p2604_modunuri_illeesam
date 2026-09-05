package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.service.SyUserPrefService;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyUserPrefService {

    private final SyUserPrefService syUserPrefService;

    /** 현재 로그인 사용자의 전체 개인화 설정 Map 반환 */
    public Map<String, String> getAll() {
        String userId = SecurityUtil.getAuthUser().authId();
        return syUserPrefService.getAll(userId);
    }

    /** 단일 키 저장/업데이트 */
    @Transactional
    public void upsert(String prefKey, String prefValue) {
        String userId = SecurityUtil.getAuthUser().authId();
        syUserPrefService.upsert(userId, prefKey, prefValue);
    }
}
