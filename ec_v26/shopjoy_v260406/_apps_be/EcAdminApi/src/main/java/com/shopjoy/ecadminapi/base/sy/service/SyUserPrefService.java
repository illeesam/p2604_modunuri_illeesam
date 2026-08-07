package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserPrefRepository;
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
                        p -> p.getId().getPrefKey(),
                        p -> p.getPrefValue() != null ? p.getPrefValue() : "",
                        (a, b) -> b
                ));
    }

    /** 단일 키 upsert (INSERT or UPDATE) */
    @Transactional
    public void upsert(String userId, String prefKey, String prefValue) {
        SyUserPref.SyUserPrefId pk = new SyUserPref.SyUserPrefId(userId, prefKey);
        SyUserPref entity = syUserPrefRepository.findById(pk)
                .orElseGet(() -> SyUserPref.builder().id(pk).build());
        entity.setPrefValue(prefValue);
        syUserPrefRepository.save(entity);
    }
}
