package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 회원 서비스 — base MbMemberService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbMemberService {

    private final MbMemberService mbMemberService;
    private final MbMemberRepository mbMemberRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public MbMemberDto.Item getById(String id) { return mbMemberService.getById(id); }
    /* 목록조회 */
    public List<MbMemberDto.Item> getList(MbMemberDto.Request req) { return mbMemberService.getList(req); }
    /* 페이지조회 */
    public MbMemberDto.PageResponse getPageData(MbMemberDto.Request req) { return mbMemberService.getPageData(req); }

    @Transactional public MbMember create(MbMember body) { return mbMemberService.create(body); }
    @Transactional public MbMember update(String id, MbMember body) { return mbMemberService.update(id, body); }
    @Transactional public void delete(String id) { mbMemberService.delete(id); }
    @Transactional public void saveList(List<MbMember> rows) { mbMemberService.saveList(rows); }

    /** changeStatus — memberStatusCd 변경 (이력 보존) */
    @Transactional
    public MbMemberDto.Item changeStatus(String id, String statusCd) {
        MbMember entity = mbMemberRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setMemberStatusCdBefore(entity.getMemberStatusCd());
        entity.setMemberStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        mbMemberRepository.save(entity);
        em.flush();
        return mbMemberService.getById(id);
    }
}
