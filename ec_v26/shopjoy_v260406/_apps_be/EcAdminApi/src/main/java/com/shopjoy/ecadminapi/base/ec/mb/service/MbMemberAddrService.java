package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
public class MbMemberAddrService {

    private final MbMemberAddrRepository mbMemberAddrRepository;

    @PersistenceContext
    private EntityManager em;

    public MbMemberAddrDto.Item getById(String id) {
        MbMemberAddrDto.Item dto = mbMemberAddrRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberAddrDto.Item getByIdOrNull(String id) {
        return mbMemberAddrRepository.selectById(id).orElse(null);
    }

    public MbMemberAddr findById(String id) {
        return mbMemberAddrRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberAddr findByIdOrNull(String id) {
        return mbMemberAddrRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return mbMemberAddrRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberAddrRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<MbMemberAddrDto.Item> getList(MbMemberAddrDto.Request req) {
        return mbMemberAddrRepository.selectList(req);
    }

    public MbMemberAddrDto.PageResponse getPageData(MbMemberAddrDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberAddrRepository.selectPageList(req);
    }

    @Transactional
    public MbMemberAddr create(MbMemberAddr body) {
        body.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberAddr save(MbMemberAddr entity) {
        if (!existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 MbMemberAddr입니다: " + entity.getMemberAddrId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberAddr update(String id, MbMemberAddr body) {
        MbMemberAddr entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberAddrId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = mbMemberAddrRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MbMemberAddr updateSelective(MbMemberAddr entity) {
        if (entity.getMemberAddrId() == null) throw new CmBizException("memberAddrId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberAddrId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberAddrId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberAddrRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        MbMemberAddr entity = findById(id);
        mbMemberAddrRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<MbMemberAddr> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getMemberAddrId() != null)
            .map(MbMemberAddr::getMemberAddrId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberAddrRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbMemberAddr> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getMemberAddrId() != null)
            .toList();
        for (MbMemberAddr row : updateRows) {
            MbMemberAddr entity = findById(row.getMemberAddrId());
            VoUtil.voCopyExclude(row, entity, "memberAddrId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbMemberAddrRepository.save(entity);
        }
        em.flush();

        List<MbMemberAddr> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberAddr row : insertRows) {
            row.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberAddrRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
