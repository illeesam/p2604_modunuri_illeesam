package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoMbMemberService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final MbMemberMapper mbMemberMapper;
    private final MbMemberRepository mbMemberRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<MbMemberDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mbMemberMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbMemberDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbMemberMapper.selectPageList(p), mbMemberMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public MbMemberDto getById(String id) {
        MbMemberDto dto = mbMemberMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public MbMember create(MbMember body) {
        body.setMemberId("MB" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        return mbMemberRepository.save(body);
    }

    @Transactional
    public MbMemberDto update(String id, MbMember body) {
        MbMember entity = mbMemberRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopy(body, entity, "memberId", "regBy", "regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMember saved = mbMemberRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        MbMember entity = mbMemberRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        mbMemberRepository.delete(entity);
        em.flush();
        if (mbMemberRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public MbMemberDto changeStatus(String id, String statusCd) {
        MbMember entity = mbMemberRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setMemberStatusCdBefore(entity.getMemberStatusCd());
        entity.setMemberStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        mbMemberRepository.save(entity);
        em.flush();
        return getById(id);
    }
    @Transactional
    public void saveList(List<MbMember> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberId() != null)
            .map(MbMember::getMemberId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (MbMember row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getMemberId(), "memberId must not be null");
            MbMember entity = mbMemberRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "memberId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (MbMember row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setMemberId("MB" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
