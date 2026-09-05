package com.shopjoy.ecBeBo.base.sy.repository;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyUserRepository;

import java.util.Optional;

public interface SyUserRepository extends JpaRepository<SyUser, String>, QSyUserRepository {
    /* dept-counts 메서드는 QSyUserRepository(impl)로 이동 — 동적 native SQL */

    /** UNIQUE(login_id) 단건 조회 — 로그인 후 실패횟수/최근로그인 등 dirty-checking 저장 필요 */
    Optional<SyUser> findByLoginId(String loginId);
}
