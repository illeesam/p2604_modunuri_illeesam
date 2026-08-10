package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserPrefRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SyUserPrefRepository extends JpaRepository<SyUserPref, String>, QSyUserPrefRepository {

    /** (userId, prefKey) 로 단건 조회 — 복합 PK 를 대리키로 전환하면서 findById 를 대체한다.
     *  두 컬럼의 유일성은 sy_user_pref_uk_user_id_pref_key_x2 UNIQUE 제약이 보장한다. */
    Optional<SyUserPref> findByUserIdAndPrefKey(String userId, String prefKey);
}
