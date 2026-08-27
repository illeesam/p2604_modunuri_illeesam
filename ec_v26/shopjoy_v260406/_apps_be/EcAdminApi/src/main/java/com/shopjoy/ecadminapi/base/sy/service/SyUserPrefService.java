package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserPrefRepository;
import com.shopjoy.ecadminapi.common.util.CmUtil;
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
        return syUserPrefRepository.selectAll(userId).stream()
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
        SyUserPref entity = syUserPrefRepository.selectByUserIdAndPrefKey(userId, prefKey)
                .orElseGet(() -> SyUserPref.builder()
                        .userPrefId(CmUtil.generateId("sy_user_pref"))
                        .userId(userId)
                        .prefKey(prefKey)
                        .build());
        entity.setPrefValue(prefValue);
        syUserPrefRepository.save(entity);
    }
}
