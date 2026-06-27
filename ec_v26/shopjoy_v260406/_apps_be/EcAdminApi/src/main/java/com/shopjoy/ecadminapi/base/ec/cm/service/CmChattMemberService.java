package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMemberDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMember;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattMemberRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmChattMemberService {

    private final CmChattMemberRepository cmChattMemberRepository;

    @PersistenceContext
    private EntityManager em;

    public CmChattMemberDto.Item getById(String id) {
        CmChattMemberDto.Item dto = cmChattMemberRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public CmChattMember findById(String id) {
        return cmChattMemberRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        return cmChattMemberRepository.existsById(id);
    }

    public List<CmChattMemberDto.Item> getList(CmChattMemberDto.Request req) {
        return cmChattMemberRepository.selectList(req);
    }

    /** 채팅방 참여자 추가 */
    @Transactional
    public CmChattMember addMember(String chattId, String siteId, String memberTypeCd, String refId, String refNm) {
        CmChattMember member = new CmChattMember();
        member.setChattMemberId(CmUtil.generateId("cm_chatt_member"));
        member.setSiteId(siteId);
        member.setChattId(chattId);
        member.setMemberTypeCd(memberTypeCd);
        member.setRefId(refId);
        member.setRefNm(refNm);
        member.setUnreadCnt(0);
        member.setJoinDate(LocalDateTime.now());
        String authId = SecurityUtil.getAuthUser().authId();
        member.setRegBy(authId);
        member.setRegDate(LocalDateTime.now());
        member.setUpdBy(authId);
        member.setUpdDate(LocalDateTime.now());
        CmChattMember saved = cmChattMemberRepository.save(member);
        if (saved == null) throw new CmBizException("참여자 추가에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** 채팅방 퇴장 (leaveDate 설정) */
    @Transactional
    public void leaveMember(String chattMemberId) {
        CmUtil.requireId(chattMemberId, "chattMemberId", this);
        CmChattMember entity = findById(chattMemberId);
        entity.setLeaveDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        cmChattMemberRepository.save(entity);
        em.flush();
    }

    /** 미읽음 수 증가 */
    @Transactional
    public void incrementUnread(String chattMemberId) {
        CmChattMember entity = cmChattMemberRepository.findById(chattMemberId).orElse(null);
        if (entity == null) return;
        entity.setUnreadCnt(entity.getUnreadCnt() == null ? 1 : entity.getUnreadCnt() + 1);
        entity.setUpdBy("SYSTEM");
        entity.setUpdDate(LocalDateTime.now());
        cmChattMemberRepository.save(entity);
    }

    /** 미읽음 수 초기화 */
    @Transactional
    public void clearUnread(String chattMemberId) {
        CmChattMember entity = cmChattMemberRepository.findById(chattMemberId).orElse(null);
        if (entity == null) return;
        entity.setUnreadCnt(0);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        cmChattMemberRepository.save(entity);
        em.flush();
    }
}
