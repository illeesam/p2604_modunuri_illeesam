package com.shopjoy.ecBeBo.base.ec.mb.repository;

import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberSns;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.mb.repository.qrydsl.QMbMemberSnsRepository;

/* findBySnsChannelCdAndSnsUserId → 단일테이블+조인 조회라 QMbMemberSnsRepository.selectList(snsChannelCd/snsUserId 필터) 로 전환 (2026-08-27, §14.6.9) */
public interface MbMemberSnsRepository extends JpaRepository<MbMemberSns, String>, QMbMemberSnsRepository {

    /**
     * 회원ID로 SNS 연동행 전체 삭제.
     * 회원 탈퇴(withdraw) 시 해당 회원의 모든 SNS 연동 정보를 제거할 때 사용한다.
     * 호출 서비스 메서드가 @Transactional 이면 Spring Data derived delete 가 동작한다.
     *
     * @return 삭제된 행 수
     */
    long deleteByMemberId(String memberId);
}
