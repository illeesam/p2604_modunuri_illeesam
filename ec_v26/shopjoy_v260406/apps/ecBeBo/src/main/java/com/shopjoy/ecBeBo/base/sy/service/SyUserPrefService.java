package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecBeBo.base.sy.repository.SyUserPrefRepository;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyUserPrefService {

    private final SyUserPrefRepository syUserPrefRepository;

    /** userId 기준 전체 개인화 설정을 Map<prefKey, prefValue> 로 반환 */
    public Map<String, String> getAll(String userId) {
        // [쿼리 메서드] 관리자 사용자 개인화 설정 조건별 조회
        return syUserPrefRepository.findByUserIdOrderByPrefKeyAsc(userId).stream()
                .collect(Collectors.toMap(
                        SyUserPref::getPrefKey,
                        p -> p.getPrefValue() != null ? p.getPrefValue() : "",
                        (a, b) -> b
                ));
    }

    /** 단일 키 upsert (INSERT or UPDATE)
     *  복합 PK → 대리키 전환으로 findById 대신 (userId, prefKey) 조회로 기존 행을 찾는다. */
    @Transactional
    public void upsert(String userId, String prefKey, String prefValue) {
        // [쿼리 메서드] 관리자 사용자 개인화 설정 조건별 조회
        SyUserPref entity = syUserPrefRepository.findByUserIdAndPrefKey(userId, prefKey)
                .orElseGet(() -> SyUserPref.builder()
                        .userPrefId(CmUtil.generateId("sy_user_pref"))
                        .userId(userId)
                        .prefKey(prefKey)
                        .build());
        entity.setPrefValue(prefValue);
        // [쿼리 메서드] 관리자 사용자 개인화 설정 저장
        syUserPrefRepository.save(entity);
    }
}
