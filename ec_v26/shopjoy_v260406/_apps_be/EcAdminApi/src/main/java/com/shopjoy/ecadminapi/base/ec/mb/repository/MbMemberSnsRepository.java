package com.shopjoy.ecadminapi.base.ec.mb.repository;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberSnsRepository;

import java.util.Optional;

public interface MbMemberSnsRepository extends JpaRepository<MbMemberSns, String>, QMbMemberSnsRepository {

    /**
     * 소셜 로그인 매칭 키 (siteId + snsChannelCd + snsUserId) 정확 일치 조회.
     * 소셜 로그인에서 SNS 플랫폼 사용자ID로 기존 연동 회원을 찾을 때 사용한다.
     */
    Optional<MbMemberSns> findBySiteIdAndSnsChannelCdAndSnsUserId(
            String siteId, String snsChannelCd, String snsUserId);

    /**
     * 회원ID로 SNS 연동행 전체 삭제.
     * 회원 탈퇴(withdraw) 시 해당 회원의 모든 SNS 연동 정보를 제거할 때 사용한다.
     * 호출 서비스 메서드가 @Transactional 이면 Spring Data derived delete 가 동작한다.
     *
     * @return 삭제된 행 수
     */
    long deleteByMemberId(String memberId);
}
